import {
  ConnectionState,
  setLogExtension,
  DisconnectReason,
  type RemoteParticipant,
  Room as LKRoom,
  RoomEvent,
  type VideoCaptureOptions,
  type RemoteTrack,
  type RemoteTrackPublication,
  Track,
  type LocalTrackPublication,
  type LocalParticipant,
  type TrackPublication,
  type Participant
} from 'livekit-client'
import { translate } from '@hcengineering/platform'
import { getMediaDevices, getSelectedSpeakerId, type MediaSession } from '@hcengineering/media'
import { LoveEvents } from '@hcengineering/love'
import { useMedia } from '@hcengineering/media-resources'
import { writable } from 'svelte/store'
import { Analytics } from '@hcengineering/analytics'
import { addNotification, NotificationSeverity } from '@hcengineering/ui'
import { getCurrentLanguage } from '@hcengineering/theme'
import LastParticipantNotification from './components/meeting/LastParticipantNotification.svelte'
import love from './plugin'
import { $myPreferences } from './stores'
import { leaveMeeting } from './meetings'
import { voiceReconnectPolicy } from './voice-reconnect-policy'
import { logConnectionDiagnostic } from './connection-diagnostics'

setLogExtension(logConnectionDiagnostic)

export enum ScreenSharingState {
  Inactive,
  Local,
  Remote
}

export const screenSharingState = writable<ScreenSharingState>(ScreenSharingState.Inactive)
export const lkSessionConnected = writable<boolean>(false)

const LAST_PARTICIPANT_NOTIFICATION_DELAY_MS = 2 * 60 * 1000
const AUTO_DISCONNECT_DELAY_MS = 60 * 1000

export function getLiveKitClient (): LiveKitClient {
  return new LiveKitClient()
}

const defaultCaptureOptions: VideoCaptureOptions = {
  facingMode: 'user',
  resolution: {
    width: 1280,
    height: 720,
    frameRate: 30
  }
}

export class LiveKitClient {
  public readonly liveKitRoom: LKRoom

  public isConnecting: boolean = false
  public currentMediaSession: MediaSession | undefined = undefined
  private currentSessionSupportsVideo: boolean = false
  private lastParticipantNotificationTimeout: number = -1
  private lastParticipantDisconnectTimeout: number = -1
  private lastParticipantGeneration: number = 0
  private recoveryGeneration: number = 0
  private connection: { wsURL: string, refreshToken: () => Promise<string> } | undefined
  private recovery: Promise<void> | undefined
  private cancelRecoveryDelay: (() => void) | undefined
  // Keep capture alive when SDK teardown stops its published tracks.
  private readonly screenCapture = new Map<Track.Source, MediaStreamTrack>()
  private cameraEnabled: boolean = false
  private microphoneEnabled: boolean = false

  constructor () {
    const lkRoom = new LKRoom({
      reconnectPolicy: voiceReconnectPolicy,
      adaptiveStream: true,
      dynacast: true,
      publishDefaults: {
        videoCodec: 'vp9',
        screenShareEncoding: {
          maxBitrate: 7_000_000,
          maxFramerate: 15,
          priority: 'high'
        }
      },
      audioCaptureDefaults: {
        autoGainControl: true,
        echoCancellation: true,
        noiseSuppression: true
      },
      audioOutput: {
        deviceId: getSelectedSpeakerId()
      },
      videoCaptureDefaults: defaultCaptureOptions
    })
    lkRoom.on(RoomEvent.Connected, this.onConnected)
    lkRoom.on(RoomEvent.Disconnected, this.onDisconnected)
    lkRoom.on(RoomEvent.Reconnecting, this.onReconnecting)
    lkRoom.on(RoomEvent.SignalReconnecting, this.onReconnecting)
    lkRoom.on(RoomEvent.Reconnected, this.onReconnected)
    this.liveKitRoom = lkRoom
  }

  async prepareConnection (wsUrl: string, token: string): Promise<void> {
    await this.liveKitRoom.prepareConnection(wsUrl, token)
  }

