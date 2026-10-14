# Connection failure investigation — 2026-10-14

## Evidence

Console export: `teron.app-1792008393072.log` (16,490 lines). Counts below describe visible log records, not a rate or a count of independent network incidents. Export has no per-event timestamps; stack traces are not additional incidents. All 1,921 lines of `teron.app-1792007757695.log` are an identical prefix of this export: it extends the same session, rather than recording a separate incident. Counts from those exports must not be added together.

- One configuration load and one generated application session ID; no `reload due ...` record.
- 49 occurrences of `WorkbenchClient: onConnect 1`.
- 98 occurrences of `detected connection state mismatch`, with repeated `numFailures: 1`, `2`, `3` sequences.
- 26 distinct visible LiveKit participant IDs in the same room, consistent with repeated fresh joins.
- 34 `websocket closed` records, including 25 with visible empty `reason` and truncated remaining context.
- Explicit failed WebSocket attempts: LiveKit signalling (1), presence/Pulse (3), collaborator (5), transactor (2).
- No `no ping response from server`, `WS-server not responding to ping`, or `ping timeout` message. Absence does not prove heartbeats succeeded.

Examples by export line:

| Line | Evidence |
| --- | --- |
| 127–131 | LiveKit signal connection fails; application recovery reports failure. |
| 153 | Pulse WebSocket connection fails. |
| 2692, 4613, 6822 | Collaborator connection attempts fail. |
| 10709–10723 | Transactor connection fails, then reconnects; LiveKit reports another mismatch. |
| 11742 | Pulse connection fails with `Close received after close`. |
| 12164–12165 | Track publication with a new LiveKit participant ID is followed by abnormal socket closure. |

URLs containing credentials were intentionally omitted.

## What the SDK actually reports

Installed LiveKit client is 2.15.14. `Room.registerConnectionReconcile` checks every four seconds whether the engine is absent/closed or `RTCEngine.verifyTransport()` fails. Three consecutive failures recreate the engine and disconnect with `STATE_MISMATCH`; application recovery then refreshes the token and joins again.

`verifyTransport` checks both the primary WebRTC transport and the signalling WebSocket. A mismatch alone therefore cannot distinguish ICE/media failure from signalling failure. The console export omits the existing `engine.closed` and `engine.transportsConnected` fields.

The SDK's `websocket closed` warning is emitted when close code differs from 1000. Its `code`, `wasClean` and `state` fields also disappear in the truncated export. Empty reason is insufficient to identify who closed the socket. `Close received after close` is a protocol/closure symptom, not proof that the server restarted or that a particular proxy caused it.

## Assessment

Confirmed: persistent connection churn affects several independent application services and LiveKit. The SDK reconciliation loop explains repeated fresh participant IDs and media republishing. The log does not demonstrate a complete page reload.

Leading hypothesis: interruption along a shared connection path (client/network or proxy/infrastructure). Failures across two hostnames and multiple services make a screen-capture-only bug insufficient to explain the incident. Without timestamps, overlap cannot be treated as proven simultaneity. Independent service failures remain possible.

Not established: proxy idle timeout, server restarts, resource exhaustion, browser suspension, token expiry, ICE misconfiguration, or a specific SDK defect. No deployed infrastructure was accessed. Repository Compose uses a different LiveKit hostname from the export; its configuration cannot be assumed to match production.

Previous UI/media fixes preserve state during recovery. They do not establish or repair the original cause of transport closures.

## Added diagnostics

`plugins/love-resources/src/connection-diagnostics.ts` preserves only the SDK's closure and mismatch events as single JSON text lines prefixed `[meeting-connection]`. Fields include UTC timestamp, room/participant IDs, close code, clean-close flag, signalling state, failure counter and engine/transport state. URLs, tokens and arbitrary SDK context are excluded. Existing SDK logs remain available; this adds no network requests.

## Evidence needed to isolate the source

1. After using a build containing diagnostics, capture `[meeting-connection]` records from presenter and viewer. Correlate UTC times; if code 1006 appears, it means abnormal closure without a received close frame, not a diagnosis by itself.
2. Capture browser Network WebSocket timing/close information for signalling, transactor, Pulse and collaborator. Compare connection lifetimes; a fixed lifetime supports testing a configured proxy timeout. Exclude credentials when sharing exports.
3. Correlate that same UTC window with LiveKit, transactor, Pulse, collaborator and proxy logs plus container restart/OOM events. A restart shared by users points to infrastructure; only one affected client with stable server logs points toward its connection path.
4. Compare SDK `engineClosed`/`transportsConnected` with WebRTC ICE/peer-connection state. If signalling stays healthy but ICE fails, inspect advertised SFU addresses, UDP/TCP reachability and TURN separately.

Server/proxy inspection remains read-only and requires the actual deployed environment and incident time window; none was attempted here.

## Server log follow-up supplied at 17:31 UTC−03

