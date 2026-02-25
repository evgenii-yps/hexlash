require('dotenv').config();

const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { PORT, FRONTEND_URL, UPLOAD_DIR } = require('./config');
const { setupWebSocket } = require('./websocket/handler');

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const clubRoutes = require('./routes/club');
const taskRoutes = require('./routes/task');
const fileRoutes = require('./routes/file');

const app = express();

// Ensure uploads directory exists
const uploadsPath = path.resolve(UPLOAD_DIR);
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

// Middleware
app.use(cors({
  origin: [
    FRONTEND_URL,
    'https://hexlash.com',
    'https://www.hexlash.com',
    'https://hexlash.vercel.app',
    /\.vercel\.app$/,
  ],
  credentials: true,
}));
app.use(express.json());

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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Create HTTP server (shared between Express and WebSocket)
const server = http.createServer(app);

// Setup WebSocket on the same server
setupWebSocket(server);

server.listen(PORT, () => {
  console.log(`Hexlash API server running on port ${PORT}`);
  console.log(`WebSocket available on ws://localhost:${PORT}/ws`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
