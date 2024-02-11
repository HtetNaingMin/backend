const express = require('express');
const router = express.Router();
const db = require('../db');
const isAuthenticated = require("../authMiddleware");

// API endpoint for handling feedback submissions
router.post('/feedbackForm', isAuthenticated, (req, res) => {
  console.log("testing");

  const userId = req.userId;
  const { feedbackType, comments } = req.body;
  
  // Insert feedback data into the Feedback table
  db.run('INSERT INTO Feedback (UserId, FeedbackType, Feedback) VALUES (?, ?, ?)', [userId, feedbackType, comments], function (err) {
    if (err) {
      console.error("Error inserting feedback into the database:", err);
      res.status(500).send("Internal Server Error");
    } else {
      console.log("Feedback inserted successfully with ID:", this.lastID);
      res.status(200).send("Feedback submitted successfully");
    }
  });
});

router.get("/user-feedback", async (req, res) => {
  try {
    const users = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM Feedback ", (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });

    res.send(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


module.exports = router;