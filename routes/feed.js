const express = require("express");
const {
  queryBrowseAllProfiles,
  queryRecommendedProfiles,
  queryLatestUpdatedProfiles,
} = require("../controllers/feedController");
authToken = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/browse-all", authToken, queryBrowseAllProfiles);
router.get("/recommended", authToken, queryRecommendedProfiles);
router.get("/latest-updated", authToken, queryLatestUpdatedProfiles);

module.exports = router;
