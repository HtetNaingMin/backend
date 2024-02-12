// authRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../db'); // Import your database module here
const crypto = require('crypto');

// Middleware to check if the user is authenticated
module.exports = (isAuthenticated) => {
  // Route to check if the user is authenticated
  router.get("/api/check-auth", isAuthenticated, (req, res) => {
    try {
      const currentTime = Date.now();
      const sessionExpiry = req.session.cookie.expires.getTime();
  
      if (currentTime > sessionExpiry) {
        // Session has expired
        res.status(401).json({ error: "Session Expired" });
        return;
      }
  
      // Your authentication logic here
  
      // If authenticated, return the appropriate response
      // If not authenticated, consider throwing an error
      // res.status(401).json({ error: "Unauthorized" });
    } catch (error) {
      console.error("Error in /api/check-auth route:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Route for user login
  router.post('/login', (req, res) => {
    const { username, password } = req.body;
    const query = 'SELECT * FROM User WHERE Username = ? AND password = ?';
  
    db.get(query, [username, password], (err, user) => {
      if (err) {
        console.error('Database query error:', err.message);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }
  
      if (user) {
        console.log('User:', user);
  
        if (user.UserType === 'nutritionist') {
          // Check NutritionistSignUp table for approval status
          const nutritionistQuery = 'SELECT * FROM NutritionistSignUp WHERE UserID = ?';
          db.get(nutritionistQuery, [user.UserID], (err, nutritionistData) => {
            if (err) {
              console.error('Database query error:', err.message);
              res.status(500).json({ error: 'Internal Server Error' });
              return;
            }
  
            if (nutritionistData && nutritionistData.Status === 'approved') {
              console.log('Login successful for approved nutritionist');
              req.session.user = { ...user, userType: 'nutritionist', status: 'approved' };
              res.json({ message: 'Login successful', user: req.session.user });
            } else if (nutritionistData && nutritionistData.Status !== 'approved') {
              console.log('Nutritionist account is pending approval');
              res.status(401).json({ error: 'Nutritionist account is pending approval' });
            } else {
              console.log('Nutritionist account not found');
              res.status(401).json({ error: 'Invalid credentials for a nutritionist account' });
            }
          });
        } else if (user.UserType === 'system admin') {
          console.log('Login successful for system admin');
          req.session.user = { ...user, userType: 'system admin' };
          res.json({ message: 'Login successful', user: req.session.user });
        } else {
          console.log('Login successful for non-nutritionist user');
          // For non-nutritionist users, proceed with login
          req.session.user = { ...user, userType: 'user' };
          res.json({ message: 'Login successful', user: req.session.user });
        }
      } else {
        console.log('Invalid credentials');
        res.status(401).json({ error: 'Invalid credentials' });
      }
    });
  });
  

  // Route for user logout
  router.get('/logout', isAuthenticated, (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err.message);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }
      res.json({ message: 'Logout successful' });
    });
  });

  // Add this after the existing routes in authRoutes.js
router.get('/userID', isAuthenticated, (req, res) => {
  const userId = req.session.userId;
  // Handle fetching user details or anything related to the user
  const query = 'SELECT UserID FROM User WHERE UserID = ?';
  db.get(query, [userId], (err, user) => {
    if (err) {
      console.error('Database query error:', err.message);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    if (user) {
      // Respond with user details
      res.json({ user });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  });
});


  return router;
};
