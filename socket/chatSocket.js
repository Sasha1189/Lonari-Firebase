const { admin, db } = require("../firebaseAdmin");

module.exports = (io) => {
  io.on("connection", (socket) => {
    const currentUserId = socket.handshake.auth?.userId;
    if (!currentUserId) {
      console.warn("❌ Missing userId in auth handshake");
      return socket.disconnect(true);
    }

    // ////////////////////////////////////////////////////
    // 🔹 ChatRoomScreen (one-to-one conversation view)
    // ////////////////////////////////////////////////////

    // 1. Join room and load latest messages
    socket.on("joinRoom", async ({ otherUserId }) => {
      if (!otherUserId) return;

      const roomId = [currentUserId, otherUserId].sort().join("_");
      socket.join(roomId);

      try {
        const snapshot = await db
          .collection("messages")
          .where("roomId", "==", roomId)
          .orderBy("createdAt", "desc")
          .limit(20)
          .get();

        const messages = snapshot.docs.map((doc) => ({
          _id: doc.id,
          ...doc.data(),
        }));

        socket.emit("chatHistory", messages.reverse());
      } catch (err) {
        socket.emit("error", { type: "chatHistory", message: err.message });
      }
    });

    // 2. Send a new message
    socket.on("sendMessage", async ({ otherUserId, text }) => {
      if (!text?.trim() || !otherUserId) return;

      const roomId = [currentUserId, otherUserId].sort().join("_");

      const newMessage = {
        senderId: currentUserId,
        receiverId: otherUserId,
        text: text.trim(),
        roomId,
        createdAt: admin.firestore.Timestamp.now(),
        status: "sent",
      };

      try {
        const docRef = await db.collection("messages").add(newMessage);
        const savedMsg = { _id: docRef.id, ...newMessage };

        // update room metadata
        await db
          .collection("rooms")
          .doc(roomId)
          .set(
            {
              participants: [currentUserId, otherUserId],
              lastMessage: newMessage.text,
              lastMessageAt: newMessage.createdAt,
              unreadCounts: {
                [otherUserId]: admin.firestore.FieldValue.increment(1),
              },
            },
            { merge: true },
          );

        io.to(roomId).emit("chatMessage", savedMsg);
      } catch (err) {
        socket.emit("error", { type: "sendMessage", message: err.message });
      }
    });

    // 3. Load older messages (pagination)
    socket.on(
      "fetchOldMessages",
      async ({ otherUserId, cursor, limit = 20 }) => {
        if (!otherUserId) return;

        const roomId = [currentUserId, otherUserId].sort().join("_");

        try {
          let query = db
            .collection("messages")
            .where("roomId", "==", roomId)
            .orderBy("createdAt", "desc")
            .limit(limit);

          if (cursor) {
            const cursorDoc = await db.collection("messages").doc(cursor).get();
            if (cursorDoc.exists) {
              query = query.startAfter(cursorDoc);
            }
          }

          const snapshot = await query.get();

          const olderMessages = snapshot.docs.map((doc) => ({
            _id: doc.id,
            ...doc.data(),
          }));

          socket.emit("oldMessages", {
            messages: olderMessages.reverse(),
            nextCursor:
              snapshot.docs.length > 0
                ? snapshot.docs[snapshot.docs.length - 1].id
                : null,
          });
        } catch (err) {
          console.error("❌ Error fetching oldMessages:", err.message);
          socket.emit("error", { type: "oldMessages", message: err.message });
        }
      },
    );

    // ////////////////////////////////////////////////////
    // 🔹 RecentPartnerMessagesScreen (list of chatrooms)
    // ////////////////////////////////////////////////////

    socket.on("fetchRecentChatPartners", async () => {
      try {
        // fetch current user profile
        const userDoc = await db.collection("users").doc(currentUserId).get();
        if (!userDoc.exists) throw new Error("User profile not found");

        const gender = userDoc.data().gender.toLowerCase();
        const targetCollection =
          gender === "male" ? "femaleProfiles" : "maleProfiles";

        const snapshot = await db
          .collection("rooms")
          .where("participants", "array-contains", currentUserId)
          .orderBy("lastMessageAt", "desc")
          .limit(20)
          .get();

        const partners = await Promise.all(
          snapshot.docs.map(async (doc) => {
            const room = doc.data();
            const roomId = doc.id;

            const otherUserId = room.participants.find(
              (id) => id !== currentUserId,
            );

            const profileSnap = await db
              .collection(targetCollection)
              .doc(otherUserId)
              .get();

            let otherUser = null;
            if (profileSnap.exists) {
              const { fullName, photos, dateOfBirth, uid } = profileSnap.data();

              const photo =
                Array.isArray(photos) && photos.length > 0
                  ? photos[0].downloadURL || null
                  : null;

              otherUser = {
                id: uid || otherUserId,
                name: fullName,
                photo, // ✅ single string
                dateOfBirth, // ✅ pass through, frontend calculates age
              };
            }

            return {
              roomId,
              lastMessage: room.lastMessage,
              lastMessageAt:
                room.lastMessageAt?.toDate?.() || room.lastMessageAt,
              otherUser,
              unreadCount: room.unreadCounts?.[currentUserId] || 0,
            };
          }),
        );

        // const validPartners = partners.filter((p) => p.otherUser !== null);
        socket.emit("recentChatPartners", partners);
      } catch (err) {
        console.error("❌ Error in fetchRecentChatPartners:", err.message);
        socket.emit("error", {
          type: "recentChatPartners",
          message: err.message,
        });
      }
    });

    // ////////////////////////////////////////////////////
    // Disconnect cleanup
    // ////////////////////////////////////////////////////
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};
