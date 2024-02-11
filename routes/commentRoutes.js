const express = require("express");
const router = express.Router();
const db = require("../db");
const isAuthenticated = require("../authMiddleware");

// GET comments with usernames for a specific announcement
router.get("/:announcementName", async (req, res) => {
    try {
        const { announcementName } = req.params;

        const comments = await new Promise((resolve, reject) => {
            db.all(
                `SELECT comments.*, User.Username 
                 FROM comments
                 INNER JOIN User ON comments.UserID = User.UserID
                 WHERE comments.Announcement = ?`,
                [announcementName],
                (err, rows) => {
                    if (err) {
                        console.error("Error fetching comments:", err.message);
                        reject(err);
                    } else {
                        console.log("Comments fetched successfully:", rows);
                        resolve(rows);
                    }
                }
            );
        });

        res.json(comments);
    } catch (error) {
        console.error("Error fetching comments:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
router.get("/likeCount/:announcementName", async (req, res) => {
    try {
        const { announcementName } = req.params;

        console.log("Fetching like count for announcement:", announcementName);

        const likeCount = await new Promise((resolve, reject) => {
            db.get(
                `SELECT COUNT(*) as likeCount
                 FROM comments
                 WHERE Announcement = ? AND "like" = 'like'`,
                [announcementName],
                (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                }
            );
        });

        console.log("Like count:", likeCount);

        res.json(likeCount);
    } catch (error) {
        console.error("Error fetching like count:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Add this in your routes file (e.g., comments.js)
router.post("/like", isAuthenticated, async (req, res) => {
    try {
        const userID = req.session.userId;
        const { announcementName, like } = req.body;
        console.log("is there like?",like);

        // Check if the user has already liked the announcement
        const existingLike = await new Promise((resolve, reject) => {
            db.get(
                `SELECT * FROM comments WHERE Announcement = ? AND UserID = ?`,
                [announcementName, userID],
                (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                }
            );
        });

        console.log("Existing like:", existingLike);

        if (existingLike) {
            // If the user already liked, update the like
            console.log("Updating existing like");
            await new Promise((resolve, reject) => {
                db.run(
                    `UPDATE comments SET "like" = ? WHERE Announcement = ? AND UserID = ?`,
                    [like, announcementName, userID],
                    (err) => {
                        if (err) {
                            console.error("Error updating like:", err.message);
                            reject(err);
                        } else {
                            console.log("Like updated successfully");
                            resolve();
                        }
                    }
                );
            });
        } else {
            // If the user hasn't liked, insert a new like record
            console.log("Inserting new like");
            await new Promise((resolve, reject) => {
                db.run(
                    `INSERT INTO comments (Announcement, UserID, "like") VALUES (?, ?, ?)`,
                    [announcementName, userID, like],
                    (err) => {
                        if (err) {
                            console.error("Error inserting like:", err.message);
                            reject(err);
                        } else {
                            console.log("is there like?",like);
                            console.log("Like inserted successfully");
                            resolve();
                        }
                    }
                );
            });
        }

        res.json({ success: true });
    } catch (error) {
        console.error("Error handling like:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
router.get("/likeStatus/:announcementName",isAuthenticated, async (req, res) => {
    try {
      const { announcementName } = req.params;
      const userID = req.session.userId;
  
      // Fetch the like status for the announcement from the database
      const likeStatus = await new Promise((resolve, reject) => {
        db.get(
          `SELECT * FROM comments WHERE Announcement = ? AND UserID = ? AND like = 'like'`,
          [announcementName, userID ],
          (err, result) => {
            if (err) {
              reject(err);
            } else {
              resolve(result);
            }
          }
        );
      });
  
      // Send the like status back to the frontend
      res.json({ isLiked: !!likeStatus }); // Convert to boolean
      console.log("soo what does this mean",!!likeStatus );
    } catch (error) {
      console.error("Error fetching like status:", error.message);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
  
  router.post('/addComment', async (req, res) => {
    try {
      const { announcementName, comment } = req.body;
      const userID = req.session.userId; // Assuming you have user authentication middleware
  
      // Check if the user has already commented on the announcement
      const existingComment = await new Promise((resolve, reject) => {
        db.get(
          'SELECT * FROM comments WHERE Announcement = ? AND UserID = ?',
          [announcementName, userID],
          (err, result) => {
            if (err) {
              reject(err);
            } else {
              resolve(result);
            }
          }
        );
      });
  
      // If the user has already commented, update the existing comment
      if (existingComment) {
        await new Promise((resolve, reject) => {
          db.run(
            'UPDATE comments SET comment = ? WHERE Announcement = ? AND UserID = ?',
            [comment, announcementName, userID],
            (err) => {
              if (err) {
                reject(err);
              } else {
                resolve();
              }
            }
          );
        });
      } else {
        // If the user hasn't commented yet, insert a new comment
        await new Promise((resolve, reject) => {
          db.run(
            'INSERT INTO comments (Announcement, UserID, comment) VALUES (?, ?, ?)',
            [announcementName, userID, comment],
            (err) => {
              if (err) {
                reject(err);
              } else {
                resolve();
              }
            }
          );
        });
      }
  
      // Send a success response
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error handling comment submission:', error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  router.delete("/:commentId", async (req, res) => {
    const { commentId } = req.params;
  
    const updateQuery = `
      UPDATE comments
      SET Comment = NULL
      WHERE CommentID = ?;
    `;
  
    try {
      await new Promise((resolve, reject) => {
        db.run(updateQuery, [commentId], (err) => {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        });
      });
  
      res.json({ success: true, message: "Comment updated successfully" });
    } catch (error) {
      console.error("Error updating comment:", error.message);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  });
  
  
  





module.exports = router;
