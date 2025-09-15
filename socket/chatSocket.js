// const { admin, db } = require("../firebaseAdmin");

// module.exports = (io) => {
//   io.on("connection", (socket) => {
//     console.log("User connected:", socket.id);

//     const currentUserId = socket.handshake.auth?.userId;
//     if (!currentUserId) {
//       console.warn("Missing userId in auth handshake");
//       return socket.disconnect(true);
//     }

//     // Join room and send initial chat history
//     socket.on("joinRoom", async (otherUserId) => {
//       const roomId = [currentUserId, otherUserId].sort().join("_");
//       socket.join(roomId);

//       try {
//         const snapshot = await db
//           .collection("messages")
//           .where("roomId", "==", roomId)
//           .orderBy("createdAt", "desc")
//           .limit(20)
//           .get();

//         const messages = snapshot.docs.map((doc) => ({
//           _id: doc.id,
//           ...doc.data(),
//         }));

//         socket.emit("chatHistory", messages.reverse());
//       } catch (err) {
//         console.error("Error fetching chatHistory:", err.message);
//       }
//     });

//     // New message
//     socket.on("chatMessage", async ({ otherUserId, text }) => {
//       if (!text?.trim() || !otherUserId) return;

//       const roomId = [currentUserId, otherUserId].sort().join("_");

//       const newMessage = {
//         senderId: currentUserId,
//         receiverId: otherUserId,
//         text: text.trim(),
//         roomId,
//         createdAt: new Date(),
//       };

//       try {
//         const docRef = await db.collection("messages").add(newMessage);
//         const savedMsg = { _id: docRef.id, ...newMessage };
//         io.to(roomId).emit("chatMessage", savedMsg);
//       } catch (err) {
//         console.error("Error sending chatMessage:", err.message);
//       }
//     });

//     // Load older messages
//     socket.on(
//       "fetchOldMessages",
//       async ({ otherUserId, skip = 0, limit = 20 }) => {
//         const roomId = [currentUserId, otherUserId].sort().join("_");

//         try {
//           const snapshot = await db
//             .collection("messages")
//             .where("roomId", "==", roomId)
//             .orderBy("createdAt", "desc")
//             .offset(skip)
//             .limit(limit)
//             .get();

//           const olderMessages = snapshot.docs.map((doc) => ({
//             _id: doc.id,
//             ...doc.data(),
//           }));

//           socket.emit("oldMessages", olderMessages.reverse());
//         } catch (err) {
//           console.error("Error fetching oldMessages:", err.message);
//         }
//       }
//     );

//     socket.on("disconnect", () => {
//       console.log("User disconnected:", socket.id);
//     });
//   });
// };

const { admin, db } = require("../firebaseAdmin");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    const currentUserId = socket.handshake.auth?.userId;
    if (!currentUserId) {
      console.warn("Missing userId in auth handshake");
      return socket.disconnect(true);
    }

    // Join room + initial history
    socket.on("joinRoom", async (otherUserId) => {
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

    // Send new message
    socket.on("chatMessage", async ({ otherUserId, text }) => {
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

        // Update chat metadata
        await db
          .collection("chats")
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
            { merge: true }
          );

        io.to(roomId).emit("chatMessage", savedMsg);
      } catch (err) {
        socket.emit("error", { type: "chatMessage", message: err.message });
      }
    });

    // load older messages
    socket.on(
      "fetchOldMessages",
      async ({ otherUserId, cursor, limit = 20 }) => {
        const roomId = [currentUserId, otherUserId].sort().join("_");

        try {
          let query = db
            .collection("messages")
            .where("roomId", "==", roomId)
            .orderBy("createdAt", "desc")
            .limit(limit);

          if (cursor) {
            // 👇 Use the timestamp + id of the last loaded doc
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
          console.error("Error fetching oldMessages:", err.message);
        }
      }
    );

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};
