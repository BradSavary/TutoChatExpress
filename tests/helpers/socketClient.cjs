// helpers/socketClient.cjs
const { io } = require('socket.io-client');

function createSocketClient(url, opts = {}) {
  return io(url, { transports: ['websocket'], ...opts });
}

module.exports = { createSocketClient };
