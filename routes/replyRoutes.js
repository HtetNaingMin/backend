const express = require("express");
const router = express.Router();
const db = require("../db");
const isAuthenticated = require("../authMiddleware");

// Submit a new reply to a comment on a review
// Backend route to fetch replies with usernames for a specific review


router.post('/replies/:reviewId', isAuthenticated, async (req, res) => {
  const { userId, Rname, reply, comment } = req.body;
  const reviewId = req.params.reviewId;

  console.log("Received Review ID:", reviewId);

  // Check if reviewId is valid
  if (!reviewId) {
    console.error('Error: reviewId is undefined');
    return res.status(400).json({ error: 'reviewId is undefined' });
  }

  try {
    // Check if the review with the given reviewId exists
    const existingReview = await db.get('SELECT ReviewID FROM review WHERE ReviewID = ?', [reviewId]);
    if (!existingReview) {
      console.error('Error: Review with the given reviewId does not exist');
      return res.status(404).json({ error: 'Review not found' });
    }

    // Insert the new reply into the database
    const result = await db.run(
      'INSERT INTO reply (UserID, ReviewID, Rname, reply, comment) VALUES (?, ?, ?, ?, ?)',
      [userId, reviewId, Rname, reply, comment]
    );

    const newReplyId = result.lastID;

    // Log the details of the submitted reply
    console.log('New Reply Submitted:');
    console.log('UserID:', userId);
    console.log('ReviewID:', reviewId);
    console.log('Rname:', Rname);
    console.log('Reply:', reply);
    console.log('Comment:', comment);

    res.status(201).json({ message: 'Reply submitted successfully'});
  } catch (error) {
    console.error('Error submitting reply:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


// Endpoint to fetch replies for a specific review
router.get('/:reviewId', async (req, res) => {
  const reviewId = req.params.reviewId;

  try {
    // Query the database to fetch replies and usernames for the specified review
    const repliesWithUsernames = await new Promise((resolve, reject) => {
      db.all(`
        SELECT reply.Reply, User.Username
        FROM reply
        JOIN User ON reply.UserID = User.UserID
        WHERE reply.ReviewID = ?
      `, [reviewId], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows);
      });
    });

    // Send the fetched replies with usernames as a JSON response
    res.json({ repliesWithUsernames });
  } catch (error) {
    console.error('Error fetching replies with usernames:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});




module.exports = router;