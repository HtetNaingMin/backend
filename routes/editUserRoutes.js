const express = require("express");
const router = express.Router();
const db = require("../db");
const multer = require("multer");


const storage = multer.memoryStorage(); // Use memory storage for handling in-memory file processing
const upload = multer({ storage: storage });


router.delete("/:userID", async (req, res) => {
    const userID = req.params.userID;
    console.log("Received DELETE request for userID:", userID);
  
    try {
      await db.run("BEGIN TRANSACTION");
  
      // Delete from AboutMe table
      await db.run("DELETE FROM AboutMe WHERE UserID = ?", [userID]);
  
      // Delete from User table
      await db.run("DELETE FROM User WHERE UserID = ?", [userID]);
  
      await db.run("COMMIT");
      console.log("Transaction committed successfully");
  
      res.json({ success: true, message: "User and related AboutMe record deleted successfully." });
    } catch (error) {
      await db.run("ROLLBACK");
      console.error("Error deleting user and AboutMe record:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  router.delete("/partner/:userID", async (req, res) => {
    const userID = req.params.userID;
    console.log("Received DELETE request for partner userID:", userID);
  
    try {
      await db.run("BEGIN TRANSACTION");
  
      // Delete from NutritionistSignUp table
      await db.run("DELETE FROM NutritionistSignUp WHERE UserID = ?", [userID]);
  
      // Delete from User table
      await db.run("DELETE FROM User WHERE UserID = ?", [userID]);
  
      await db.run("COMMIT");
      console.log("Transaction committed successfully");
  
      res.json({ success: true, message: "Partner and related records deleted successfully." });
    } catch (error) {
      await db.run("ROLLBACK");
      console.error("Error deleting partner and related records:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
  

  router.patch('/approve/:userId', async (req, res) => {
    const { userId } = req.params;
    const { status } = req.body;
  
    try {
      const result = await new Promise((resolve, reject) => {
        db.run('UPDATE NutritionistSignUp SET Status = ? WHERE UserID = ?', [status, userId], (err) => {
          if (err) {
            reject(err);
          } else {
            resolve({ success: true });
          }
        });
      });
  
      if (result.success) {
        res.json({ success: true, message: `User with ID ${userId} status updated successfully` });
      } else {
        res.status(500).json({ success: false, message: 'Internal Server Error' });
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  });

  router.get("/:userID", async (req, res) => {
    const userID = req.params.userID;

    // Fetch user details from the database based on the userID
    const query = "SELECT * FROM User WHERE UserID = ?";

    db.get(query, [userID], (err, user) => {
        if (err) {
            console.error("Error fetching user details:", err.message);
            res.status(500).json({ success: false, error: "Internal Server Error" });
            return;
        }

        if (user) {
            res.json({ success: true, user });
        } else {
            res.status(404).json({ success: false, message: "User not found" });
        }
    });
});

// Import necessary modules
// Update user details
router.post("/update-profile", async (req, res) => {
  const updatedDetails = req.body; // Assuming your request body contains the updated details
  console.log(updatedDetails)

  try {
    // Update User table with the new details
    await db.run(
      "UPDATE User SET Username = ?, FName = ?, LName = ?, dob = ?, gender = ?, email = ?, Paid = ? WHERE UserID = ?", 
      [
        updatedDetails.username,
        updatedDetails.FName,
        updatedDetails.LName,
        updatedDetails.dob,
        updatedDetails.gender,
        updatedDetails.email,
        updatedDetails.Paid,
        updatedDetails.UserID,
      ]
    );
    

    console.log("User details updated successfully");
    res.json({ success: true, message: "User details updated successfully." });
  } catch (error) {
    console.error("Error updating user details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const aboutMeQuery = `
  SELECT
    height,
    Weight,
    allergy,
    BMI,
    DietMethod,
    DietaryPreferance,
    HealthGoal
  FROM
    AboutMe
  WHERE
    UserID = ?
`;

router.get('/userInfo/:userId', (req, res) => {
  try {
    const userId = req.params.userId;
    console.log(userId);

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


router.post('/update-AboutMe/:userId', async (req, res) => {
  const userId = req.params.userId; // Get the user ID from the URL parameters

  const {
    DietaryPreferance,
    allergy,
    DietMethod,
    HealthGoal,
    height,
    Weight,
    BMI,
  } = req.body;

  try {
    // Assuming you have a table named 'AboutMe' with a column 'UserID' to identify the user
    const updateAboutMeQuery = `
      UPDATE AboutMe
      SET
        DietaryPreferance = ?,
        allergy = ?,
        DietMethod = ?,
        HealthGoal = ?,
        height = ?,
        Weight = ?,
        BMI = ?
      WHERE UserID = ?
    `;

    const params = [
      JSON.stringify(DietaryPreferance),
      JSON.stringify(allergy),
      JSON.stringify(DietMethod),
      JSON.stringify(HealthGoal),
      height,
      Weight,
      BMI,
      userId,
    ];

    db.run(updateAboutMeQuery, params, function (err) {
      if (err) {
        console.error('Database update error:', err.message);
        res.status(500).json({ error: 'Internal Server Error' });
      } else {
        res.json({ success: true });
      }
    });
  } catch (error) {
    console.error('Error updating About Me:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get("/partner/change/:userID", async (req, res) => {
  const userID = req.params.userID;

  // Fetch partner details from the NutritionistSignUp table based on the userID
  const query = "SELECT * FROM NutritionistSignUp WHERE UserID = ?";

  db.get(query, [userID], (err, partner) => {
    if (err) {
      console.error("Error fetching partner details:", err.message);
      res.status(500).json({ success: false, error: "Internal Server Error" });
      return;
    }

    if (partner) {
      res.json({ success: true, partner });
    } else {
      res.status(404).json({ success: false, message: "Partner not found" });
    }
  });
});

router.put("/partner/upload/:userID", upload.fields([
  { name: 'licenseImage', maxCount: 1 },
  { name: 'userPhoto', maxCount: 1 },
  { name: 'experienceFile', maxCount: 1 },
  { name: 'testimonyFile', maxCount: 1 }
]), (req, res) => {
  const userID = req.params.userID;
  console.log("Received files:", req.files);

  // Access the uploaded files using req.files
  const licenseImage = req.files['licenseImage'] ? req.files['licenseImage'][0] : null;
  const userPhoto = req.files['userPhoto'] ? req.files['userPhoto'][0] : null;
  const experienceFile = req.files['experienceFile'] ? req.files['experienceFile'][0] : null;
  const testimonyFile = req.files['testimonyFile'] ? req.files['testimonyFile'][0] : null;
  const linkedinUrl = req.body.linkedInUrl;


  // Start building the SQL query
  let sql = "UPDATE NutritionistSignUp SET ";

  const updateFields = [];

  // Check each field and add it to the updateFields array if it exists in the request
  if (linkedinUrl) updateFields.push(`LinkedInURL = ?`);
  if (licenseImage) updateFields.push(`LicenseImage = ?`);
  if (userPhoto) updateFields.push(`UserPhoto = ?`);
  if (experienceFile) updateFields.push(`ExperienceFile = ?`);
  if (testimonyFile) updateFields.push(`TestimonyFile = ?`);

  if (updateFields.length === 0) {
    return res.status(400).json({ success: false, error: 'No fields to update' });
  }

  sql += updateFields.join(", ");

  // Complete the SQL query
  sql += ` WHERE UserID = ?`;

  // Create an array of values to be used in the query
  const values = [];
  if (linkedinUrl) values.push(linkedinUrl);
  if (licenseImage) values.push(licenseImage.buffer);
  if (userPhoto) values.push(userPhoto.buffer);
  if (experienceFile) values.push(experienceFile.buffer);
  if (testimonyFile) values.push(testimonyFile.buffer);
  values.push(userID);

  console.log("SQL Query:", sql);
  console.log("Values:", values);

  // Execute the SQL query
  db.run(sql, values, function (err) {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ success: false, error: 'Failed to update fields', details: err.message });
    }

    // Check the number of rows affected to determine if the update was successful
    if (this.changes > 0) {
      return res.status(200).json({ success: true, message: 'Fields updated successfully' });
    } else {
      return res.status(404).json({ success: false, error: 'User not found or no fields updated' });
    }
  });
});


module.exports = router;

  
  
