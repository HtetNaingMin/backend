const express = require('express');
const router = express.Router();
const db = require('../db');

const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.userId) {
      req.userId = req.session.userId;
      return next();
    } else {
      res.status(401).json({ error: 'Not authenticated' });
    }
  };

  router.get('/changed/:recipeName', (req, res) => {
    const recipeName = req.params.recipeName;


    const selectRecipeQuery = `
      SELECT Ingredients, Instruction
      FROM Bookmark
      WHERE RName = ? AND Instruction IS NOT NULL
    `;
  
    db.get(selectRecipeQuery, [recipeName], (err, row) => {
      if (err) {
        console.error('Error fetching ingredients and instruction:', err);
        res.status(500).json({ error: 'Internal Server Error' });
      } else if (row) {
        const ingredients = row.Ingredients.split('\r\n');
        const instruction = row.Instruction.split('\r\n');
        console.log (ingredients);
        res.json({ ingredients, instruction });
      } else {
        res.status(404).json({ error: 'Recipe not found' });
      }
    });
  });

  router.delete("/:recipeName", async (req, res) => {
    const recipeName = req.params.recipeName;
    console.log("Received DELETE request for recipe:", recipeName);
  
    try {
      await db.run("BEGIN TRANSACTION");
  
      // Delete from Recipe_Np table
      await db.run("DELETE FROM Recipe_Np WHERE Rname = ?", [recipeName]);
  
      await db.run("COMMIT");
      console.log("Transaction committed successfully");
  
      res.json({ success: true, message: "Recipe deleted successfully." });
    } catch (error) {
      await db.run("ROLLBACK");
      console.error("Error deleting recipe:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  router.get('/showEdit', isAuthenticated, async (req, res) => {
    const userId = req.userId;
  
    try {
      const selectFavoritesQuery = `
        SELECT RName, UserID
        FROM Bookmark
        WHERE UserID = ? AND Instruction IS NOT NULL`;
  
      console.log(`Fetching edited favorites for user ${userId}...`);
  
      const favorites = await new Promise((resolve, reject) => {
        db.all(selectFavoritesQuery, [userId], (err, rows) => {
          if (err) {
            console.error('Error fetching edited favorites:', err);
            reject(err);
          } else {
            const editedFavorites = rows.map(row => ({
              RName: row.RName,
              UserID: row.UserID,
            }));
            console.log('Edited favorites fetched successfully:', editedFavorites);
            resolve(editedFavorites);
          }
        });
      });
  
      console.log('Sending edited favorites as the response:', favorites);
  
      res.json({ editedFavorites: favorites });
    } catch (error) {
      console.error('Error fetching user edited favorites:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

module.exports = router;