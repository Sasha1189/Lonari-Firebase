const express = require("express");
const router = express.Router();
const {
  createUserDoc,
  updateUserDoc,
  getUserByUid,
  updateOrCreateSettings,
  getSettings,
} = require("../controllers/userController");
const authToken = require("../middlewares/authMiddleware");

router.post("/create-user", createUserDoc);
router.post("/update-user", authToken, updateUserDoc);
router.get("/:uid", getUserByUid);
router.post("/update-settings", authToken, updateOrCreateSettings);
router.get("/get-settings", authToken, getSettings);

module.exports = router;
