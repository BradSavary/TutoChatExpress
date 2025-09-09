// tests/integration/socketio.test.cjs
const { createServer } = require('http');
const { Server } = require('socket.io');
const { createSocketClient } = require('../helpers/socketClient.cjs');

let io, httpServer, clientSocket;

beforeAll((done) => {
  httpServer = createServer();
  io = new Server(httpServer);
  httpServer.listen(() => {
    const port = httpServer.address().port;
    clientSocket = createSocketClient(`http://localhost:${port}`);
    io.on('connection', (socket) => {
      socket.on('chat message', (msg) => {
        socket.emit('chat message', msg);
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

test('le client peut se connecter au serveur Socket.IO', (done) => {
  expect(clientSocket.connected).toBe(true);
  done();
});

test('le client envoie et reçoit un message via Socket.IO', (done) => {
  const testMsg = 'Hello integration!';
  clientSocket.once('chat message', (msg) => {
    expect(msg).toBe(testMsg);
    done();
  });
  clientSocket.emit('chat message', testMsg);
});
