const express = require("express");
const cors = require("cors");
const colors = require("colors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");

dotenv.config();

const auth = require("./routes/auth");
const user = require("./routes/user");
const profile = require("./routes/profile");
const feed = require("./routes/feed");
// const chat = require("./routes/chat");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/v1/auth", auth);
app.use("/api/v1/users", user);
app.use("/api/v1/profiles", profile);
app.use("/api/v1/feed", feed);
// app.use("/api/v1/messages", chat);

app.get("/", (req, res) => {
  res.status(200).json({ message: "Server is running" });
});

// ✅ Create HTTP & Socket.IO server
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // ⚠️ tighten in prod
  },
});

// ✅ Init chat socket after io is defined
require("./socket/chatSocket")(io);

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// const express = require("express");
// const cors = require("cors");
// const colors = require("colors");
// const dotenv = require("dotenv");
// const http = require("http");
// const { Server } = require("socket.io");
// require("./socket/chatSocket")(io);
// // const rateLimit = require("express-rate-limit");

// // Initialize dotenv
// dotenv.config();

// const auth = require("./routes/auth");
// const user = require("./routes/user");
// const profile = require("./routes/profile");
// const chat = require("./routes/chat");

// //Rest object
// const app = express();

// //rate limiter
// // const limiter = rateLimit({
// //   windowMs: 15 * 60 * 1000, // 15 minutes
// //   max: 100, // Limit each IP to 100 requests per windowMs
// //   message: "Too many requests from this IP, please try again later.",
// // });

// // Middleware
// app.use(cors());
// app.use(express.json());
// // app.use(limiter);

// // Routes
// app.use("/api/v1/auth", auth);
// app.use("/api/v1/users", user);
// app.use("/api/v1/profiles", profile);
// app.use("/api/v1/messages", chat);

// // Health check route
// app.get("/", (req, res) => {
//   res.status(200).json({ message: "Server is running" });
// });

// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: "*",
//   },
// });

// // Socket.IO logic in separate file
// require("./socket/chatSocket")(io);

// // PORT
// const PORT = process.env.PORT || 8000;
// //listen for incoming requests
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

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
