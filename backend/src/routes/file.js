const express = require('express');
const path = require('path');
const fs = require('fs');
const { UPLOAD_DIR } = require('../config');

const router = express.Router();

// GET /v1/file/get/:filename
router.get('/get/:filename', (req, res) => {
  const { filename } = req.params;

  // Prevent directory traversal
  const safeName = path.basename(filename);
  const filePath = path.join(UPLOAD_DIR, safeName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  res.sendFile(path.resolve(filePath));
});

module.exports = router;