  async connect (wsURL: string, token: string, withVideo: boolean, refreshToken?: () => Promise<string>): Promise<void> {
    this.cancelRecovery()
    await this.recovery
    this.connection = refreshToken === undefined ? undefined : { wsURL, refreshToken }
    this.isConnecting = true
    this.currentSessionSupportsVideo = withVideo
    try {
      const setupMediaSession = async (): Promise<void> => {
        this.currentMediaSession = await useMedia({
          state: {
            camera: this.currentSessionSupportsVideo ? { enabled: $myPreferences?.camEnabled ?? true } : undefined,
            microphone: { enabled: $myPreferences?.micEnabled ?? this.liveKitRoom.remoteParticipants.size < 16 }
          },
          autoDestroy: false
        })
      }
      await Promise.all([
        this.liveKitRoom.connect(wsURL, token, {
          maxRetries: 1,
          websocketTimeout: 10000,
          peerConnectionTimeout: 10000
        }),
        setupMediaSession()
      ])

      this.cameraEnabled = this.currentMediaSession?.state.camera?.enabled ?? false
      this.microphoneEnabled = this.currentMediaSession?.state.microphone?.enabled ?? false
      this.currentMediaSession?.on('camera', (enabled) => {
        void this.setCameraEnabled(enabled)
      })
      this.currentMediaSession?.on('microphone', (enabled) => {
        void this.setMicrophoneEnabled(enabled)
      })
      this.currentMediaSession?.on('selected-camera', (deviceId) => {
        void this.setActiveCamera(deviceId)
      })
      this.currentMediaSession?.on('selected-microphone', (deviceId) => {
        void this.setActiveMicrophone(deviceId)
      })
      this.currentMediaSession?.on('selected-speaker', (deviceId) => {
        void this.setActiveSpeaker(deviceId)
      })
      this.currentMediaSession?.on('feature', (feature, enabled) => {
        if (feature !== 'sharing') return
        void this.setScreenShareEnabled(enabled, true)
      })

      await this.updateActiveDevices()
    } catch (error) {
      this.cancelRecovery()
      this.isConnecting = false
      this.currentMediaSession?.close()
      this.currentMediaSession?.removeAllListeners()
      this.currentMediaSession = undefined
      throw error
    }
  }

  async disconnect (): Promise<void> {
    this.cancelRecovery()
    screenSharingState.set(ScreenSharingState.Inactive)
    this.clearLastParticipantTimeouts()
    await this.recovery
    const me = this.liveKitRoom.localParticipant
    await Promise.allSettled([me.setScreenShareEnabled(false), me.setCameraEnabled(false), me.setMicrophoneEnabled(false)])
    try {
      await this.liveKitRoom.disconnect()
    } finally {
      this.isConnecting = false
      lkSessionConnected.set(false)
      this.currentSessionSupportsVideo = false
      this.currentMediaSession?.close()
      this.currentMediaSession?.removeAllListeners()
      this.currentMediaSession = undefined
    }
  }

  async awaitConnect (): Promise<void> {
    await new Promise<void>((resolve) => {
      if (this.liveKitRoom.state === ConnectionState.Connected) {
        resolve()
        return
      }
      const onConnected = (): void => {
        this.liveKitRoom.off(RoomEvent.Connected, onConnected)
        this.liveKitRoom.off(RoomEvent.Reconnected, onConnected)
        resolve()
      }
      this.liveKitRoom.once(RoomEvent.Connected, onConnected)
      this.liveKitRoom.once(RoomEvent.Reconnected, onConnected)
    })
  }

  onReconnecting = (): void => {
    this.isConnecting = true
    this.clearLastParticipantTimeouts()
  }

  onReconnected = (): void => {
    this.isConnecting = false
    lkSessionConnected.set(true)
    this.clearLastParticipantTimeouts()
  }

  onConnected = (): void => {
    this.isConnecting = false
    lkSessionConnected.set(true)
    this.liveKitRoom.off(RoomEvent.ParticipantConnected, this.onParticipantConnected)
    this.liveKitRoom.on(RoomEvent.ParticipantConnected, this.onParticipantConnected)
    this.liveKitRoom.off(RoomEvent.ParticipantDisconnected, this.onParticipantDisconnected)
    this.liveKitRoom.on(RoomEvent.ParticipantDisconnected, this.onParticipantDisconnected)
    this.liveKitRoom.off(RoomEvent.TrackSubscribed, this.onTrackSubscribed)
    this.liveKitRoom.on(RoomEvent.TrackSubscribed, this.onTrackSubscribed)
    this.liveKitRoom.off(RoomEvent.TrackUnsubscribed, this.onTrackUnsubscribed)
    this.liveKitRoom.on(RoomEvent.TrackUnsubscribed, this.onTrackUnsubscribed)
    this.liveKitRoom.off(RoomEvent.LocalTrackPublished, this.onLocalTrackPublished)
    this.liveKitRoom.on(RoomEvent.LocalTrackPublished, this.onLocalTrackPublished)
    this.liveKitRoom.off(RoomEvent.LocalTrackUnpublished, this.onLocalTrackUnpublished)
    this.liveKitRoom.on(RoomEvent.LocalTrackUnpublished, this.onLocalTrackUnpublished)
    this.liveKitRoom.off(RoomEvent.TrackMuted, this.onTrackMuted)
    this.liveKitRoom.on(RoomEvent.TrackMuted, this.onTrackMuted)
    this.liveKitRoom.off(RoomEvent.TrackUnmuted, this.onTrackUnmuted)
    this.liveKitRoom.on(RoomEvent.TrackUnmuted, this.onTrackUnmuted)
  }

