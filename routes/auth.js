const express = require("express");
const router = express.Router();
const authToken = require("../middlewares/authMiddleware");
const { updateMobileNumber } = require("../controllers/authController");

router.put("/update-mobile", authToken, updateMobileNumber);

module.exports = router;
