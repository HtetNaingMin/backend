// authRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../db'); // Import your database module here
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const secretKey = 'yourLongLivedSecretKey';

// Middleware to check if the user is authenticated
module.exports = (isAuthenticated) => {
  // Route to check if the user is authenticated
  router.get('/check-auth', isAuthenticated, (req, res) => {
    res.status(200).json({ message: 'Authenticated' });
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
  
        // Generate a JWT
        const token = jwt.sign({ userId: user.UserID, userType: user.UserType },  secretKey, {
          expiresIn: '1h', // Token expiration time
        });
  
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
              res.json({ message: 'Login successful', user, userType: 'nutritionist', status: 'approved', token });
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
          res.json({ message: 'Login successful', user, userType: 'system admin', token });
        } else {
          console.log('Login successful for non-nutritionist user');
          res.json({ message: 'Login successful', user, userType: 'user', token });
        }
      } else {
        console.log('Invalid credentials');
        res.status(401).json({ error: 'Invalid credentials' });
      }
    });
  });
  // Route for user logout
 router.post('/logout', (req, res) => {
  // Assuming you stored the token in a client-side storage (e.g., localStorage)
  const token = req.body.token; // Adjust based on your setup

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  res.json({ message: 'Logout successful' });
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
