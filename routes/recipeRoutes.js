// recipeRoutes.js

const express = require("express");
const router = express.Router();
const multer = require("multer");
const db = require("../db");
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
};


// Assuming 'uploads' is the folder where you want to save the images

const storage = multer.memoryStorage(); // Use memory storage for handling in-memory file processing
const upload = multer({ storage: storage });

router.get('/user-recipes', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;

    // Fetch recipes for the authenticated user using a Promise
    const recipes = await new Promise((resolve, reject) => {
      const sql = 'SELECT Rname FROM Recipe_Np WHERE UserID = ?';
      db.all(sql, [userId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });

    console.log('Fetched recipes:', recipes);

    res.json(recipes);
  } catch (error) {
    console.error('Error fetching user recipes:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


let temporaryRecipeData = null;

router.post('/createRecipe', upload.fields([
  { name: 'recipeImage', maxCount: 1 },
]), isAuthenticated, (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized access' });
      return;
    }
    // Access the uploaded image using the specified field name
    const uploadedImage = req.files['recipeImage'][0];

    // Access other form fields
    const { recipeName, recipeDescription, cookingTimeValue, recipeIngredients,selectedDpTags,selectedAllergyTags } = req.body;

    // Store the data temporarily
    temporaryRecipeData = {
      recipeName,
      recipeDescription,
      cookingTimeValue,
      recipeIngredients,
      selectedDpTags,
      selectedAllergyTags,
      uploadedImage,
      userId,
    };

    // Process the data as needed
    console.log("Received data:", temporaryRecipeData)

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error processing recipe data:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});



router.post('/createRecipeSecond', (req, res) => {
  const recipeData = req.body;
  console.log("Received data:", recipeData);
  const FirstRecipeData = temporaryRecipeData;
  console.log("First Data:",FirstRecipeData)

  // Assuming "Recipe_Np" table structure matches the provided schema
  const sql = `
    INSERT INTO Recipe_Np (
      Rname, instruction, ratings, review, ingredients, image,
      description, allergy_tags, dp_tags, tips_tricks, info, cTime, calorie, UserID
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const formattedNutritionalFacts = parseAndFormatNutritionalFacts(recipeData.nutritionalFacts);
  const formattedTips = parseAndFormatTips(recipeData.tips);

  const formatTags = (tags) => {
    if (Array.isArray(tags)) {
      return tags.join(',');
    } else if (typeof tags === 'string') {
      // If tags is a string, return it as is
      return tags;
    } else {
      // If tags is neither an array nor a string, return an empty string or handle it as needed
      return '';
    }
  };


  const values = [
    FirstRecipeData.recipeName,
    recipeData.recipeSteps,      // instruction
    "",                          // ratings (empty for now, update based on your needs)
    "",                          // review (empty for now, update based on your needs)
    FirstRecipeData.recipeIngredients,// ingredients
    FirstRecipeData.uploadedImage.buffer,         // image
    FirstRecipeData.recipeDescription,
    formatTags(FirstRecipeData.selectedAllergyTags), // allergy_tags
    formatTags(FirstRecipeData.selectedDpTags),                          // dp_tags (empty for now, update based on your needs)
    formattedTips,             // tips_tricks (empty for now, update based on your needs)
    recipeData.funFacts,         // info (empty for now, update based on your needs)
    FirstRecipeData.cookingTimeValue,
    formattedNutritionalFacts,
    FirstRecipeData.userId,                           // calorie (you need to update this based on your needs)
  ];

  console.log("SQL Statement:", sql);
  console.log("Values:", values);

  

  db.run(sql, values, function (err) {
    if (err) {
      console.error("Error inserting recipe:", err.message);
      res.status(500).json({ success: false, error: err.message });
    } else {
      console.log(`Recipe inserted with ID ${this.lastID}`);
      res.status(200).json({ success: true });
    }
  });
});

const parseAndFormatNutritionalFacts = (inputText) => {
  const nutritionalFactsArray = inputText.split('\n');

  const formattedNutritionalFactsObj = {};

  nutritionalFactsArray.forEach((fact) => {
    const match = fact.match(/([^=]+)\s*=\s*([^,]+)/);

    if (match && match.length === 3) {
      const key = match[1].trim();
      const value = match[2].trim();

      formattedNutritionalFactsObj[key] = value;
    }
  });

  return Object.entries(formattedNutritionalFactsObj)
    .map(([key, value]) => `${key} = ${value}`)
    .join(', ');
};

const parseAndFormatTips = (inputText) => {
  const tipsArray = inputText.split('\n');

  // Remove leading and trailing whitespaces from each tip and concatenate with '|'
  const formattedTips = tipsArray.map(tip => tip.trim()).join(' | ');

  return formattedTips;
};

// Search for recipes
router.get('/search', async (req, res) => {
  const { query } = req.query;

    // const sql = 'SELECT * FROM Recipe_Np WHERE Rname is not null and Rname LIKE ?';
    // const params = `%${query}%`;

    // Function to execute a SQL query and return a promise
    function executeQuery(sql, params) {
      // Function to get full name from UserID
      function getFullName(userID) {
        return new Promise((resolve, reject) => {
          const sql = 'SELECT FName, LName FROM User WHERE UserID = ?';
          db.get(sql, [userID], (err, row) => {
            if (err) {
              reject(err);
            } else {
              resolve(row ? `${row.FName} ${row.LName}` : null);
            }
          });
        });
      }

      return new Promise((resolve, reject) => {
        db.all(sql, params, async (err, results) => {
          if (err) {
            reject(err);
          } else {
            // Extract the recipe name and fetch the username using UserID
            const extractedResults = results.map(async result => {
              const { Rname, UserID } = result;
              const createdBy = await getFullName(UserID);
              return { Rname, createdBy };
            });
            Promise.all(extractedResults).then(resolve).catch(reject);
          }
        });
      });
    }

    // Function to retrieve all recipes
    async function getRecipes() {
      // const sql = 'SELECT * FROM Recipe_Np';
      const sql = `
        SELECT R.*, U.FName, U.LName
        FROM Recipe_Np AS R
        INNER JOIN User AS U ON R.UserID = U.UserID
        WHERE R.Rname IS NOT NULL AND R.Rname LIKE ?
      `;
      const params = `%${query}%`;
      
      try {
        const results = await executeQuery(sql, params);
        return results;
      } catch (error) {
        throw new Error('Error fetching recipes: ' + error);
      }
    }

    try {
      // Call the getRecipes function to retrieve all recipes
      const recipes = await getRecipes(); console.log("recipes", recipes);
  
      // res.json(recipes);

      if (recipes.length > 0) {
        // Recipes with the specified Rname exist
        res.json(recipes);
      } else {
        // No recipes found with the specified Rname
        res.json({ error: 'Recipe not found' });
      }
    } catch (error) {
      console.error('Error fetching recipes:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get details of a specific recipe
router.get('/:recipeName', async (req, res) => {
  const recipeName = req.params.recipeName;

  // Fetch the description and image from the database based on the recipeName
  const query = 'SELECT description, image, ratings, ingredients, instruction, info, calorie, tips_tricks, cTime FROM Recipe_Np WHERE Rname = ?';

  db.get(query, [recipeName], (err, result) => {
    if (err) {
      console.error('Error fetching recipe details:', err.message);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    if (result) {
      const imageBase64 = result.image.toString('base64');
      res.json({ 
        description: result.description, 
        image: `data:image/jpeg;base64,${imageBase64}`, // Adjust the MIME type accordingly
        ratings: result.ratings, 
        ingredients: result.ingredients, 
        instruction: result.instruction, 
        info: result.info, 
        calorie: result.calorie,
        tips_tricks: result.tips_tricks,
        cTime: result.cTime
      });
    } else {
      res.status(404).json({ error: 'Recipe not found' });
    }
  });
});

// POST endpoint to add a recipe to favorites
router.post('/add-to-favorites', async (req, res) => {
  try {
    const userId = req.session.userId;
    const { recipeName } = req.body;

    // Example SQL query to insert into UserFavorites
    const insertQuery = 'INSERT INTO UserFavorites (UserID, Rname, isFavorite) VALUES (?, ?, 1)';
    await db.run(insertQuery, [userId, recipeName]);

    res.json({ success: true });
  } catch (err) {
    console.error('Error adding recipe to favorites:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/updating/:recipeName', isAuthenticated, async (req, res) => {
  const userId = req.session.userId;
  const recipeName = req.params.recipeName;
  const {
    description,
    ingredients,
    instruction,
    tips_tricks,
    funFacts,
    calorie
  } = req.body;

  try {
    // Update the Recipe_Np entry in the database
    const updateRecipeQuery = `
      UPDATE Recipe_Np
      SET description = ?,
      ingredients = ?,
          instruction = ?,
          tips_tricks = ?,
          info = ?,
          calorie = ?
      WHERE Rname = ? AND UserID = ?
    `;

    await new Promise((resolve, reject) => {
      db.run(
        updateRecipeQuery, [description,ingredients, instruction, tips_tricks, funFacts, calorie, recipeName, userId],
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });

    res.status(200).json({
      message: 'Recipe updated successfully'
    });
  } catch (error) {
    console.error('Error updating recipe:', error);
    res.status(500).json({
      error: 'Internal Server Error'
    });
  }
});

// POST endpoint to remove a recipe from favorites
router.post('/remove-from-favorites', async (req, res) => {
  try {
    const userId = req.session.userId;
    const { recipeName } = req.body;

    // Example SQL query to update UserFavorites and set isFavorite to 0
    const updateQuery = 'UPDATE UserFavorites SET isFavorite = 0 WHERE UserID = ? AND Rname = ?';
    await db.run(updateQuery, [userId, recipeName]);

    res.json({ success: true });
  } catch (err) {
    console.error('Error removing recipe from favorites:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET endpoint to fetch user's favorite recipes
router.get('/user-favorites', async (req, res) => {
  try {
    const userId = req.session.userId;

    // Example SQL query to select favorite recipes
    const selectQuery = 'SELECT Rname FROM UserFavorites WHERE UserID = ? AND isFavorite = 1';
    const rows = await db.all(selectQuery, [userId]);

    res.json({ favorites: rows.map((row) => row.Rname) });
  } catch (err) {
    console.error('Error fetching user favorites:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});




module.exports = router;
