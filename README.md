# Pazaak 1v1

Play [pazaak](https://en.wikipedia.org/wiki/Pazaak) (the KotOR card game) against a friend
in the browser, with the same art, sound and feel as the HK-47 single-player version. No
backend, no database — the room is a share link and the match runs peer-to-peer.

See [docs/2026-06-24-pazaak-1v1-multiplayer.md](docs/2026-06-24-pazaak-1v1-multiplayer.md)
for the full plan and design decisions.

## Status

| Phase | What | State |
| --- | --- | --- |
| 1 | TS engine port + parity tests (locks the event/state contract) | ✅ done |
| 2 | Local hot-seat (pass & play), own responsive UI, KotOR art + sound | ✅ done |
| 3 | Trystero P2P — rooms from a link, host-authoritative protocol, PWA/mobile | ✅ done |
| 4 | Reconnect/disconnect UX (resync from snapshot), turn/connection polish | ✅ done |
| 5 | Deck builder (optional; default decks for now) | ⬜ next |

### Reconnect / disconnect

If a peer drops, the other side shows a blocking overlay ("Friend disconnected — waiting…")
while keeping the board on screen; a connection dot in the header tracks the link state
(amber connecting / green connected / red dropped). When the peer returns, the host re-sends
a `resume` snapshot and the guest **rebuilds the whole board from that snapshot** (tables,
totals, standing, score) without replaying the lost event stream, then play continues.

Caveat: rediscovery speed is bounded by the WebTorrent tracker announce interval, so a
refreshed peer can take up to ~a minute to rejoin. (A relay strategy reconnects faster but
was less reliable here — see Transport above.)

## Playing online

1. Open the app → **Play a friend** → you become the **host** and get a `#room=<id>` link.
2. Send the link to a friend (Copy / native Share on mobile). They open it → **guest**.
3. Peers connect directly (WebRTC); the match starts automatically. **Pass & play** runs
   two players on one device with no network.

To test it yourself: open the host, then open the invite link in a second window
(incognito / another browser works too — each tab is its own peer).

### Transport

Signalling rides Trystero's **torrent** strategy (public WebTorrent trackers) — chosen after
the Nostr default rate-limited/timed out and MQTT brokers connected but didn't relay the
handshake reliably. Trackers only carry the WebRTC offer/answer; the game runs over the
direct peer-to-peer data channel. **No owned backend, no database, no managed service.** The
strategy is a one-line swap in [`src/net/protocol.ts`](src/net/protocol.ts) if a network
needs a different one. (Honest caveat: pure P2P can fail behind strict/symmetric NAT without
a TURN relay; for a handful of friends, STUN-only usually works.)

## Architecture

The game logic lives **entirely client-side** in `src/engine` — a faithful TypeScript port
of the Python `PazaakGame` / `PazaakSession` from the HK-47 repo. It is frontend- and
transport-agnostic:

- `cards.ts` — the authentic 23 KotOR II side cards + the shared 1-10 main deck.
- `engine.ts` — `PazaakGame`, the pure rules state machine (`legalActions` / `apply`).
- `session.ts` — `MatchSession`, which wraps the engine and emits an ordered, **player-
  neutral event stream** (`draw` / `play` / `stand` / `end_turn` / `set_over` /
  `match_over`) plus a per-seat `viewFor` snapshot that hides the opponent's hand.

This event stream is the contract that both the local board and the networked peers replay
to animate. For 1v1 the **host** holds the single engine instance; the guest sends actions
over the P2P channel and renders the broadcast events — RNG only ever lives on the host.

- `src/net` — `protocol.ts` (Trystero room + typed `sync`/`act` channels) and
  `useOnlineMatch.ts` (host-authoritative controller: host owns the `MatchSession`,
  broadcasts events + the guest's per-seat snapshot; guest is a thin renderer).
- `src/ui` — the (deliberately replaceable) board. `Board.tsx` renders any
  `MatchController`; `useMatch.ts` is the hot-seat driver, `replay.ts` the shared
  event-stream player, `cardArt.ts` / `sounds.ts` reuse the KotOR assets in
  `public/pazaak/`. `App.tsx` routes lobby ↔ hot-seat ↔ online off the URL hash.

The board is intentionally our own UI (not the fixed 800×600 KotOR panel) so it stays
responsive/PWA-friendly; only the **card art** is reused. `reference/` holds the original
HK-47 board component and the `.gui` layouts for reference only (excluded from build/lint).

## Develop

```sh
bun install
bun run dev      # http://127.0.0.1:7443  (or: make dev)
bun test         # 73 engine + session parity tests
bun run build    # tsc -b && vite build
bun run lint
```
