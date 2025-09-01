const { admin } = require("../firebaseAdmin");
const { db } = require("../firebaseAdmin");
const { Timestamp } = require("firebase-admin/firestore");

// Create User Doc
const createUserDoc = async (req, res) => {
  try {
    const { uid, phoneNumber, displayName } = req.body;

    if (!uid || !phoneNumber || !displayName) {
      return res.status(400).json({ message: "User credentials are required" });
    }

    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();
    // console.log("userDoc", userDoc);

    if (userDoc.exists) {
      await userRef.update({
        gender: displayName,
      });
      console.log("User document already exists");
      return res.status(200).json({
        message: "Gender updated successfully",
      });
    } else {
      // User does not exist – create
      await userRef.set({
        uid: uid,
        phoneNumber: phoneNumber,
        displayName: null,
        gender: displayName,
        isSubscribed: false,
        subscriptionType: "Free",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      //create userProgresscollection
      await db
        .collection("userProgress")
        .doc(uid)
        .set({
          browseAll: { lastCreatedAt: null, lastId: null },
          recommended: { lastScore: null, lastId: null },
          latestUpdated: { lastUpdatedAt: null, lastId: null },
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      //create maleProfile/femaleProfile collection
      const normalizedGender = displayName.toLowerCase();
      const collectionName =
        normalizedGender === "male" ? "maleProfiles" : "femaleProfiles";
      await db.collection(collectionName).doc(uid).set({
        uid,
        gender: normalizedGender,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    }

    const userData = await userRef.get();
    const userDocData = userData.data();

    return res.status(201).json({
      message: "User document created successfully",
      user: userDocData,
    });
  } catch (error) {
    console.error("Create User Error:", error);
    return res
      .status(500)
      .json({ message: "Failed to create user", error: error.message });
  }
};

const updateUserDoc = async (req, res) => {
  try {
    const { uid } = req.user; // from authToken middleware
    const { gender } = req.body;

    if (!uid) {
      return res.status(400).json({ message: "User credential not found" });
    }
    if (!gender) {
      return res.status(400).json({ message: "Gender data required" });
    }
    // Check if user document already exists
    const userDoc = await db.collection("users").doc(uid).get();
    // console.log("userDoc", userDoc);
    if (!userDoc.exists) {
      return res.status(404).json({ message: "User not found" });
    }
    // Update user document
    await db.collection("users").doc(uid).update({ gender });

    return res
      .status(200)
      .json({ message: "User document updated successfully" });
  } catch (error) {
    console.error("Update User Error:", error);
    return res
      .status(500)
      .json({ message: "Failed to update user", error: error.message });
  }
};

const getUserByUid = async (req, res) => {
  try {
    const { uid } = req.params;

    if (!uid) {
      return res.status(400).json({ message: "UID is required." });
    }

    const userDoc = await db.collection("users").doc(uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({ message: "User not found." });
    }

    const userData = userDoc.data(); // ✅ full user document

    return res.status(200).json(userData);
  } catch (error) {
    console.error("Get User Error:", error);
    return res
      .status(500)
      .json({ message: "Failed to fetch user", error: error.message });
  }
};

const updateOrCreateSettings = async (req, res) => {
  try {
    const { uid } = req.user; // from authToken middleware
    const settingsData = req.body;

    if (!uid) {
      return res.status(400).json({ message: "UID is missing" });
    }

    const settingsRef = db.collection("settings").doc(uid);
    const doc = await settingsRef.get();

    if (doc.exists) {
      // Update existing
      await settingsRef.update(settingsData);
    } else {
      // Create new
      await settingsRef.set({
        uid,
        notificationsEnabled: true,
        profileVisibility: "Public",
        allowMessagesFrom: "Everyone",
        theme: "Light",
        ...settingsData,
      });
    }

    return res.status(200).json({ message: "Settings saved successfully" });
  } catch (error) {
    console.error("Settings Error:", error);
    return res
      .status(500)
      .json({ message: "Settings update failed", error: error.message });
  }
};

const getSettings = async (req, res) => {
  try {
    const { uid } = req.user; // from authToken middleware

    if (!uid) {
      return res.status(400).json({ message: "UID is missing" });
    }

    const settingsRef = db.collection("settings").doc(uid);
    const doc = await settingsRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: "Settings not found" });
    }

    return res.status(200).json({ settings: doc.data() });
  } catch (error) {
    console.error("Get Settings Error:", error);
    return res
      .status(500)
      .json({ message: "Fetching settings failed", error: error.message });
  }
};

module.exports = {
  createUserDoc,
  updateUserDoc,
  getUserByUid,
  updateOrCreateSettings,
  getSettings,
};

// userData : {
//   uid: 'kaIBLncIbpZclN7oqD3rHBBFEjK2',
//   phoneNumber: '+919766757697',
//   displayName: null,
//   gender: null,
//   isSubscribed: false,
//   subscriptionType: 'Free',
//   createdAt: Timestamp { _seconds: 1746380431, _nanoseconds: 857000000 }
// }
