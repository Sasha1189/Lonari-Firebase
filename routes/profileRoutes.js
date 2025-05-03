const express = require("express");
const router = express.Router();
authToken = require("../middlewares/authMiddleware");
const {
  updateOrCreateProfile,
  updateProfileImages,
  getProfile,
} = require("../controllers/profileController");

router.post("/update-profile", authToken, updateOrCreateProfile);
router.post("/update-profile-images", authToken, updateProfileImages);
router.post("/get-profile", authToken, getProfile);

module.exports = router;