Reference time `2026-10-14T17:31:00-03:00` equals `2026-10-14T20:31:00Z`. Pasted Docker output interleaves historical records from September 28, October 13 and October 14, plus stack traces without timestamps. Output order does not establish chronological order or simultaneous failures.

### Confirmed additional findings

- At 20:23:35.125Z (17:23:35 local), LiveKit resumes a Safari participant with `RR_SIGNAL_DISCONNECTED`. Chrome participants become active around 20:23:34–35Z. This establishes a signalling interruption/recovery for Safari; it does not prove the Chrome events share the same initial cause. The displayed token expires at 20:33:11Z, after the resume, so expiry does not explain that resume.
- Several ICE pairs switch repeatedly within roughly a second. The SFU advertises private addresses on two Docker networks and several public server-reflexive UDP candidates. This warrants checking the deployed media/NAT configuration; selected public UDP pairs and successful activation show connectivity did work. Pair switching during establishment/recovery is insufficient proof of misconfiguration. Traefik handles signalling HTTP/WebSocket, not direct WebRTC UDP media.
- `/config.json` returns HTTP 200 at 20:23:23Z; image requests return HTTP 304 around 20:23:38Z and 20:29:00Z. Images were revalidated and reused from browser cache, rather than downloaded anew. These requests fit UI recreation/revalidation but do not prove an entire page reload or permanent loss of cache.
- Pulse repeatedly fails `CONFIG SET notify-keyspace-events` approximately once a minute. In repository `foundations/hulypulse/src/redis.rs`, `receiver` sleeps and continues its outer loop on that failure, never reaching `PSUBSCRIBE`. Thus that keyspace-event receiver is blocked by the Redis configuration restriction. The excerpt cannot establish whether another instance/path supplies notifications. This is a concrete presence-update issue, not a demonstrated cause of all WebSocket closures. Determine Redis backend/provider and existing notification configuration before proposing a deployed change; do not assume runtime `CONFIG SET` is supported.
- GitHub, Telegram and calendar report `EAI_AGAIN stats`; GitHub/calendar also report `ECONNREFUSED` on internal stats addresses. Internal DNS/service connectivity failed for those requests. Most affected stack traces lack timestamps, so they cannot yet be assigned to the call's incident window. Successful stats writes at 20:30Z demonstrate later reachability, not uninterrupted service.
- Stats rejects a mail-service token signature. This points to a signing-secret/token mismatch for that service request, not proof that participant login or LiveKit token signatures failed. Repository Compose configures `SERVER_SECRET` for stats but not mail; inspect effective deployed configuration without exposing secret values. This Compose discrepancy remains a lead, not a verified production configuration.
- Numerous Redpanda stalls range from tens of milliseconds to 388 ms. They warrant CPU/scheduling/disk checks but have no visible timestamps in those lines and do not prove resource exhaustion or explain multi-second disconnects.

### Misleading clock symptoms

Transactor's negative `totalTime` is explained by repository code: `SessionManager.now` is initialized once with `Date.now()`, while close logging calculates `this.now - session.createTime`. Sessions created later therefore yield negative durations. Tick/heartbeat logic uses fresh local `Date.now()` values. This logging bug is not evidence that the host clock moved backward.

Safari's audio/red sender reports advance RTP timestamps at about 8,000 ticks/second while media packet drift indicates roughly 48,000 ticks/second. This is a distinct sender-report/media clock mismatch lead. The packet counter remains at 477 across the shown reports; silence/DTX or capture stoppage can also leave this counter unchanged. Neither this mismatch nor the approximately 2.6-second sender/server NTP offset proves a wall-clock jump, transport outage or 2.6-second network latency. Reported RTT is roughly 273–317 ms in later samples. Investigate Safari media/RTCP separately if symptoms correlate.

### Updated priority

1. For the broad connection churn: timestamped LiveKit/proxy close reasons, host/container restart and resource metrics, plus Docker DNS/network health. Multi-service failures and a Safari signalling resume strengthen the infrastructure/shared-path lead but do not select a root cause.
2. For presence reliability: confirm effective Redis keyspace notification capabilities/settings; receiver startup is definitely blocked in the examined implementation when runtime configuration is rejected.
3. Separately: mail/stats signing configuration and Safari sender-report clock mismatch. Neither is established as the cause of screen-share blackouts.

Useful read-only collection on the deployed host (user-run; not executed by the agent):

```sh
docker compose logs --since '2026-10-14T20:20:00Z' --until '2026-10-14T20:31:00Z' --timestamps livekit transactor collaborator pulse
```

Use actual Compose service names (`pulse` may be `hulypulse`), and collect proxy logs for the same UTC interval separately. `--timestamps` adds Docker capture timestamps to otherwise untimed lines. Also inspect container restart counts/start times/OOM status and effective LiveKit RTC ports/NAT/TURN settings. Avoid posting environment dumps, authorization headers or SDP credentials.
