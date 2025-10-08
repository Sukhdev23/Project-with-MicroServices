require('dotenv').config();
const app = require('./src/app');
const http = require('http');
const socketServer = require('./src/sockets/socket.server');

const server = http.createServer(app)
socketServer(server);

server.listen(3005, () => {
  console.log('Server is running on port 3005');
});