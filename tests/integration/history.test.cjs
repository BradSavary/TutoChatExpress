// tests/integration/history.test.cjs
// Exemple de test d'intégration pour la récupération de l'historique
// (à adapter selon votre logique réelle)
const { createServer } = require('http');
const { Server } = require('socket.io');
const { createSocketClient } = require('../helpers/socketClient.cjs');

let io, httpServer, clientSocket;
const fakeHistory = [
  { user: 'Alice', text: 'Salut' },
  { user: 'Bob', text: 'Hello' },
];

beforeAll((done) => {
  httpServer = createServer();
  io = new Server(httpServer);
  httpServer.listen(() => {
    const port = httpServer.address().port;
    clientSocket = createSocketClient(`http://localhost:${port}`);
    io.on('connection', (socket) => {
      socket.on('get history', () => {
        socket.emit('history', fakeHistory);
      });
    });
    clientSocket.on('connect', done);
  });
});

afterAll(() => {
  io.close();
  clientSocket.close();
  httpServer.close();
});

test('le client peut récupérer l\'historique des messages', (done) => {
  clientSocket.once('history', (history) => {
    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBe(2);
    expect(history[0].user).toBe('Alice');
    done();
  });
  clientSocket.emit('get history');
});
