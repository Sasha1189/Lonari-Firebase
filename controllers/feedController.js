const { db } = require("../firebaseAdmin");
const { Timestamp } = require("firebase-admin/firestore");

// 🔹 Common filter builder (reusable)

const applyFilters = (
  query,
  { livesin, maritalStatus, income, minAge, maxAge }
) => {
  if (livesin) query = query.where("livesin", "==", livesin);
  if (maritalStatus) query = query.where("maritalStatus", "==", maritalStatus);
  if (income) query = query.where("income", "==", income);

  // Age filtering using dob
  const today = new Date();
  const year = today.getFullYear();

  if (minAge) {
    const parsed = Number(minAge);
    if (!isNaN(parsed)) {
      const maxDob = new Date(year - parsed, today.getMonth(), today.getDate());
      console.log("minAge filter: dob <=", maxDob);
      query = query.where("dob", "<=", Timestamp.fromDate(maxDob));
    }
  }

  if (maxAge) {
    const parsed = Number(maxAge);
    if (!isNaN(parsed)) {
      const minDob = new Date(
        year - parsed - 1,
        today.getMonth(),
        today.getDate()
      );
      console.log("maxAge filter: dob >=", minDob);
      query = query.where("dob", ">=", Timestamp.fromDate(minDob));
    }
  }

  return query;
};

const queryBrowseAllProfiles = async (req, res) => {
  console.log("controller hit queryBrowseAllProfiles");
  const queryParams = req.query.params
    ? JSON.parse(req.query.params)
    : req.query;
  console.log(queryParams);

  const {
    gender,
    uid,
    livesin,
    maritalStatus,
    minAge,
    maxAge,
    income,
    limit,
    reset,
  } = queryParams;

  const userId = uid;

  try {
    console.log("User ID:", userId, gender);
    if (!gender) return res.status(400).json({ message: "Gender is required" });
    // console.log("gender provided:", gender);

    const oppositeGender = gender.toLowerCase() === "male" ? "female" : "male";
    // console.log("Opposite gender:", oppositeGender);
    let query = db.collection(`${oppositeGender}Profiles`);
    // .where("visibility", "==", true);
    // console.log("Initial query:", query);
    query = applyFilters(query, {
      livesin,
      maritalStatus,
      income,
      minAge,
      maxAge,
    });

    query = query
      .orderBy("createdAt", "asc")
      .orderBy("__name__", "asc")
      .limit(Number(limit));

    // const progressRef = db.collection("userProgress").doc(userId);

    // // ✅ Reset progress when asked
    // if (reset === "true") {
    //   await progressRef.set(
    //     { browseAll: null, updatedAt: Timestamp.now() },
    //     { merge: true }
    //   );
    // }

    // const progressSnap = await progressRef.get();
    // console.log("Progress snap:", progressSnap.exists, progressSnap.data());
    // if (progressSnap.exists && progressSnap.data()?.browseAll?.lastCreatedAt) {
    //   const { lastCreatedAt, lastId } = progressSnap.data().browseAll;
    //   query = query.startAfter(new Date(lastCreatedAt), lastId);
    // }

    const snapshot = await query.get();

    if (snapshot.empty) {
      console.log("No more profiles for user:", userId);
      return res.status(200).json({ profiles: [], done: true });
    }

    const profiles = [];
    // let lastCursor = null;
    snapshot.forEach((doc) => {
      const data = doc.data();
      profiles.push({ id: doc.id, ...data });
      // lastCursor = {
      //   lastCreatedAt: data.createdAt?.toDate?.() || null,
      //   lastId: doc.id,
      // };
    });
    console.log("Profiles:", profiles);

    // if (lastCursor) {
    //   await progressRef.set(
    //     { browseAll: lastCursor, updatedAt: Timestamp.now() },
    //     { merge: true }
    //   );
    // }

    const done = profiles.length < Number(limit);
    return res.status(200).json({ profiles, done });
  } catch (e) {
    return res
      .status(500)
      .json({ message: "Error fetching profiles", error: e.message });
  }
};

const queryRecommendedProfiles = async (req, res) => {
  const {
    gender,
    livesin,
    maritalStatus,
    minAge,
    maxAge,
    income,
    limit = 10,
  } = req.query;
  const userId = req.user?.uid;

  try {
    const oppositeGender = gender.toLowerCase() === "male" ? "female" : "male";
    let query = db
      .collection(`${oppositeGender}Profiles`)
      .where("visibility", "==", true);

    query = applyFilters(query, {
      livesin,
      maritalStatus,
      income,
      minAge,
      maxAge,
    });

    query = query
      .orderBy("score", "desc")
      .orderBy("__name__", "asc")
      .limit(Number(limit));

    const progressRef = db.collection("userProgress").doc(userId);
    const progressSnap = await progressRef.get();
    if (progressSnap.exists && progressSnap.data()?.recommended?.lastScore) {
      const { lastScore, lastId } = progressSnap.data().recommended;
      query = query.startAfter(lastScore, lastId);
    }

    const snapshot = await query.get();
    const profiles = [];
    let lastCursor = null;

    snapshot.forEach((doc) => {
      const data = doc.data();
      profiles.push({ id: doc.id, ...data });
      lastCursor = { lastScore: data.score || 0, lastId: doc.id };
    });

    if (lastCursor) {
      await progressRef.set(
        { recommended: lastCursor, updatedAt: Timestamp.now() },
        { merge: true }
      );
    }

    const done = profiles.length < Number(limit);
    return res.status(200).json({ profiles, lastCursor, done });
  } catch (e) {
    return res.status(500).json({
      message: "Error fetching recommended profiles",
      error: e.message,
    });
  }
};

const queryLatestUpdatedProfiles = async (req, res) => {
  const {
    gender,
    livesin,
    maritalStatus,
    minAge,
    maxAge,
    income,
    limit = 10,
  } = req.query;
  const userId = req.user?.uid;

  try {
    const oppositeGender = gender.toLowerCase() === "male" ? "female" : "male";
    let query = db
      .collection(`${oppositeGender}Profiles`)
      .where("visibility", "==", true);

    query = applyFilters(query, {
      livesin,
      maritalStatus,
      income,
      minAge,
      maxAge,
    });

    query = query
      .orderBy("updatedAt", "desc")
      .orderBy("__name__", "asc")
      .limit(Number(limit));

    const progressRef = db.collection("userProgress").doc(userId);
    const progressSnap = await progressRef.get();
    if (
      progressSnap.exists &&
      progressSnap.data()?.latestUpdated?.lastUpdatedAt
    ) {
      const { lastUpdatedAt, lastId } = progressSnap.data().latestUpdated;
      query = query.startAfter(new Date(lastUpdatedAt), lastId);
    }

    const snapshot = await query.get();
    const profiles = [];
    let lastCursor = null;

    snapshot.forEach((doc) => {
      const data = doc.data();
      profiles.push({ id: doc.id, ...data });
      lastCursor = {
        lastUpdatedAt: data.updatedAt?.toDate?.() || null,
        lastId: doc.id,
      };
    });

    if (lastCursor) {
      await progressRef.set(
        { latestUpdated: lastCursor, updatedAt: Timestamp.now() },
        { merge: true }
      );
    }

    const done = profiles.length < Number(limit);
    return res.status(200).json({ profiles, lastCursor, done });
  } catch (e) {
    return res
      .status(500)
      .json({ message: "Error fetching latest profiles", error: e.message });
  }
};

module.exports = {
  queryBrowseAllProfiles,
  queryRecommendedProfiles,
  queryLatestUpdatedProfiles,
};
