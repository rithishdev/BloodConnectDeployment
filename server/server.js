const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');


const { connectDB } = require('./config/db');
const { seedMongoIfEmpty } = require('./utils/dataStore');
const { ensureDefaultUsers } = require('./controllers/authController');

const donorRoutes = require('./routes/donorRoutes');
const requestRoutes = require('./routes/requestRoutes');
const hospitalRoutes = require('./routes/hospitalRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io with permissive CORS for development
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
  }
});

// Attach io instance to express app so controllers can emit events
app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json());

// Request logging in development
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  }
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/analytics', analyticsRoutes);

// Serve React frontend static files if built
const fs = require('fs');
const clientDistPath = path.join(__dirname, '../client/dist');


if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.url.startsWith('/api') || req.url.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  // Root route for API only
  app.get('/', (req, res) => {
    res.json({
      name: 'BloodConnect Emergency API',
      version: '1.0.0',
      description: 'Emergency Blood Donor Platform connecting donors with hospitals and critical requests',
      endpoints: {
        donors: '/api/donors',
        requests: '/api/requests',
        hospitals: '/api/hospitals',
        analytics: '/api/analytics',
        health: '/api/analytics/health'
      }
    });
  });
}


// Socket.io Real-time connection handler
io.on('connection', (socket) => {
  console.log(`⚡ Client connected via WebSocket: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });

  socket.on('subscribe-emergency-feed', () => {
    socket.join('emergency-room');
    console.log(`📡 Socket ${socket.id} subscribed to emergency alerts feed`);
  });
});

// Global 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Resource not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

process.on('uncaughtException', (err) => {
  console.error('⚠️ Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start server
server.listen(PORT, async () => {
  console.log(`\n=================================================`);
  console.log(`🚀 BloodConnect Server running on http://localhost:${PORT}`);
  console.log(`🚨 Real-time Socket.io active on port ${PORT}`);
  console.log(`=================================================\n`);

  // Connect to MongoDB (Atlas or fallback)
  await connectDB();
  await seedMongoIfEmpty();
  await ensureDefaultUsers();
});
