const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
      req.userId = decoded.userId;
    } catch (err) {
      // ignore invalid token
    }
  }
  next();
}

// Guest ids are random per-tab strings made by the browser (see getGuestId in
// src/services/playerProgress.js). Format check only: it is not a secret and not
// an account, it just keeps random junk and bare curl probes from reaching the
// paid routes as "guests".
const GUEST_ID_RE = /^[A-Za-z0-9_-]{16,64}$/;

/**
 * Signed-in player OR anonymous guest. Used ONLY by the two arena model routes.
 *
 *   • Authorization header present → exactly authMiddleware's behaviour (a bad or
 *     expired token is still 401). req.isGuest = false.
 *   • No Authorization header + a well-formed X-Guest-Id → a guest.
 *     req.userId stays undefined, req.isGuest = true.
 *   • Neither → 401, as before.
 */
function authOrGuest(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authMiddleware(req, res, () => { req.isGuest = false; next(); });
  }
  const guestId = req.headers['x-guest-id'];
  if (typeof guestId === 'string' && GUEST_ID_RE.test(guestId)) {
    req.isGuest = true;
    return next();
  }
  return res.status(401).json({ error: 'No token provided' });
}

module.exports = { authMiddleware, optionalAuth, authOrGuest, GUEST_ID_RE };
