const express = require('express');
const router = express.Router();
const db = require('../db'); // Import your database module here
const isAuthenticated = require("../authMiddleware");

router.post('/updatePaidStatus', isAuthenticated, async (req, res) => {
  const userId = req.userId;
  const { status } = req.body;

  // Logging the status and userId for debugging
  console.log('Status:', status);

  try {
    // Update the bookmark entry in the database
    const updatePaymentQuery = `
      UPDATE User
      SET Paid = ?
      WHERE UserID = ?
    `;

    await new Promise((resolve, reject) => {
      db.run(updatePaymentQuery, [status, userId], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    res.status(200).json({ message: 'Paid status updated successfully' });
  } catch (error) {
    console.error('Error updating Paid status:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// paymentRoutes.js

// ... (existing code)

router.get('/status', isAuthenticated, async (req, res) => {
  const userId = req.userId;

  try {
    // Fetch the payment status from the database
    const getPaymentStatusQuery = `
      SELECT Paid
      FROM User
      WHERE UserID = ?
    `;

    const result = await new Promise((resolve, reject) => {
      db.get(getPaymentStatusQuery, [userId], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });

    res.status(200).json({ status: result ? result.Paid : 'unpaid' });
  } catch (error) {
    console.error('Error fetching payment status:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Inside your search route
router.get('/search', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;

    console.log('User ID:', userId); // Log the user ID

    // Retrieve user's paid status and search count
    const userQuery = 'SELECT Paid, search FROM User WHERE UserID = ?';
    const userParams = [userId];

    // Use new Promise to wait for the asynchronous database operation
    const userResults = await new Promise((resolve, reject) => {
      db.get(userQuery, userParams, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });

    console.log('User Results:', userResults); // Log the user results

    // Return user's paid status and search count
    res.status(200).json({
      paid: userResults.Paid,
      searchCount: userResults.search,
    });
  } catch (error) {
    console.error('Error checking user details:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



// Function to increment the search count for a user


router.post('/update-search-count', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;

    // Update the search count in your database
    const updateSearchCountQuery = 'UPDATE User SET search = search + 1 WHERE UserID = ?';
    const updateSearchCountParams = [userId];
    await db.run(updateSearchCountQuery, updateSearchCountParams);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error updating search count:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;



