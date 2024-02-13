// authMiddleware.js
const jwt = require('jsonwebtoken');
const secretKey = 'yourLongLivedSecretKey'; // Replace with your actual secret key

const isAuthenticated = (req, res, next) => {
  // Assuming you stored the token in a client-side storage (e.g., localStorage)
  const token = req.headers.authorization; // Adjust based on your setup

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.userId = decoded.userId; // Add userId to the request for further use
    next();
  });
};

module.exports = isAuthenticated;

  
