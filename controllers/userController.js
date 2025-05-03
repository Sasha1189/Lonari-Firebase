const { admin } = require("../firebase");
const { db } = require("../firebase");

const verifyToken = async (token) => {
  try {
    await admin.auth().verifyIdToken(token);
  } catch (err) {
    console.error("Token verification failed:", err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
// Create User Doc
const createUserDoc = async (req, res) => {
  console.log("req received create user doc");
  try {
    const { uid, phoneNumber, newGender } = req.body;
    // Verify the token
    // await verifyToken(token);
     console.log("m", newGender);

    if (!uid || !phoneNumber || !newGender) {
      return res
        .status(400)
        .json({ message: "User credentials are required." });
    }
    console.log("m2", newGender);
    

    try {
      const userRef = db.collection("users").doc(uid);
      const userDoc = await userRef.get();

      if (userDoc.exists) {
        await userRef.update({
      gender: newGender
    })
        return res.status(200).json({
          message:"Gender updated successfully"
        });
      }

      // User does not exist – create
      await userRef.set({
        uid: uid,
        phoneNumber: phoneNumber,
        gender: newGender || null,
        isSubscribed: false,
        subscriptionType: "Free",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      const userData = await userRef.get();
     

      return res.status(201).json({
        message: "User document created successfully",
        userData,
      });
    } catch (error) {
      console.error("Error creating user:", error);
      return res
        .status(500)
        .json({ message: "Failed to create or fetch user." });
    }
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
    const gender = req.body;

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
    const userData = await db.collection("users").doc(uid).update({ gender });
    console.log("UserData", userData);

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
    console.log("userData :", userData);
    return res.status(200).json(userData);
  } catch (error) {
    console.error("Get User Error:", error);
    return res.status(500).json({ message: "Failed to fetch user", error: error.message });
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
