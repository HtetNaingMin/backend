// filterRoutes.js

const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", async (req, res) => {
  console.log("testing");

  try {
    const dp_tags = JSON.parse(req.query.dietaryPreferences);
    const allergy_tags = JSON.parse(req.query.allergies);
    const cTime = req.query.cookingTime;
    const calorie = req.query.calories;

    const conditions = [];
    const params = [];

    if (dp_tags && dp_tags.length > 0) {
      // Use AND to check that all tags are present in the 'dp_tags' field
      conditions.push(`(${dp_tags.map(() => 'dp_tags LIKE ?').join(' OR ')})`);
      params.push(...dp_tags.map(tag => `%${tag}%`));
    }

    if (allergy_tags && allergy_tags.length > 0) {
      // Use AND to exclude recipes that contain any of the specified allergies
      conditions.push(`(${allergy_tags.map(() => 'allergy_tags NOT LIKE ?').join(' AND ')})`);
      params.push(...allergy_tags.map(tag => `%${tag}%`));
    }

    if (cTime) {
      conditions.push('(cTime IS NULL OR CAST(cTime AS SIGNED) <= ?)');
      params.push(cTime);
    }
    
    if (calorie) {
      // Extracting numeric value from the 'calories' string
      const targetCalories = parseInt(calorie);
    
      // Using a comparison operator to filter the 'calorie' column
      conditions.push('(CAST(SUBSTR(Calorie, INSTR(Calorie, "=") + 1, INSTR(Calorie, "kcal") - INSTR(Calorie, "=") - 1) AS INTEGER) <= ? OR Calorie IS NULL)');
      params.push(targetCalories);
    }

    const conditionsString = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const sql = `
      SELECT Recipe_Np.Rname, User.FName, User.LName
      FROM Recipe_Np
      JOIN User ON Recipe_Np.UserID = User.UserID
      ${conditionsString}
    `;

    console.log("Executing SQL query:", sql);
    console.log("Query parameters:", params);

    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('Database query error:', err.message);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }

      // Assuming you want to send the result back to the client
      res.json({ result: rows });
      console.log(rows); // Log the result to the console
    });
  } catch (error) {
    console.error('Error parsing JSON:', error.message);
    res.status(400).json({ error: 'Bad Request' });
  }
});

module.exports = router;
