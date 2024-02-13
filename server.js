const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const authRoutes = require("./routes/authRoutes");
const commentsRoute = require("./routes/commentRoutes");
const profileRoutes = require("./routes/profileRoutes");
const mealPlanRoutes = require("./routes/mealPlanRoutes");
const newsfeedRoutes = require("./routes/NewsfeedRoutes");
const chatRoutes = require("./routes/chatRoutes");
const replyCommentRoutes = require("./routes/replyCommentRoutes");
const userRoutes = require("./routes/userRoutes");
const recipeRoutes = require("./routes/recipeRoutes");
const filterRoutes = require("./routes/filterRoutes");
const bookMarkRoutes = require("./routes/bookMarkRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const aboutmeRoutes = require("./routes/aboutmeRoutes");
const editUserRoutes = require("./routes/editUserRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const announcementRoutes = require("./routes/announcementRoutes");
const editRecipeRoutes = require("./routes/editRecipeRoutes");
const registrationRoutes = require("./routes/registrationRoutes");
const replyRoutes = require("./routes/replyRoutes");
const isAuthenticated = require("./authMiddleware");
const cors = require("cors");
const db = require("./db"); // Import the database module
const session = require("express-session");
const multer = require("multer");
const SQLiteStore = require('connect-sqlite3')(session);


const app = express();
const PORT = process.env.PORT || 3001;
const crypto = require("crypto");
const secretKey = crypto.randomBytes(32).toString("hex");
app.enable('trust proxy');

app.use(
  cors({
    origin: "https://cleancookbook.vercel.app", // Adjust this to your actual Next.js app origin
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    optionsSuccessStatus: 204,
    credentials: true,
    allowedHeaders: 'Authorization,Content-Type',
  })
);

app.use(
session({
  store: new SQLiteStore(),
  secret: secretKey,
  resave: false,
  saveUninitialized: true,
  proxy: true,
  cookie: {
    maxAge: null,
    secure: true, // Ensure that the cookie is only sent over HTTPS
    sameSite: 'None', // Set SameSite=None for cross-origin cookies
  },
})
);


app.use(bodyParser.json());
// Configure Multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


app.use("/api", authRoutes(isAuthenticated));
app.use("/api/profile", profileRoutes);
app.use("/api/user", userRoutes);
app.use("/api/news", newsfeedRoutes);
app.use("/api/recipe", recipeRoutes);
app.use("/api/filter", filterRoutes);
app.use("/api/aboutme", aboutmeRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/edit", editUserRoutes);
app.use("/api/bookmark", bookMarkRoutes);
app.use("/api/editRecipe", editRecipeRoutes);
app.use("/api/mealPlan", mealPlanRoutes);
app.use("/api/comments",  commentsRoute );
app.use("/api/registration",  registrationRoutes);
app.use("/api/reply",  replyRoutes);
app.use("/api/replyComment",replyCommentRoutes);

app.use("/api/announce", announcementRoutes);
app.get("/home", isAuthenticated, (req, res) => {
  res.json({ message: "Welcome to the home page!" });
});

// Handle requests to the root path
app.get("/", (req, res) => {
  res.send("Hello, this is your server!");
});

app.get("/api/healthy-videos", async (req, res) => {
  try {
    // Your YouTube API key
    const apiKey = "AIzaSyDQn1PH70g_omo7H8xCNTZ6TYaEiRXi3xY"; // Replace with your actual API key

    // Fetch YouTube videos using axios
    const response = await axios.get(
      'https://www.googleapis.com/youtube/v3/search', {
        params: {
          key: apiKey,
          part: 'snippet',
          q: 'healthy recipe', // Your search query here
          type: 'video',
          maxResults: 10, // Set the number of results you want
        },
      }
    );
    console.log(response.data);
    // Send the YouTube API response to the client
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching YouTube videos:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});