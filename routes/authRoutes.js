// authRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../db'); // Import your database module here
const crypto = require('crypto');

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

        // For simplicity, you can store the user details directly in the session
        req.session.user = user;

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
              req.session.userId = user.UserID;

              // Set a cookie upon successful login
              res.cookie('sessionCookie', req.sessionID, {
                maxAge: null,
                httpOnly: false, // Adjust this based on your security requirements
                secure: true, // Set to true if using HTTPS in production
                sameSite: 'None', // Required for cross-site cookies
              });

              res.json({ message: 'Login successful', user, userType: 'nutritionist', status: 'approved' });
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
          req.session.userId = user.UserID;

          // Set a cookie upon successful login
          res.cookie('sessionCookie', req.sessionID, {
            maxAge: null,
            httpOnly: false, // Adjust this based on your security requirements
            secure: true, // Set to true if using HTTPS in production
            sameSite: 'None', // Required for cross-site cookies
          });

          res.json({ message: 'Login successful', user, userType: 'system admin' });
        } else {
          console.log('Login successful for non-nutritionist user');
          // For non-nutritionist users, proceed with login
          req.session.userId = user.UserID;

          // Set a cookie upon successful login
          res.cookie('sessionCookie', req.sessionID, {
            maxAge:null,
            httpOnly: false, // Adjust this based on your security requirements
            secure: true, // Set to true if using HTTPS in production
            sameSite: 'None', // Required for cross-site cookies
          });

          res.json({ message: 'Login successful', user, userType: 'user' });
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

      // Clear the cookie upon logout
      res.clearCookie('sessionCookie');

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
