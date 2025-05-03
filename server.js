const express = require("express");
const cors = require("cors");
const colors = require("colors");
const dotenv = require("dotenv");
// const rateLimit = require("express-rate-limit");

// Initialize dotenv
dotenv.config();

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const profileRoutes = require("./routes/profileRoutes");
const messageRoutes = require("./routes/messageRoutes");

//Rest object
const app = express();

//rate limiter
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // Limit each IP to 100 requests per windowMs
//   message: "Too many requests from this IP, please try again later.",
// });

// Middleware
app.use(cors());
app.use(express.json());
// app.use(limiter);

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/profiles", profileRoutes);
app.use("/api/v1/messages", messageRoutes);

// Health check route
app.get("/", (req, res) => {
  res.status(200).json({ message: "Server is running" });
});
// PORT
const PORT = process.env.PORT || 8000;
//listen for incoming requests
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
//to run
//now to -> cd server -> node server.js enter if nodemon npm run server

//req.user response at server sent by firebase auth middleware
// {
//   iss: 'https://securetoken.google.com/smooth-pivot-453409-f7',
//   aud: 'smooth-pivot-453409-f7',
//   auth_time: 1745524174,
//   user_id: 'GKoLCOrAgcWmPzBGhPxGZXqvLUl1',
//   sub: 'GKoLCOrAgcWmPzBGhPxGZXqvLUl1',
//   iat: 1745780214,
//   exp: 1745783814,
//   phone_number: '+919766757696',
//   firebase: { identities: { phone: [Array] }, sign_in_provider: 'phone' },
//   uid: 'GKoLCOrAgcWmPzBGhPxGZXqvLUl1'
// }
