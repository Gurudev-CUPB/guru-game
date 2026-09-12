const http = require('http');
const WebSocket = require('ws');

const port = Number(process.env.PORT || 8080);
const server = http.createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify({ name: 'Orbit Ludo room server', players: room.size }));
});
const room = new Set();
const socketServer = new WebSocket.Server({ server });

function broadcast(sender, message) {
  for (const client of room) {
    if (client !== sender && client.readyState === WebSocket.OPEN) client.send(message);
  }
}

socketServer.on('connection', socket => {
  room.add(socket);
  socket.send(JSON.stringify({ type: 'room', players: room.size }));
  broadcast(socket, JSON.stringify({ type: 'player-joined', players: room.size }));
  socket.on('message', data => {
    try {
      const message = JSON.parse(data.toString());
      if (['ready', 'join', 'shot', 'match-end', 'ludo-ready', 'ludo-roll', 'ludo-move'].includes(message.type)) broadcast(socket, JSON.stringify(message));
    } catch {
      socket.send(JSON.stringify({ type: 'error', message: 'Invalid message' }));
    }
  });
  socket.on('close', () => { room.delete(socket); broadcast(socket, JSON.stringify({ type: 'player-left', players: room.size })); });
});

server.listen(port, () => console.log(`Orbit Ludo online server listening on http://localhost:${port}`));
