const express = require("express");
const router = express.Router();
authToken = require("../middlewares/authMiddleware");
const {
  updateOrCreateProfile,
  getProfile,
  queryProfiles,
  searchProfiles,
} = require("../controllers/profileController");
const {
  toggleLike,
  likesSentIds,
  likesReceivedIds,
  likesSentProfiles,
  likesReceivedProfiles,
} = require("../controllers/likeController");

router.post("/update-profile", authToken, updateOrCreateProfile);

router.get("/get-profile", authToken, getProfile);

router.get("/queryProfiles", queryProfiles);

router.get("/searchProfiles", authToken, searchProfiles);

//like related routes:

router.post("/toggle-like", authToken, toggleLike);

router.get("/likes-sentIds", authToken, likesSentIds);

router.get("/likes-receivedIds", authToken, likesReceivedIds);

//////
router.get("/likes-sentProfiles", authToken, likesSentProfiles);
router.get("/likes-receivedProfiles", authToken, likesReceivedProfiles);

module.exports = router;
