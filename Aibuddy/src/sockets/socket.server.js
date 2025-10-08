const {Server} = require('socket.io')
const cookie = require('cookie');

async function socketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
    },
  });

  io.use((socket, next) => {
    const cookies = socket.handshake?.headers.cookie;
    if (cookies) {

        const {token} = cookies? cookie.parse(cookies):{};
      // Verify the token (you can use your own logic here)
      jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
          console.error('Token verification failed:', err);
          return next(new Error('Authentication error'));
        }
        socket.user = decoded;
        next();
      });
    } else {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  })
}

module.exports = socketServer;