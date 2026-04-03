require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { PORT, FRONTEND_URL, UPLOAD_DIR } = require('./config');
const { setupWebSocket } = require('./websocket/handler');
const { startScheduler, stopScheduler } = require('./services/agentScheduler');

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const clubRoutes = require('./routes/club');
const taskRoutes = require('./routes/task');
const fileRoutes = require('./routes/file');
const fightRoutes = require('./routes/fight');
const statsRoutes = require('./routes/stats');
const friendsRoutes = require('./routes/friends');
const aiRoutes = require('./routes/ai');
const agentRoutes = require('./routes/agent');

const app = express();

// Ensure uploads directory exists
const uploadsPath = path.resolve(UPLOAD_DIR);
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

// CORS configuration
const allowedOrigins = [
  'https://hexlash.com',
  'https://www.hexlash.com',
  'https://test.hexlash.com',
  'https://hexlash.vercel.app',
];
if (FRONTEND_URL && !allowedOrigins.includes(FRONTEND_URL)) {
  allowedOrigins.push(FRONTEND_URL);
}

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(helmet());
app.use(cors(corsOptions));

// Explicit preflight handling for all routes
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'hexlash-api', version: '1.0.0' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API Routes (all under /v1)
app.use('/v1/auth', authRoutes);
app.use('/v1/user', userRoutes);
app.use('/v1/club', clubRoutes);
app.use('/v1/task', taskRoutes);
app.use('/v1/file', fileRoutes);
app.use('/v1/fight', fightRoutes);
app.use('/v1/stats', statsRoutes);
app.use('/v1/friends', friendsRoutes);
app.use('/v1/ai', aiRoutes);
app.use('/v1/agent', agentRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('=== UNHANDLED ERROR ===');
  console.error('URL:', req.method, req.originalUrl);
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Create HTTP server (shared between Express and WebSocket)
const server = http.createServer(app);

// Setup WebSocket on the same server
setupWebSocket(server);

// Use PORT from env (Railway sets this automatically)
const port = process.env.PORT || PORT;
server.listen(port, '0.0.0.0', () => {
  console.log(`Hexlash API server running on port ${port}`);
  console.log(`WebSocket available on ws://0.0.0.0:${port}`);
  console.log(`Health check: http://0.0.0.0:${port}/health`);
  startScheduler();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  stopScheduler();
  server.close();
});
process.on('SIGINT', () => {
  stopScheduler();
  server.close();
});
