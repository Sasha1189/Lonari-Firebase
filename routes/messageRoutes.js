const express = require("express");
const router = express.Router();
const {
  postMessage,
  fetchMessages,
} = require("../controllers/messageController");

module.exports = router;
