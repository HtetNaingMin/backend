// backend/db.js
const sqlite3 = require('sqlite3');
require('dotenv').config(); // Load environment variables

const databasePath = process.env.DATABASE_PATH || "./CleanCookBook.db";


// Connect to your SQLite database with connection pooling
const db = new sqlite3.Database(databasePath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the database');
  }
});

// Configure connection pooling
db.configure("busyTimeout", 10000); // Set your desired timeout
// Set the maximum number of connections in the pool

module.exports = db;
