const { db } = require("../firebaseAdmin");
const { Timestamp } = require("firebase-admin/firestore");

//util
const isEmpty = (val) =>
  val === undefined ||
  val === null ||
  val === "" ||
  val === "null" ||
  val === "undefined";
// Update or Create Profile Controller
const updateOrCreateProfile = async (req, res) => {
  try {
    console.log("updateOrCreateProfile controller hit");

    // const parsed = parse(req.body);
    const { uid, gender, ...rest } = req.body;

    if (!uid || !gender) {
      return res.status(400).json({ message: "UID and Gender are required" });
    }

    const normalizedGender = gender.toLowerCase();
    const collectionName =
      normalizedGender === "male" ? "maleProfiles" : "femaleProfiles";
    const profileRef = db.collection(collectionName).doc(uid);

    const doc = await profileRef.get();

    if (!doc.exists) {
      const defaultProfileData = {
        uid,
        gender: normalizedGender,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      await profileRef.set(defaultProfileData);
    }

    // Only save what frontend sent
    const cleanedData = {
      ...rest,
      updatedAt: Timestamp.now(),
    };

    await profileRef.set(cleanedData, { merge: true });

    // Fetch updated document
    const updatedDoc = await profileRef.get();

    return res.status(200).json({
      status: doc.exists ? "success" : "created",
      message: "Profile updated successfully",
      profile: updatedDoc.data(),
    });
  } catch (error) {
    console.error("Validation or DB error:", error);
    return res.status(400).json({
      status: "failed",
      message: error.message,
    });
  }
};

//get Profile or create default profile if not exists
const getProfile = async (req, res) => {
  console.log("getProfile controller hitooooooo");
  try {
    const { uid, gender } = req.query;

    if (isEmpty(uid) || isEmpty(gender)) {
      return res.status(400).json({ message: "UID and Gender are required" });
    }
    console.log("creddddddddd", uid, gender);

    const normalizedGender = gender.toLowerCase();
    const collectionName =
      normalizedGender === "male" ? "maleProfiles" : "femaleProfiles";

    const profileRef = db.collection(collectionName).doc(uid);
    let doc = await profileRef.get();

    if (!doc.exists) {
      const defaultProfileData = {
        uid,
        gender: normalizedGender,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      await profileRef.set(defaultProfileData);
      doc = await profileRef.get(); // ✅ get fresh snapshot after set
      return res.status(200).json({
        status: "created",
        profile: doc.data(),
      });
    }

    return res.status(200).json({ status: "success", profile: doc.data() });
  } catch (error) {
    console.log("Get Profile Error:", error);
    return res
      .status(500)
      .json({ message: "Failed to fetch profile", error: error.message });
  }
};

//
const queryProfiles = async (req, res) => {
  console.log("queryProfile hit");
  try {
    const {
      gender,
      livesin,
      maritalStatus,
      minAge,
      maxAge,
      income,
      limit = 10,
      lastUpdatedAt,
    } = req.query;

    if (!gender) {
      return res.status(400).json({ message: "Gender is required" });
    }

    const oppositeGender = gender.toLowerCase() === "male" ? "female" : "male";
    let query = db
      .collection(`${oppositeGender}Profiles`)
      .where("visibility", "==", true);

    // Optional filters
    if (livesin) query = query.where("livesin", "==", livesin);
    if (maritalStatus)
      query = query.where("maritalStatus", "==", maritalStatus);
    if (income) query = query.where("income", "==", income);

    // Age filtering using dob
    const today = new Date();
    const year = today.getFullYear();
    if (minAge) {
      const maxDob = new Date(year - minAge, today.getMonth(), today.getDate());
      query = query.where("dob", "<=", Timestamp.fromDate(maxDob));
    }
    if (maxAge) {
      const minDob = new Date(
        year - maxAge - 1,
        today.getMonth(),
        today.getDate() + 1
      );
      query = query.where("dob", ">=", Timestamp.fromDate(minDob));
    }

    // Sorting and pagination
    query = query.orderBy("updatedAt", "desc").limit(Number(limit));
    if (lastUpdatedAt) {
      query = query.startAfter(new Date(lastUpdatedAt));
    }

    const snapshot = await query.get();
    const profiles = [];
    let lastVisibleUpdatedAt = null;

    snapshot.forEach((doc) => {
      const data = doc.data();
      profiles.push({ id: doc.id, ...data });
      lastVisibleUpdatedAt = data.updatedAt?.toDate?.() || null;
    });

    return res
      .status(200)
      .json({ status: "success", profiles, lastVisibleUpdatedAt });
  } catch (error) {
    console.error("queryProfiles error:", error);
    return res
      .status(500)
      .json({ message: "Error fetching profiles", error: error.message });
  }
};

//
const searchProfiles = async (req, res) => {
  try {
    const { gender, query } = req.query;

    if (!gender || !query) {
      return res.status(400).json({ message: "Gender and query are required" });
    }

    const normalizedGender = gender.toLowerCase();
    const oppositeGender = normalizedGender === "male" ? "female" : "male";
    const collectionName = `${oppositeGender}Profiles`;

    const snapshot = await db
      .collection(collectionName)
      .where("visibility", "==", true)
      .limit(100) // Limit to avoid loading entire DB
      .get();

    const q = query.toLowerCase();
    const profiles = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((profile) => {
        return (
          profile.fullname?.toLowerCase().includes(q) ||
          profile.education?.toLowerCase().includes(q) ||
          profile.livesin?.toLowerCase().includes(q) ||
          profile.hometown?.toLowerCase().includes(q)
        );
      });

    return res.status(200).json({ profiles });
  } catch (error) {
    console.error("searchProfiles error:", error);
    return res
      .status(500)
      .json({ message: "Search failed", error: error.message });
  }
};

module.exports = {
  updateOrCreateProfile,
  getProfile,
  queryProfiles,
  searchProfiles,
};
