// reviewRoutes.js
const express = require("express");
const router = express.Router();
const db = require("../db");

const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  } else {
    res.status(401).json({ error: "Not authenticated" });
  }
};

router.get("/:recipeName", async (req, res) => {
  const { recipeName } = req.params;

  const query = `
  SELECT
  review.ReviewID AS reviewId,
  review.comment,
  user.UserID,  -- Include UserID in the result
  user.Username,
  review.stars
FROM
  review
INNER JOIN
  User ON review.UserID = user.UserID
WHERE
  review.Rname = ?;

`;

  try {
    const reviews = await new Promise((resolve, reject) => {
      db.all(query, [recipeName], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows);
      });
    });

    res.json({ reviews });
  } catch (error) {
    console.error("Error fetching reviews:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Middleware to check if the user is authenticated

// POST endpoint for submitting a review
// Assuming req.body has { userId, recipeName, comment }
// POST endpoint for submitting a review
// Assuming req.body has { userId, recipeName, comment, stars }
router.post("/", async (req, res) => {
  const { userId, recipeName, comment, stars } = req.body;

  const insertQuery = `
    INSERT INTO review (UserID, Rname, comment, stars)
    VALUES (?, ?, ?, ?)
  `;

  const updateAvgRatingQuery = `
    UPDATE Recipe_Np
    SET ratings = (
        SELECT AVG(stars) 
        FROM review 
        WHERE review.Rname = Recipe_Np.Rname
    )
    WHERE Recipe_Np.Rname = ?;
  `;

  try {
    await new Promise((resolve, reject) => {
      // Insert the review
      db.run(insertQuery, [userId, recipeName, comment, stars], (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });

    await new Promise((resolve, reject) => {
      // Update the average ratings
      db.run(updateAvgRatingQuery, [recipeName], (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });

    res.json({ success: true, message: "Review submitted successfully" });
  } catch (error) {
    console.error("Error submitting review:", error.message);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// DELETE endpoint for deleting a review
router.delete("/:reviewId", async (req, res) => {
  const { reviewId } = req.params;

  const deleteQuery = `
    DELETE FROM review
    WHERE ReviewID = ?;
  `;

  try {
    await new Promise((resolve, reject) => {
      db.run(deleteQuery, [reviewId], (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });

    res.json({ success: true, message: "Review deleted successfully" });
  } catch (error) {
    console.error("Error deleting review:", error.message);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

module.exports = router;
