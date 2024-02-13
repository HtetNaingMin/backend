// authRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../db'); // Import your database module here
const crypto = require('crypto');

const secretKey = crypto.randomBytes(32).toString('hex');

// Middleware to check if the user is authenticated
module.exports = (isAuthenticated) => {
  // Route to check if the user is authenticated
<<<<<<< HEAD
  router.get('/check-auth', (req, res) => {
    // Get the token from the Authorization header
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
    console.log (token);

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      // Verify the token
      const decoded = jwt.verify(token, secretKey);
      req.userId = decoded.userId; // Add userId to the request for further use
      return isAuthenticated(req, res);
    } catch (error) {
      console.error('JWT verification error:', error.message);
      return res.status(401).json({ error: 'Unauthorized' });
    }
=======
  router.get('/check-auth', isAuthenticated, (req, res) => {
    res.status(200).json({ message: 'Authenticated' });
>>>>>>> cd9beae4c2fd7611805f488d0aaec4c832363d6e
  });

  // Route for user login
  router.post('/login', (req, res) => {
    const { username, password } = req.body;
    const query = 'SELECT * FROM User WHERE Username = ? AND password = ?';
<<<<<<< HEAD
  
=======
>>>>>>> cd9beae4c2fd7611805f488d0aaec4c832363d6e
    db.get(query, [username, password], (err, user) => {
      if (err) {
        console.error('Database query error:', err.message);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }
<<<<<<< HEAD
=======

>>>>>>> cd9beae4c2fd7611805f488d0aaec4c832363d6e
  
      if (user) {
        console.log('User:', user);
  
<<<<<<< HEAD
        // Generate a JWT
        const token = jwt.sign({ userId: user.UserID, userType: user.UserType },  secretKey, {
          expiresIn: '1h', // Token expiration time
        });
  
=======
>>>>>>> cd9beae4c2fd7611805f488d0aaec4c832363d6e
        if (user.UserType === 'nutritionist') {
          // Check NutritionistSignUp table for approval status
          const nutritionistQuery = 'SELECT * FROM NutritionistSignUp WHERE UserID = ?';
          db.get(nutritionistQuery, [user.UserID], (err, nutritionistData) => {
            if (err) {
              console.error('Database query error:', err.message);
              res.status(500).json({ error: 'Internal Server Error' });
              return;
            }
<<<<<<< HEAD
  
            if (nutritionistData && nutritionistData.Status === 'approved') {
              console.log('Login successful for approved nutritionist');
              res.json({ message: 'Login successful', user, userType: 'nutritionist', status: 'approved', token });
=======
        
            if (nutritionistData && nutritionistData.Status === 'approved') {
              console.log('Login successful for approved nutritionist');
              req.session.userId = user.UserID;
              res.json({ message: 'Login successful', user, userType: 'nutritionist', status: 'approved' });
>>>>>>> cd9beae4c2fd7611805f488d0aaec4c832363d6e
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
<<<<<<< HEAD
          res.json({ message: 'Login successful', user, userType: 'system admin', token });
        } else {
          console.log('Login successful for non-nutritionist user');
          res.json({ message: 'Login successful', user, userType: 'user', token });
=======
          req.session.userId = user.UserID;
          res.json({ message: 'Login successful', user, userType: 'system admin' });
        } else {
          console.log('Login successful for non-nutritionist user');
          // For non-nutritionist users, proceed with login
          req.session.userId = user.UserID;
          res.json({ message: 'Login successful', user,userType: 'user' });
>>>>>>> cd9beae4c2fd7611805f488d0aaec4c832363d6e
        }
      } else {
        console.log('Invalid credentials');
        res.status(401).json({ error: 'Invalid credentials' });
      }
<<<<<<< HEAD
    });
  });
  
  
=======
      
    });
  });
  
>>>>>>> cd9beae4c2fd7611805f488d0aaec4c832363d6e
  

  // Route for user logout
  router.get('/logout', isAuthenticated, (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err.message);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }

      // Clear the cookie upon logout
      res.clearCookie('sessionCookie', {
      });

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
