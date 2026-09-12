# Rift Arena

Original browser battle-royale prototype with a Three.js 3D arena.

## Run online locally

1. Install Node.js.
2. Run `npm install`.
3. Run `npm start`.
4. Open `index.html` through a local web server and open it in two browser tabs to test the room connection.

The game stores best score and match statistics in browser storage. Microphone use is opt-in through the `MIC` button and requires browser permission. The WebSocket server provides room event sync; production matchmaking, authentication, voice transport, and authoritative server gameplay still require a real backend service.
