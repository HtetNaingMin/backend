// authMiddleware.js
// authMiddleware.js
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.userId) {
      req.userId = req.session.userId;
      return next();
    } else {
      res.status(401).json({ error: 'Not authenticated' });
    }
  };
  
  module.exports = isAuthenticated;
  

  
