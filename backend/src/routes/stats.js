const express = require('express');
const { clients } = require('../websocket/handler');

const router = express.Router();

// GET /v1/stats/online — public, no auth required
router.get('/online', (req, res) => {
  try {
    const onlineCount = clients.size;
    res.json({
      online: onlineCount,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error getting online count:', error);
    res.status(500).json({ error: 'Failed to get online count' });
  }
});

module.exports = router;
