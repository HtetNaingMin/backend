// aboutmeRoutes.js
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

// Fetch aboutme data
router.get('/', isAuthenticated, (req, res) => {
  try {
    const userId = req.session.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized access' });
      return;
    }

    const aboutMeQuery = `
      SELECT User.FName, User.LName, User.Username, User.gender, AboutMe.height, AboutMe.Weight, AboutMe.allergy, 
             AboutMe.BMI, AboutMe.DietMethod, AboutMe.DietaryPreferance, AboutMe.HealthGoal
      FROM User
      LEFT JOIN AboutMe ON User.UserID = AboutMe.UserID
      WHERE User.UserID = ?
    `;

    db.get(aboutMeQuery, [userId], (err, profileData) => {
      if (err) {
        console.error('Database query error:', err.message);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }

      if (profileData) {
        res.json(profileData);
      } else {
        res.status(404).json({ error: 'Profile data not found' });
      }
    });
  } catch (error) {
    console.error('Error fetching profile data:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update aboutme data
router.post('/update-aboutme', isAuthenticated, (req, res) => {
  const userId = req.session.userId;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized access" });
    return;
  }

  const { height, Weight, DietaryPreferance, allergy, HealthGoal, DietMethod, BMI } = req.body;

  // Perform the database update with the new data
  const updateAboutMeQuery = `
    UPDATE AboutMe
    SET height = ?, Weight = ?, DietaryPreferance = ?, allergy = ?, HealthGoal = ?, DietMethod = ?, BMI = ?
    WHERE UserID = ?;
  `;

  db.run(
    updateAboutMeQuery,
    [
      height,
      Weight,
      JSON.stringify(DietaryPreferance),
      JSON.stringify(allergy),
      JSON.stringify(HealthGoal),
      JSON.stringify(DietMethod),
      BMI,
      userId,
    ],
    (err) => {
      if (err) {
        console.error("Error updating about me:", err.message);
        res.status(500).json({ error: `Internal Server Error: ${err.message}` });
      } else {
        res.json({ success: true });
      }
    }
  );
});

module.exports = router;
