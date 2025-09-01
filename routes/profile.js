const express = require("express");
const router = express.Router();
authToken = require("../middlewares/authMiddleware");
const {
  updateOrCreateProfile,
  getProfile,
  queryProfiles,
  searchProfiles,
} = require("../controllers/profileController");

router.post("/update-profile", authToken, updateOrCreateProfile);

router.get("/get-profile", authToken, getProfile);

router.get("/queryProfiles", queryProfiles);

router.get("/searchProfiles", authToken, searchProfiles);

module.exports = router;
