const { db } = require("../firebase");
const { Timestamp } = require("firebase-admin/firestore"); // important for timestamp
// Update or Create Profile Controller

const updateOrCreateProfile = async (req, res) => {
  try {
    const { uid, gender, ...profileData } = req.body;

    if (!uid || !gender) {
      return res.status(400).json({ message: "UID and Gender are required" });
    }

    const collectionName =
      gender === "Male" ? "maleProfiles" : "femaleProfiles";
    const profileRef = db.collection(collectionName).doc(uid);
    const doc = await profileRef.get();

    const defaultProfile = {
      uid,
      fullname: "Not Specified",
      aboutme: "Not Specified",
      education: "Not Specified",
      work: "Not Specified",
      height: "Not Specified",
      hobbies: ["Not Specified"],
      income: "Not Specified",
      livesin: "Not Specified",
      hometown: "Not Specified",
      likescount: 0,
      maritalStatus: "Single",
      familyDetails: "Not Specified",
      partnerExpectations: "Not Specified",
      imageUrls: [],
      createdAt: Timestamp.now(), // setting on create
      updatedAt: Timestamp.now(), // setting on create
    };

    const dataToSave = doc.exists
      ? { ...profileData, updatedAt: Timestamp.now() } // on update
      : { ...defaultProfile, ...profileData }; // on create

    await profileRef.set(dataToSave, { merge: true });

    return res
      .status(200)
      .json({ message: "Profile updated or created successfully" });
  } catch (error) {
    console.error("Profile Update Error:", error);
    return res
      .status(500)
      .json({ message: "Profile update failed", error: error.message });
  }
};

const updateProfileImages = async (req, res) => {
  try {
    const { uid, gender, imageUrls } = req.body;

    if (!uid || !gender || !Array.isArray(imageUrls)) {
      return res
        .status(400)
        .json({ message: "UID, Gender, and imageUrls array are required" });
    }

    const collectionName =
      gender === "Male" ? "maleProfiles" : "femaleProfiles";
    const profileRef = db.collection(collectionName).doc(uid);

    const doc = await profileRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: "Profile not found" });
    }

    await profileRef.set(
      {
        imageUrls,
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    );

    return res
      .status(200)
      .json({ message: "Profile images updated successfully" });
  } catch (error) {
    console.error("Update Profile Images Error:", error);
    return res.status(500).json({
      message: "Failed to update profile images",
      error: error.message,
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const { uid, gender } = req.body;

    if (!uid || !gender) {
      return res.status(400).json({ message: "UID and Gender are required" });
    }

    const collectionName =
      gender === "Male" ? "maleProfiles" : "femaleProfiles";
    const profileRef = db.collection(collectionName).doc(uid);
    const doc = await profileRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: "Profile not found" });
    }

    return res.status(200).json({ profile: doc.data() });
  } catch (error) {
    console.error("Get Profile Error:", error);
    return res
      .status(500)
      .json({ message: "Failed to fetch profile", error: error.message });
  }
};

module.exports = {
  updateOrCreateProfile,
  updateProfileImages,
  getProfile,
};
