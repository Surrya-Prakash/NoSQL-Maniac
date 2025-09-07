const { createServer } = require('http');
const { Server } = require('socket.io');
const next = require('next');
const { parse } = require('url');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Initialize Socket.IO
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Make io available globally for API routes
  global.io = io;

  // Handle client connections
  io.on('connection', (socket) => {
    console.log('User connected to leaderboard:', socket.id);
    
    // Send current leaderboard data when user connects
    if (global.currentLeaderboard) {
      socket.emit('leaderboard-update', global.currentLeaderboard);
    }
    
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  server.listen(3000, (err) => {
    if (err) throw err;
    console.log('> Ready on http://localhost:3000 with WebSocket support');
  });
});

