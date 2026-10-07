# Starhold

A space strategy game for 2–4 commanders. It's an installable web app (PWA) with peer-to-peer online play on Android, iOS and desktop.

**Play:** https://jvishnefske.github.io/starhold/ · **Source:** https://github.com/jvishnefske/starhold

## Files

| Path | What it is |
|---|---|
| `docs/index.html` | The whole game: rules, computer players, UI, networking |
| `docs/vendor/peerjs.min.js` | PeerJS 1.5.4 (WebRTC wrapper), vendored so the app works offline |
| `docs/sw.js` | Service worker. Caches the app so it opens offline |
| `docs/manifest.webmanifest`, `docs/icons/` | Install metadata and icons (including maskable and Apple touch) |

There's no build step. Serve `docs/` as static files.

## Hosting

Service workers and installing the app need **HTTPS**. Any static host works:

- **GitHub Pages**: live at https://jvishnefske.github.io/starhold/, deployed from `main` → `/docs`.
- **Cloudflare Pages**: `npx wrangler pages deploy docs --project-name starhold`
- **Netlify**: drag the `docs` folder onto app.netlify.com/drop.

For a local test, run `python3 -m http.server 8000 -d docs` and open http://localhost:8000. `localhost` counts as secure on that machine only. Phones on your LAN need an HTTPS URL to install the app.

## Installing

- **Android (Chrome, Edge, Samsung Internet):** tap **Install** in the game header, or browser menu → *Install app*.
- **iPhone / iPad (Safari):** Share → *Add to Home Screen*. The New game dialog shows this tip on iOS.

## Board

There are 8 planets. Each corner home station links to one corner planet. The corner planets and the 4 edge planets form a ring, and only the edge planets connect to the warp gate (1 crystal per jump). Two-player games close the two unused corners (home station and corner planet), leaving 6 planets; 5 outposts win.

## Online play

1. Host: **New game → Host online → Open lobby**. You get a 5-letter code. **Share invite** sends a link that opens straight into the join screen.
2. Guests: **New game → Join online**, then enter the code and a name.
3. Host sets each empty seat to *Open seat* or *Computer*, then taps **Launch game**. Open seats that nobody filled become computers.

How it works:

- **The host's device runs the game.** Guests send their moves and get the board state back. The host checks every move, so a guest can't play out of turn. Guests never receive other players' cards or the deck order.
- **Connections:** PeerJS's free public server (`0.peerjs.com`) only introduces devices to each other. After that, game traffic goes directly between devices over WebRTC. If a direct link can't be made (some mobile carriers or strict NATs), PeerJS's public TURN relays carry the traffic.
- **Backgrounding / dropped connections:** a guest who drops reconnects automatically. If a guest is gone for more than 20 seconds (`DROP_GRACE_MS`), a computer plays their seat until they return. If the host's app is closed or reloaded, it resumes the same game with the same code, and guests reconnect on their own.
- The screen is kept awake during online games where the browser supports it (Wake Lock API).
- **Rematch:** after a game, the host's **New game** button returns everyone to the same lobby.

### Running your own servers (optional)

The public PeerJS server and relays are free but come with no guarantees. For a dependable setup:

- Run your own broker with `npx peer --port 9000`. Set `PEER_OPTS` in `docs/index.html` to `{host, port, path, secure: true}`.
- Add your own TURN server (e.g. coturn, or a hosted one) via `PEER_OPTS.config.iceServers`.

## Known limits

- iOS suspends a web app as soon as it goes to the background. A guest who switches apps drops and then reconnects. If the **host** switches away, everyone waits until the host comes back.
- Online play needs internet access for the first connection, even when all phones are on the same Wi-Fi.