  onDisconnected = (reason?: DisconnectReason): void => {
    // STATE_MISMATCH bypasses the SDK reconnect policy and needs a fresh join.
    const recoverable = reason === undefined ||
      reason === DisconnectReason.UNKNOWN_REASON ||
      reason === DisconnectReason.SERVER_SHUTDOWN ||
      reason === DisconnectReason.STATE_MISMATCH ||
      reason === DisconnectReason.JOIN_FAILURE ||
      reason === DisconnectReason.MIGRATION ||
      reason === DisconnectReason.SIGNAL_CLOSE
    if (recoverable && this.connection !== undefined) {
      this.isConnecting = true
      this.clearLastParticipantTimeouts()
      screenSharingState.set(ScreenSharingState.Inactive)
      if (this.recovery === undefined) {
        const generation = this.recoveryGeneration
        this.recovery = this.recoverConnection(generation).finally(() => { this.recovery = undefined })
      }
      return
    }
    this.cancelRecovery()
    this.isConnecting = false
    this.clearLastParticipantTimeouts()
    screenSharingState.set(ScreenSharingState.Inactive)
    this.currentMediaSession?.close()
    this.currentMediaSession?.removeAllListeners()
    this.currentMediaSession = undefined
    lkSessionConnected.set(false)
    this.liveKitRoom.off(RoomEvent.ParticipantConnected, this.onParticipantConnected)
    this.liveKitRoom.off(RoomEvent.ParticipantDisconnected, this.onParticipantDisconnected)
    this.liveKitRoom.off(RoomEvent.TrackSubscribed, this.onTrackSubscribed)
    this.liveKitRoom.off(RoomEvent.TrackUnsubscribed, this.onTrackUnsubscribed)
    this.liveKitRoom.off(RoomEvent.LocalTrackPublished, this.onLocalTrackPublished)
    this.liveKitRoom.off(RoomEvent.LocalTrackUnpublished, this.onLocalTrackUnpublished)
    this.liveKitRoom.off(RoomEvent.TrackMuted, this.onTrackMuted)
    this.liveKitRoom.off(RoomEvent.TrackUnmuted, this.onTrackUnmuted)
    Analytics.handleEvent(LoveEvents.DisconnectedFromRoom)
  }

  cancelRecovery (): void {
    this.releaseScreenCapture()
    this.recoveryGeneration++
    this.connection = undefined
    this.cancelRecoveryDelay?.()
  }

  private async recoverConnection (generation: number): Promise<void> {
    let attempt = 0
    await this.waitForRecovery(300)
    while (generation === this.recoveryGeneration && this.connection !== undefined) {
      const connection = this.connection
      try {
        const token = await connection.refreshToken()
        if (generation !== this.recoveryGeneration) return
        await this.liveKitRoom.connect(connection.wsURL, token, {
          maxRetries: 1,
          websocketTimeout: 10000,
          peerConnectionTimeout: 10000
        })
        if (generation !== this.recoveryGeneration) {
          await this.liveKitRoom.disconnect()
          return
        }
        await this.setActiveCamera(this.currentMediaSession?.state.camera?.deviceId)
        await this.setActiveMicrophone(this.currentMediaSession?.state.microphone?.deviceId)
        await this.setCameraEnabled(this.cameraEnabled)
        await this.setMicrophoneEnabled(this.microphoneEnabled)
        if (generation !== this.recoveryGeneration) return
        await this.restoreScreenCapture()
        // A second terminal disconnect can arrive while devices are restoring.
        // Its handler shares this recovery promise, so keep retrying here.
        if (generation !== this.recoveryGeneration) return
        if (this.liveKitRoom.state === ConnectionState.Disconnected) {
          await this.waitForRecovery(Math.min(1000 * 2 ** Math.min(attempt++, 5), 30000))
          continue
        }
        return
      } catch (error) {
        if (generation !== this.recoveryGeneration) return
        console.error('Failed to recover meeting connection', error)
        if (this.liveKitRoom.state === ConnectionState.Connected &&
          [...this.screenCapture.keys()].every(source =>
            this.liveKitRoom.localParticipant.getTrackPublication(source) !== undefined)) return
        await this.waitForRecovery(Math.min(1000 * 2 ** Math.min(attempt++, 5), 30000))
      }
    }
  }

