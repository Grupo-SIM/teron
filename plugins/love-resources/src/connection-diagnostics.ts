/** Preserve SDK connection details as text so browser console exports do not truncate objects. */
export function logConnectionDiagnostic (_level: unknown, message: string, context?: object): void {
  if (message !== 'websocket closed' && message !== 'detected connection state mismatch') return
  const details = context as {
    roomID?: string
    pID?: string
    code?: number
    wasClean?: boolean
    state?: string
    numFailures?: number
    engine?: { closed?: boolean, transportsConnected?: boolean }
  } | undefined
  console.warn('[meeting-connection] ' + JSON.stringify({
    timestamp: new Date().toISOString(),
    event: message,
    roomID: details?.roomID,
    participantID: details?.pID,
    code: details?.code,
    wasClean: details?.wasClean,
    state: details?.state,
    numFailures: details?.numFailures,
    engineClosed: details?.engine?.closed,
    transportsConnected: details?.engine?.transportsConnected
  }))
}
