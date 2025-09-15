const { db, FieldValue, Timestamp } = require("../firebaseAdmin");

// toggle-like for like/unlike on feed screen
const toggleLike = async (req, res) => {
  console.log("Toggling like controller hit");
  const { profileId, uid } = req.body;
  console.log("profileId:", profileId, "uid:", uid);

  if (!profileId || !uid) {
    return res.status(400).json({ message: "profileId and uid are required" });
  }

  try {
    await db.runTransaction(async (t) => {
      const profileRef = db.collection("profiles").doc(profileId);
      const profileSnap = await t.get(profileRef);
      if (!profileSnap.exists) throw new Error("Profile not found");

      const likeRef = db.collection("likes").doc(`${uid}_${profileId}`);
      const likeSnap = await t.get(likeRef);

      if (likeSnap.exists) {
        // ✅ Unlike case
        t.delete(likeRef);
        t.update(profileRef, { likeCount: FieldValue.increment(-1) });

        // (optional: also decrement user's sentLikesCount here)
      } else {
        // ✅ Like case
        t.set(likeRef, {
          from: uid,
          to: profileId,
          createdAt: Timestamp.now(),
        });
        t.update(profileRef, { likeCount: FieldValue.increment(1) });

        // (optional: also increment user's sentLikesCount here)
      }
    });

    console.log("Like toggled successfully");

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// likesSentIDS for getting IDs of profiles the user has liked (used in feed to mark liked profiles)
const likesSentIds = async (req, res) => {
  console.log("Likes sent controller hit");
  try {
    const uid = req.user.uid;
    if (!uid) {
      return res.status(400).json({ message: "uid is required" });
    }
    const snapshot = await db
      .collection("likes")
      .where("fromUid", "==", uid)
      .get();

    const likedIds = snapshot.docs.map((doc) => doc.data().toUid);
    res.json({ likedIds });
  } catch (e) {
    res
      .status(500)
      .json({ message: "Failed to fetch likes", error: e.message });
  }
};

// likesReceivedIDS for getting IDs of users who have liked the current user (used in likes screen)
//currently not used but can be useful for future features
const likesReceivedIds = async (req, res) => {
  console.log("Likes received controller hit");
  try {
    const uid = req.user.uid;

    if (!uid) {
      return res
        .status(400)
        .json({ message: "uid is required for like received" });
    }

    const snapshot = await db
      .collection("likes")
      .where("toUid", "==", uid)
      .get();

    const receivedIds = snapshot.docs.map((doc) => doc.data().fromUid);
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
export const likesSentProfiles = async (req, res) => {
  try {
    const uid = req.user.uid;
    if (!uid) {
      return res.status(400).json({ message: "uid is required" });
    }

    const snapshot = await db
      .collection("likes")
      .where("fromUid", "==", uid)
      .orderBy("createdAt", "desc")
      .get();

    const results = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();
        const profileSnap = await db
          .collection("profiles")
          .doc(data.toUid)
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

// likesReceived (hydrated)
export const likesReceivedProfiles = async (req, res) => {
  try {
    const uid = req.user.uid;
    if (!uid) {
      return res.status(400).json({ message: "uid is required" });
    }

    const snapshot = await db
      .collection("likes")
      .where("toUid", "==", uid)
      .orderBy("createdAt", "desc")
      .get();

    const results = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();
        const profileSnap = await db
          .collection("profiles")
          .doc(data.fromUid)
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