  private async waitForRecovery (delay: number): Promise<void> {
    await new Promise<void>((resolve) => {
      const finish = (): void => {
        clearTimeout(timer)
        this.cancelRecoveryDelay = undefined
        resolve()
      }
      const timer = window.setTimeout(finish, delay)
      this.cancelRecoveryDelay = finish
    })
  }

  private clearLastParticipantTimeouts (): void {
    this.lastParticipantGeneration++
    clearTimeout(this.lastParticipantDisconnectTimeout)
    clearTimeout(this.lastParticipantNotificationTimeout)
  }

  onParticipantConnected = (_participant: RemoteParticipant): void => {
    this.clearLastParticipantTimeouts()
  }

  onParticipantDisconnected = (_participant: RemoteParticipant): void => {
    if (this.liveKitRoom.state === ConnectionState.Connected && this.liveKitRoom.remoteParticipants.size === 0) {
      this.clearLastParticipantTimeouts()
      this.lastParticipantNotificationTimeout = window.setTimeout(() => {
        void this.showLastParticipantNotification()
      }, LAST_PARTICIPANT_NOTIFICATION_DELAY_MS)
    }
  }

  onTrackSubscribed = (
    track: RemoteTrack,
    _publication: RemoteTrackPublication,
    _participant: RemoteParticipant
  ): void => {
    if (track.kind === Track.Kind.Video && track.source === Track.Source.ScreenShare) {
      screenSharingState.set(ScreenSharingState.Remote)
    }
  }

  onTrackUnsubscribed = (
    track: RemoteTrack,
    _publication: RemoteTrackPublication,
    _participant: RemoteParticipant
  ): void => {
    if (track.kind === Track.Kind.Video && track.source === Track.Source.ScreenShare) {
      screenSharingState.set(ScreenSharingState.Inactive)
    }
  }

  onLocalTrackPublished = (publication: LocalTrackPublication, _participant: LocalParticipant): void => {
    const session = this.currentMediaSession
    const track = publication.track?.mediaStreamTrack
    const deviceId = track?.getSettings().deviceId
    const source = publication.track?.source
    if (track !== undefined && (source === Track.Source.ScreenShare || source === Track.Source.ScreenShareAudio)) {
      if (!this.screenCapture.has(source)) this.screenCapture.set(source, track.clone())
    }
    if (publication.track?.kind === Track.Kind.Video) {
      if (publication.track.source === Track.Source.ScreenShare) {
        session?.setFeature('sharing', { enabled: true, track, deviceId })
        screenSharingState.set(ScreenSharingState.Local)
      } else {
        session?.setCamera({ enabled: true, track, deviceId })
      }
    } else if (publication.track?.kind === Track.Kind.Audio && source === Track.Source.Microphone) {
      session?.setMicrophone({ enabled: true, track, deviceId })
    }
  }

  onLocalTrackUnpublished = (publication: LocalTrackPublication, _participant: LocalParticipant): void => {
    if (this.isConnecting || this.liveKitRoom.state !== ConnectionState.Connected) return
    const session = this.currentMediaSession
    if (publication.track?.kind === Track.Kind.Video) {
      if (publication.track.source === Track.Source.ScreenShare) {
        this.releaseScreenCapture()
        session?.setFeature('sharing', { enabled: false })
        screenSharingState.set(ScreenSharingState.Inactive)
      }
    }
    // SDK teardown unpublishes camera/microphone before Disconnected. Keep the
    // user's desired state so a fresh connection restores it.
  }

  onTrackMuted = (publication: TrackPublication, participant: Participant): void => {
    if (!participant.isLocal) return
    const session = this.currentMediaSession
    if (publication.track?.kind === Track.Kind.Video && publication.track.source === Track.Source.Camera) {
      session?.setCamera({ enabled: false })
    } else if (publication.track?.kind === Track.Kind.Audio && publication.track.source === Track.Source.Microphone) {
      session?.setMicrophone({ enabled: false })
    }
  }

  onTrackUnmuted = (publication: TrackPublication, participant: Participant): void => {
    if (!participant.isLocal) return
    const session = this.currentMediaSession
    const track = publication.track?.mediaStreamTrack
    const deviceId = track?.getSettings().deviceId
    if (publication.track?.kind === Track.Kind.Video && publication.track?.source === Track.Source.Camera) {
      session?.setCamera({ enabled: true, track, deviceId })
    } else if (publication.track?.kind === Track.Kind.Audio && publication.track.source === Track.Source.Microphone) {
      session?.setMicrophone({ enabled: true, track, deviceId })
    }
  }

