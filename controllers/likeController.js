const { db, FieldValue, Timestamp } = require("../firebaseAdmin");

// toggle-like for like/unlike on feed screen
const toggleLike = async (req, res) => {
  // console.log("Toggling like controller hit");
  const { profileId } = req.body;
  // console.log("user:", req.user);
  const uid = req.user.uid;
  const gender = req.user.name.toLowerCase();

  // console.log("profileId:", profileId, "uid:", uid, "gender:", gender);

  if (!profileId || !uid) {
    return res.status(400).json({ message: "profileId and uid are required" });
  }

  // decide target gender collection
  const targetCollection =
    gender === "male" ? "femaleProfiles" : "maleProfiles";

  try {
    await db.runTransaction(async (t) => {
      console.log("Transaction started", targetCollection);
      const profileRef = db.collection(targetCollection).doc(profileId);
      const profileSnap = await t.get(profileRef);

      if (!profileSnap.exists) {
        // console.error("Profile not found:", profileId);
        throw new Error("Profile not found");
      }

      const likeRef = db.collection("likes").doc(`${uid}_${profileId}`);
      // console.log("likeRef:", likeRef.id);
      const likeSnap = await t.get(likeRef);

      if (likeSnap.exists) {
        // ✅ Unlike case
        // console.log("Unliking:", likeRef.id);
        t.delete(likeRef);
        t.update(profileRef, { likeCount: FieldValue.increment(-1) });

        // (optional: also decrement user's sentLikesCount here)
      } else {
        // ✅ Like case
        // console.log("Liking:", likeRef.id);
        t.set(likeRef, {
          from: uid,
          to: profileId,
          createdAt: Timestamp.now(),
        });
        t.update(profileRef, { likeCount: FieldValue.increment(1) });

        // (optional: also increment user's sentLikesCount here)
      }
    });

    // console.log("Like toggled successfully");

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("ToggleLike error:", err);
    res.status(500).json({ error: err.message });
  }
};

// likesSentIDS for getting IDs of profiles the user has liked (used in feed to mark liked profiles)
const likesSentIds = async (req, res) => {
  // console.log("Likes sent controller hit");
  try {
    const uid = req.user.uid;
    if (!uid) {
      return res.status(400).json({ message: "uid is required" });
    }
    const snapshot = await db
      .collection("likes")
      .where("from", "==", uid)
      .get();

    // console.log("✅ Likes found count:", snapshot.size);

    const likedIds = snapshot.docs.map((doc) => doc.data().to);
    // console.log("✅ likedIds returned:", likedIds);

    res.json({ likedIds });
  } catch (e) {
    console.error("❌ Error in likesSentIds:", e);
    res
      .status(500)
      .json({ message: "Failed to fetch likes", error: e.message });
  }
};

// likesReceivedIDS for getting IDs of users who have liked the current user (used in likes screen)
//currently not used but can be useful for future features
const likesReceivedIds = async (req, res) => {
  // console.log("Likes received controller hit");
  try {
    const uid = req.user.uid;

    if (!uid) {
      return res
        .status(400)
        .json({ message: "uid is required for like received" });
    }

    const snapshot = await db.collection("likes").where("to", "==", uid).get();

    const receivedIds = snapshot.docs.map((doc) => doc.data().from);
    res.json({ receivedIds });
  } catch (e) {
    res
      .status(500)
      .json({ message: "Failed to fetch likes", error: e.message });
  }
};

/////////////////////////////////////////////////////////
//For message screen list of profiles of likesents and likesreceived
// likesSent (hydrated)
const likesSentProfiles = async (req, res) => {
  console.log("likesentprofile controller hit");
  try {
    const uid = req.user.uid;
    const gender = req.user.name.toLowerCase();

    // decide target gender collection
    const targetCollection =
      gender === "male" ? "femaleProfiles" : "maleProfiles";

    if (!uid) {
      return res.status(400).json({ message: "uid is required" });
    }

    const snapshot = await db
      .collection("likes")
      .where("from", "==", uid)
      .orderBy("createdAt", "desc")
      .get();

    // console.log("✅ Likes found count:", snapshot.size);

    const results = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();
        const profileSnap = await db
          .collection(targetCollection)
          .doc(data.to)
          .get();

        return {
          id: doc.id,
          ...data,
          profile: profileSnap.exists ? profileSnap.data() : null,
        };
      })
    );

    // console.log("✅ likesSentProfiles returned:", results);

    res.json(results);
  } catch (e) {
    console.error("❌ likesSentProfiles error:", e);
    res
      .status(500)
      .json({ message: "Failed to fetch likes", error: e.message });
  }
};

// likesReceived (hydrated)
const likesReceivedProfiles = async (req, res) => {
  console.log("likereceivedprofile controller hit");
  try {
    const uid = req.user.uid;
    const gender = req.user.name.toLowerCase();

    // decide target gender collection
    const targetCollection =
      gender === "male" ? "femaleProfiles" : "maleProfiles";

    if (!uid) {
      return res.status(400).json({ message: "uid is required" });
    }

    const snapshot = await db
      .collection("likes")
      .where("to", "==", uid)
      .orderBy("createdAt", "desc")
      .get();

    const results = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();
        const profileSnap = await db
          .collection(targetCollection)
          .doc(data.from)
          .get();

        return {
          id: doc.id,
          ...data,
          profile: profileSnap.exists ? profileSnap.data() : null,
        };
      })
    );

    res.json(results);
  } catch (e) {
    res
      .status(500)
      .json({ message: "Failed to fetch likes", error: e.message });
  }
};

module.exports = {
  toggleLike,
  likesSentIds,
  likesReceivedIds,
  likesSentProfiles,
  likesReceivedProfiles,
};
