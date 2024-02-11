const express = require("express");
const router = express.Router();
const db = require("../db");
const isAuthenticated = require("../authMiddleware");

router.post("/", isAuthenticated, async (req, res) => {
    try {
      const { MPName } = req.body;
      const userID = req.session.userId;
  
      // Check if the user has completed the previous meal plan
      const checkCompletionQuery = `
        SELECT * FROM MealPlanTrack
        WHERE UserID = ? AND MPName = ? AND Monday = ? AND Tuesday = ? AND Wednesday = ? AND Thursday = ? AND Friday = ?;
      `;
  
      const previousPlanCompleted = await db.get(checkCompletionQuery, [userID, MPName, "checked", "checked", "checked", "checked", "checked"]);
  
      if (previousPlanCompleted) {
        // Insert a new row for the meal plan
        const insertQuery = `
          INSERT INTO MealPlanTrack (UserID, MPName, Monday, Tuesday, Wednesday, Thursday, Friday)
          VALUES (?, ?, ?, ?, ?, ?, ?);
        `;
  
        await db.run(insertQuery, [userID, MPName, null, null, null, null, null]);
  
        res.status(200).json({ message: "Meal plan registration successful." });
        console.log("Done!");
      } else {
        res.status(400).json({ error: "Previous meal plan not completed." });
      }
    } catch (error) {
      console.error("Error updating meal plan track:", error.message);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
  
  router.get("/CheckExisting/:mealplanName", isAuthenticated, async (req, res) => {
    try {
      const MPName = req.params.mealplanName;
      const userID = req.session.userId;
  
      const query = `
        SELECT * FROM MealPlanTrack
        WHERE UserID = ? AND MPName = ?;
      `;
  
      const result = await new Promise((resolve, reject) => {
        db.get(query, [userID, MPName], (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        });
      });
  
      if (result && result.UserID === userID && result.MPName === MPName) {
        // If a row exists with the correct UserID and MPName, the user has an existing entry
        res.status(200).json({ exists: true });
        console.log("User exists");
      } else {
        // If no row exists, or the UserID and MPName do not match, the user has not started any meal plan
        res.status(200).json({ exists: false });
        console.log("User doesn't exist");
      }
    } catch (error) {
      console.error("Error checking existing entry:", error.message);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
  
  
  // Check if the user has completed the previous meal plan
  // Check if all days are checked for the previous meal plan
  router.get("/CheckAllDaysChecked/:mealplanName", isAuthenticated, async (req, res) => {
    try {
      const MPName = req.params.mealplanName; // Use req.params to get parameters from the URL
      const userID = req.session.userId;
  
      const query = `
        SELECT * FROM MealPlanTrack
        WHERE UserID = ? AND MPName = ?;
      `;
  
      const result = await db.get(query, [userID, MPName]);
  
      if (result && result.Monday === 'checked' && result.Tuesday === 'checked' && result.Wednesday === 'checked' && result.Thursday === 'checked' && result.Friday === 'checked') {
        // If all days are checked, the user has completed the previous meal plan
        res.status(200).json({ allDaysChecked: true });
      } else {
        // If any day is not checked or no row exists, the user has not completed the previous meal plan
        res.status(200).json({ allDaysChecked: false });
      }
    } catch (error) {
      console.error("Error checking all days checked:", error.message);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  router.post("/delete/:mealPlanName", isAuthenticated, async (req, res) => {
    try {
      const { mealPlanName } = req.params;
      const userID = req.session.userId;
  
      // Delete the row for the current user and meal plan
      const deleteQuery = `
        DELETE FROM MealPlanTrack
        WHERE UserID = ? AND MPName = ?;
      `;
  
      await db.run(deleteQuery, [userID, mealPlanName]);
  
      console.log(`Meal plan data for ${mealPlanName} deleted successfully.`);
      res.status(200).json({ message: "Meal plan data deleted successfully." });
    } catch (error) {
      console.error("Error deleting meal plan data:", error.message);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
  
  module.exports = router;