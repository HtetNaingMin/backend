// profileRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../db'); // Import your database module here

const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
};

// Route for fetching user profile
router.get('/', isAuthenticated, (req, res) => {
  const userId = req.session.userId;

  // Query your database to retrieve user profile data
  const profileQuery = `
    SELECT Username, dob, gender, email, FName, LName, Paid
    FROM User
    WHERE UserID = ?
  `;

  db.get(profileQuery, [userId], (err, userProfile) => {
    if (err) {
      console.error('Database query error:', err.message);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    if (userProfile) {
      res.json({ userProfile });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  });
});

// Route for updating user profile
// Route for updating user profile
router.post('/update-profile', isAuthenticated, (req, res) => {
  const userId = req.session.userId;

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized access' });
    return;
  }

  const { name, dob, gender, email } = req.body;

  // Ensure name is defined and split it, or provide an empty array
  const nameArray = name ? name.split(' ') : [];

  // Perform the database update with the new data
  const updateProfileQuery = `
    UPDATE User
    SET FName = ?, LName = ?, dob = ?, gender = ?, email = ?
    WHERE UserID = ?
  `;

  db.run(
    updateProfileQuery,
    [...nameArray, dob, gender, email, userId],
    (err) => {
      if (err) {
        console.error('Error updating profile:', err.message);
        res.status(500).json({ error: `Internal Server Error: ${err.message}` });
      } else {
        res.json({ success: true });
      }
    }
  );
});

// Route for verifying old password
router.post('/verify-password', isAuthenticated, (req, res) => {
  const userId = req.session.userId;

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized access' });
    return;
  }

  const { oldPassword } = req.body;

  // Fetch the current password from the database
  const getPasswordQuery = 'SELECT password FROM User WHERE UserID = ?';
  db.get(getPasswordQuery, [userId], (err, row) => {
    if (err) {
      console.error('Error fetching password:', err.message);
      res.status(500).json({ error: `Internal Server Error: ${err.message}` });
      return;
    }

    if (!row || row.password !== oldPassword) {
      // The old password is incorrect
      res.status(401).json({ error: 'Incorrect password. Try Again.' });
      return;
    }

    // If old password is correct, send a success response
    res.json({ success: true });
  });
});

// Route for updating user password
router.post('/update-password', isAuthenticated, (req, res) => {
  const userId = req.session.userId;

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized access' });
    return;
  }

  const { oldPassword, newPassword } = req.body;

  // Fetch the current password from the database
  const getPasswordQuery = 'SELECT password FROM User WHERE UserID = ?';
  db.get(getPasswordQuery, [userId], (err, row) => {
    if (err) {
      console.error('Error fetching password:', err.message);
      res.status(500).json({ error: `Internal Server Error: ${err.message}` });
      return;
    }

    if (!row || row.password !== oldPassword) {
      // The old password is incorrect
      res.status(401).json({ error: 'Incorrect password. Try Again.' });
      return;
    }

    // Update the password in the database
    const updatePasswordQuery = 'UPDATE User SET password = ? WHERE UserID = ?';
    db.run(updatePasswordQuery, [newPassword, userId], (err) => {
      if (err) {
        console.error('Error updating password:', err.message);
        res.status(500).json({ error: `Internal Server Error: ${err.message}` });
      } else {
        res.json({ success: true });
      }
    });
  });
});



module.exports = router;
