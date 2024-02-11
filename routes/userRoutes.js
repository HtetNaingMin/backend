const express = require("express");
const router = express.Router();
const db = require("../db");
const isAuthenticated = require("../authMiddleware");
const multer = require('multer');


let userData = null;
let userData1 = null;
let userData2 = null;

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get("/", async (req, res) => {
  try {
    const users = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM User WHERE UserType = 'user'", (err, rows) => {
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



router.post("/userType", isAuthenticated, async (req, res) => {
  try {
    const user = await new Promise((resolve, reject) => {
      // Use template literals for SQL query
      db.all(`SELECT UserType FROM User WHERE UserID = ${req.userId}`, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });

    // Check if the query returned any rows
    if (user && user.length > 0) {
      // Assuming the user type is a property of the first row
      const userType = user[0].UserType;
      res.json({ userType });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error fetching user type:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


router.get("/partner", async (req, res) => {
  try {
    const users = await new Promise((resolve, reject) => {
      db.all('SELECT User.* FROM User INNER JOIN NutritionistSignUp ON User.UserID = NutritionistSignUp.UserID WHERE User.UserType = "nutritionist" AND NutritionistSignUp.Status = "approved"', (err, rows) => {
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

router.get('/partnerInfo', async (req, res) => {
  try {
    const users = await new Promise((resolve, reject) => {
      // Assuming there's a 'Status' column in your table
      db.all("SELECT * FROM NutritionistSignUp WHERE Status = 'approved'", (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });

    // Convert BLOB to Base64
    const usersWithBase64 = users.map(user => {
      return {
        ...user,
        LicenseImage: user.LicenseImage ? user.LicenseImage.toString('base64') : null,
        UserPhoto: user.UserPhoto ? user.UserPhoto.toString('base64') : null,
        ExperienceFile: user.ExperienceFile ? user.ExperienceFile.toString('base64') : null,
        TestimonyFile: user.TestimonyFile ? user.TestimonyFile.toString('base64') : null,
      };
    });

    res.json(usersWithBase64);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/ReviewInfo', async (req, res) => {
  try {
    const users = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM User INNER JOIN NutritionistSignUp ON User.UserID = NutritionistSignUp.UserID", (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });

    // Convert BLOB to Base64
    const usersWithBase64 = users.map(user => {
      const userWithBase64 = { ...user };
      Object.keys(user).forEach(key => {
        if (Buffer.isBuffer(user[key])) {
          userWithBase64[key] = user[key].toString('base64');
        }
      });
      return userWithBase64;
    });

    res.json(usersWithBase64);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get("/userInfo", async (req, res) => {
  try {
    const usersInfo = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM AboutMe", (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });

    res.send(usersInfo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// Move the upload middleware here
router.post("/upload", upload.fields([
  { name: 'licenseImage', maxCount: 1 },
  { name: 'userPhoto', maxCount: 1 },
  { name: 'experienceFile', maxCount: 1 },
  { name: 'testimonyFile', maxCount: 1 }
]), (req, res) => {
  console.log("Received files:", req.files);
  // Access the uploaded files using req.files
  const licenseImage = req.files['licenseImage'][0];
  const userPhoto = req.files['userPhoto'][0];
  const experienceFile = req.files['experienceFile'][0];
  const testimonyFile = req.files['testimonyFile'][0];
  const linkedinUrl = req.body.linkedinUrl;

  userData2 = {
    
    licenseImage: licenseImage,
    userPhoto: userPhoto,
    experienceFile: experienceFile,
    testimonyFile: testimonyFile,
    linkedinUrl: linkedinUrl,
  };

  res.json({ message: 'Files uploaded successfully' });
});

router.post("/signup", (req, res) => {
  userData = req.body;
  console.log("Received signup data:", userData);

  // Check if a user with the same username already exists
  const checkUserQuery = "SELECT * FROM User WHERE Username = ?";
  db.get(checkUserQuery, [userData.username], (err, user) => {
    if (err) {
      console.error("Database query error:", err.message);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }

    if (user) {
      // User with the same username exists, return an error
      res.status(400).json({ error: "Username already exists" });
    } else {
      // User does not exist, proceed with signup
      res.status(200).json({ success: true });
    }
  });
});

router.post("/quiz", (req, res) => {
  userData1 = req.body;
  console.log("Received quiz data:", userData1);
  res.status(200).json({ success: true });
});

router.post("/create-account-n", (req, res) => {
  const isChecked = req.body.checked;

  if (isChecked) {
    console.log("Terms are accepted.");
    console.log("userData:", userData);
    console.log("userData2:", userData2);

    if (userData && userData2) {
      // Insert data into the "User" table
      db.run(
        "INSERT INTO User (Username, password, email, FName, LName, gender, dob, UserType) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          userData.username,
          userData.password,
          userData.email,
          userData.firstName,
          userData.lastName,
          userData.gender,
          userData.dob,
          userData.userType, // Set the user type to 'nutritionist'
        ],
        function (err) {
          if (err) {
            console.error("Error inserting into User table:", err.message);
            res.status(500).json({ error: "Internal Server Error" });
            return;
          }

          // Insert data into the "NutritionistSignUp" table
          const userId = this.lastID; // ID of the last inserted row in the "User" table
          const {
            linkedinUrl,
            licenseImage,
            userPhoto,
            experienceFile,
            testimonyFile,
          } = userData2;

          db.run(
            "INSERT INTO NutritionistSignUp (UserID, LinkedInURL, LicenseImage, UserPhoto, ExperienceFile, TestimonyFile) VALUES (?, ?, ?, ?, ?, ?)",
            [
              userId,
              linkedinUrl,
              licenseImage.buffer, // Assuming licenseImage is a multer file object
              userPhoto.buffer,    // Assuming userPhoto is a multer file object
              experienceFile.buffer,// Assuming experienceFile is a multer file object
              testimonyFile.buffer, 
            ],
            function (err) {
              if (err) {
                console.error(
                  "Error inserting into NutritionistSignUp table:",
                  err.message
                );
                res.status(500).json({ error: "Internal Server Error" });
                return;
              }
              // Reset userData and userData1 after successful insertion
              userData = null;
              userData2 = null;

              res.status(200).json({ success: true });
            }
          );
        }
      );
    } else {
      res
        .status(400)
        .json({ error: "Data not received from signup and quiz pages or username already taken" });
    }
  } else {
    res.status(400).json({ error: "Terms not accepted" });
  }
});

router.post("/create-account", (req, res) => {
  const isChecked = req.body.checked;
  
  if (isChecked) {
    console.log("Terms are accepted.");
    console.log("userData:", userData);
    console.log("userData1:", userData1);

    if (userData && userData1) {
      // Insert data into the "User" table
      db.run(
        "INSERT INTO User (Username, password, email, FName, LName, gender, dob, UserType) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          userData.username,
          userData.password,
          userData.email,
          userData.firstName,
          userData.lastName,
          userData.gender,
          userData.dob,
          userData.userType
        ],
        function (err) {
          if (err) {
            console.error("Error inserting into User table:", err.message);
            res.status(500).json({ error: "Internal Server Error" });
            return;
          }

          // Insert data into the "AboutMe" table
          const userId = this.lastID; // ID of the last inserted row in the "User" table
          const {
            currentWeight,
            currentHeight,
            dietaryPreferences,
            allergies,
            cookingTime,
            healthGoals,
            dietMethods,
          } = userData1;

          // Calculate BMI
          const heightInMeters = currentHeight / 100;
          const bmi = (currentWeight / (heightInMeters * heightInMeters)).toFixed(2);

          db.run(
            "INSERT INTO AboutMe (height, Weight, allergy, BMI, UserID, cookingTime, DietMethod, DietaryPreferance, HealthGoal) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
              currentHeight,
              currentWeight,
              JSON.stringify(allergies),
              bmi, // Include BMI in the array of values
              userId,
              JSON.stringify(cookingTime),
              JSON.stringify(dietMethods),
              JSON.stringify(dietaryPreferences),
              JSON.stringify(healthGoals),
            ],
            function (err) {
              if (err) {
                console.error(
                  "Error inserting into AboutMe table:",
                  err.message
                );
                res.status(500).json({ error: "Internal Server Error" });
                return;
              }
              // Reset userData and userData1 after successful insertion
              userData = null;
              userData1 = null;

              res.status(200).json({ success: true });
            }
          );
        }
      );
    } else {
      res
        .status(400)
        .json({ error: "Data not received from signup and quiz pages or username already taken" });
    }
  } else {
    res.status(400).json({ error: "Terms not accepted" });
  }
});

module.exports = router;
