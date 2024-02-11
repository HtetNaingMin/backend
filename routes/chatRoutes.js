const express = require("express");
const router = express.Router();

// Export a function that takes the io object as a parameter
module.exports = function (io) {
  // Event listener for connections
  io.on("connection", (socket) => {
    console.log("User connected");

    // Event listener for pre-chat questions
    socket.on("preChatQuestions", (questions) => {
      console.log("Pre-chat questions:", questions);
      // You can save or process pre-chat questions as needed
      // For simplicity, we'll broadcast them to all connected users
      io.emit("message", `User: Age - ${questions.age}, Health - ${questions.healthCondition}`);
    });

    // Event listener for incoming messages
    socket.on("message", (message) => {
      console.log("Message:", message);
      // Broadcast the message to all connected users
      io.emit("message", `User: ${message}`);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });

  // Attach Socket.IO to the router
  router.io = io;

  // Return the router object (now modified as a middleware function)
  return router;
};