  async showLastParticipantNotification (): Promise<void> {
    const generation = this.lastParticipantGeneration
    const title = await translate(love.string.MeetingEmptyTitle, {}, getCurrentLanguage())
    const message = await translate(love.string.MeetingEmptyMessage, {}, getCurrentLanguage())
    const isStillEmpty = (): boolean =>
      generation === this.lastParticipantGeneration &&
      this.liveKitRoom.state === ConnectionState.Connected &&
      this.liveKitRoom.remoteParticipants.size === 0
    if (!isStillEmpty()) return

    addNotification(
      title,
      message,
      LastParticipantNotification,
      undefined,
      NotificationSeverity.Info,
      'love'
    )
    this.lastParticipantDisconnectTimeout = window.setTimeout(() => {
      if (isStillEmpty()) void leaveMeeting()
    }, AUTO_DISCONNECT_DELAY_MS)
  }

  async updateActiveDevices (): Promise<void> {
    await this.setActiveCamera(this.currentMediaSession?.state.camera?.deviceId)
    await this.setActiveMicrophone(this.currentMediaSession?.state.microphone?.deviceId)
    await this.setCameraEnabled(this.currentMediaSession?.state.camera?.enabled ?? false)
    await this.setMicrophoneEnabled(this.currentMediaSession?.state.microphone?.enabled ?? false)
  }

  async setActiveCamera (deviceId: string | undefined): Promise<void> {
    if (deviceId === undefined || deviceId === null) return
    if (!this.currentSessionSupportsVideo) return
    await this.liveKitRoom.switchActiveDevice('videoinput', deviceId, true)
  }

  async setActiveMicrophone (deviceId: string | undefined): Promise<void> {
    if (deviceId === undefined || deviceId === null) return
    await this.liveKitRoom.switchActiveDevice('audioinput', deviceId, true)
  }

  async setActiveSpeaker (deviceId: string | undefined): Promise<void> {
    if (deviceId === undefined || deviceId === null) return
    try {
      await this.liveKitRoom.switchActiveDevice('audiooutput', deviceId, true)
    } catch (error) {
      console.log(error)
    }
  }

  async setCameraEnabled (value: boolean): Promise<void> {
    this.cameraEnabled = value
    if (this.liveKitRoom.state !== ConnectionState.Connected) return
    if (!this.currentSessionSupportsVideo) return
    try {
      await this.liveKitRoom.localParticipant.setCameraEnabled(value)
    } catch (e) {
      if (value) {
        const mediaDevices = await getMediaDevices(false, true)
        if (mediaDevices.activeCamera !== undefined) {
          await this.setActiveCamera(mediaDevices.activeCamera.deviceId)
          await this.liveKitRoom.localParticipant.setCameraEnabled(true)
        }
      }
    }
  }

  async setMicrophoneEnabled (value: boolean): Promise<void> {
    this.microphoneEnabled = value
    if (this.liveKitRoom.state !== ConnectionState.Connected) return
    try {
      await this.liveKitRoom.localParticipant.setMicrophoneEnabled(value)
    } catch (e) {
      if (value) {
        const mediaDevices = await getMediaDevices(true, false)
        if (mediaDevices.activeMicrophone !== undefined) {
          await this.setActiveMicrophone(mediaDevices.activeMicrophone.deviceId)
          await this.liveKitRoom.localParticipant.setMicrophoneEnabled(true)
        }
      }
    }
  }

  private releaseScreenCapture (): void {
    for (const track of this.screenCapture.values()) track.stop()
    this.screenCapture.clear()
  }

  private async restoreScreenCapture (): Promise<void> {
    const video = this.screenCapture.get(Track.Source.ScreenShare)
    if (video === undefined) return
    if (video.readyState === 'ended') {
      this.releaseScreenCapture()
      this.currentMediaSession?.setFeature('sharing', { enabled: false })
      return
    }
    for (const [source, capture] of this.screenCapture) {
      if (capture.readyState === 'ended') continue
      if (this.liveKitRoom.state !== ConnectionState.Connected) return
      if (this.liveKitRoom.localParticipant.getTrackPublication(source) !== undefined) continue
      const track = capture.clone()
      try {
        await this.liveKitRoom.localParticipant.publishTrack(track, { source })
      } catch (error) {
        track.stop()
        throw error
      }
    }
  }

  async setScreenShareEnabled (value: boolean, withAudio: boolean = false): Promise<void> {
    if (!value) this.releaseScreenCapture()
    try {
      await this.liveKitRoom.localParticipant.setScreenShareEnabled(value, { audio: withAudio })
    } catch (e) {
      console.log(e)
    }
  }
}
