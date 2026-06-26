# Pazaak 1v1 (human-vs-human) — plan

A separate project/repo from the HK-47 app. Goal: play pazaak against a friend in the
browser with the same UI / sound / feel as the singleplayer version. Hard constraints from
the user:

- **For friends only** — no cheat protection needed (no authoritative anti-cheat server).
- **Minimal architecture** — ideally **no backend** and **no Supabase**.
- **Rooms must work somehow** (join a friend's game).
- Fidelity of **UI / sound / feeling** is the priority (same as singleplayer).

## Key decisions

### 1. Engine runs client-side — port to TypeScript (recommended) vs pyodide
"No backend" is achieved by running game logic *in the browser*, which can be native JS/TS —
pyodide is only one option, not the thing that removes the backend.

- **TS port (recommended):** the rules are ~300 lines of simple logic, already specified and
  test-covered in Python. Native, tiny, instant load, no Python↔JS marshalling. A one-time
  low-risk port. Best for the "feeling" goal (no multi-second pyodide init).
- **Pyodide:** reuse the Python engine verbatim, but ~6-10 MB download + seconds of init +
  interop friction. Only worth it to avoid maintaining a second implementation — but this is a
  separate repo anyway, so they're already decoupled.

### 2. Transport — P2P WebRTC, no owned backend
- **Trystero (recommended):** serverless WebRTC. Room = a string (from a share link, e.g.
  `#room=xyz`); peer matchmaking rides public infra (BitTorrent / Nostr / MQTT / Firebase
  strategies). Zero owned infrastructure, tiny API. Directly solves "handle rooms without a
  backend".
- PeerJS: P2P via their free signaling broker; rooms = sharing peer IDs (clunkier).
- Manual copy-paste WebRTC: truly zero third-party, ugly UX — last-resort fallback.
- Managed realtime (Supabase/Firebase/Ably free tier): most reliable (no NAT issues) but it's
  an account + service the user wants to avoid. Keep as an **escape hatch** if P2P NAT
  traversal proves flaky.

**NAT caveat (honest):** pure P2P can fail behind strict/symmetric NAT without a TURN relay
(TURN isn't free). For a handful of friends, STUN-only usually works; if a connection flakes,
fall back to a TURN server or the managed escape hatch.

### 3. Authority — host-authoritative
The room creator is the **host**: their browser holds the single engine instance. The guest is
a thin renderer that sends actions over the P2P channel and renders what the host broadcasts.
Avoids desync over who shuffles/draws (RNG lives only on the host). Maps directly onto the
singleplayer session design (just both players are human).

Hidden hand: the host sends each peer only their own `view_for(player)` snapshot, so an
unplayed hand never reaches the opponent's DOM. The event stream (`draw`/`play`/`stand`/
`end_turn`/`set_over`/`match_over`) is all public info → broadcast to both; only the per-player
`state` snapshot differs.

### 4. Shared event-stream schema → shared board
Make the TS engine emit the **same event stream and `state` shape** as the Python
`PazaakSession`. Then one board component (UI + sounds, art from `assets/pazaak/`) renders both
this 1v1 project and the HK-47 singleplayer app. UI/sound/feel is built once. This is the main
reason to keep the contract identical across the two implementations.

## Recommended stack

```
Cloudflare Pages (static SPA)
  └─ TS pazaak engine (client-side, host-authoritative)
  └─ Trystero (P2P data channel, room from a share-link string)
  └─ board renderer driven by the shared event-stream schema, art/sound from assets/pazaak/
```

No server, no database, room via link. Accepted trade-offs: host refresh = game lost (no
persistence); rare NAT failure needs TURN/escape-hatch.

## Game flow

1. Host opens app → creates room → gets a shareable link (`#room=<id>`).
2. Guest opens link → Trystero joins the room → P2P channel up.
3. Deck selection: each player picks their 10-card side deck (setup screen, `pazaaksetup_p`
   layout) or a default; guest sends their deck to the host.
4. Host builds the game (first player random), runs the rules.
5. Turn loop: active player sees action buttons; host applies own actions locally, receives
   guest actions over the channel, recomputes, broadcasts events (both) + per-player state.
6. Match end → both see the outcome. (Optional flavour: taunt emotes — out of scope for v1.)

## Phasing

1. **Engine port + parity tests** — port Python engine to TS; port the test suite; verify the
   emitted event stream / state schema matches the Python `PazaakSession` byte-for-byte on
   shared fixtures. (Lock the contract first.)
2. **Local 2-player (hot-seat)** — one browser, no network, both players via the engine.
   Proves the board + event rendering + sounds with zero transport risk.
3. **Trystero wiring** — rooms from link, host-authoritative message protocol (actions up,
   events+state down), connection/disconnect UX.
4. **Board UI + sound polish** — reuse the singleplayer board component; art from
   `assets/pazaak/`; KotOR sound cues per event type.
5. **Deck builder** (optional) — pick your 10; otherwise default decks.

## Open decisions
- Engine: **TS port** (recommended) vs pyodide.
- Transport: **Trystero** (recommended) vs PeerJS vs managed escape-hatch.
- Trystero strategy (BitTorrent vs Nostr vs MQTT vs Firebase) — pick by reliability; can start
  with the default and swap.
- Deck builder in v1, or fixed/default decks first?
- Accept "host refresh = game over", or add lightweight state persistence later?
- Share the board component as an extracted package across both repos, or copy it?

## Reuse from the HK-47 work
- `assets/pazaak/` (cards, panels, bits, icons, `.gui` layouts) — copy over.
- Rules + event-stream/state contract — from `src/hk47_audio/pazaak/` (engine.py + session.py);
  the TS port should mirror these.
- KotOR sound-extraction recipe — in memory `kotor-asset-extraction`.
```


Decyzje, które zostawiam Tobie
Silnik: port TS (rekomendacja) czy pyodide? — to główny rozwidlacz.
Transport: Trystero (rekomendacja) czy od razu managed (Supabase/Firebase) dla świętego spokoju z NAT?
Deck builder w v1 czy domyślne talie na start?
Plansza jako wspólny pakiet między repo czy kopiujemy assety/komponent?
Plan jest w repo (przeniesiesz). Jak zdecydujesz 1-2, mogę zacząć od portu silnika do TS z testami parity (zamyka kontrakt zdarzeń, od którego wszystko inne zależy) — ale to już byłoby w nowym repo, więc daj znać, jak chcesz to poprowadzić.