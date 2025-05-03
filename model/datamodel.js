// users/ (main minimal collection)
//     {uid}
//         - uid
//         - phoneNumber
//         - gender
//         - subscriptionStatus (Free/Premium)

// maleProfiles/ (separate detailed profile collection)
//     {uid}
//         - name
//         - age
//         - city
//         - education
//         - work
//         - likesCount
//         - imageUrls: [img1, img2, img3, img4]
//         - aboutMe
//         - hobbies
//         - income
//         - hometown
//         - familyDetails
//         - partnerExpectations

// femaleProfiles/ (separate detailed profile collection)
//     {uid}
//         - name
//         - age
//         - city
//         - education
//         - work
//         - likesCount
//         - imageUrls: [img1, img2, img3, img4]
//         - aboutMe
//         - hobbies
//         - income
//         - hometown
//         - familyDetails
//         - partnerExpectations

// messages/ (flat common collection)
//     {messageId}
//         - senderId
//         - receiverId
//         - text
//         - timestamp

// settings/ (optional for user preferences)
//     {uid}
//         - darkMode: true
//         - notificationEnabled: false
//         - language: "English"

// Security rules

// service cloud.firestore {
//   match /databases/{database}/documents {

//     match /maleProfiles/{userId} {
//       allow read: if request.auth != null && getUserGender(request.auth.uid) == 'Female';
//       allow write: if false; // no direct writes
//     }

//     match /femaleProfiles/{userId} {
//       allow read: if request.auth != null && getUserGender(request.auth.uid) == 'Male';
//       allow write: if false;
//     }

//     // A custom function you define elsewhere in rules
//     function getUserGender(uid) {
//       return get(/databases/$(database)/documents/users/$(uid)).data.gender;
//     }
//   }
// }

// pagination
//     - Use Firestore's built-in pagination with startAt and limit methods.
//     - For example, to get the first 10 profiles, you can use: db.collection('maleProfiles').limit(10).get()
//     - For the next 10, use startAfter(lastVisibleProfile) and limit(10).
//     - This will help in efficiently loading profiles without overwhelming the client or server.
//     - Use cursors for pagination to avoid loading all data at once.
// This is especially important for mobile devices with limited resources.

// import {
//   collection,
//   query,
//   where,
//   orderBy,
//   limit,
//   startAfter,
//   getDocs,
// } from "firebase/firestore";
// import { db } from "./firebase"; // your firebase setup

// async function fetchNextProfiles(
//   lastVisibleDoc = null,
//   pageSize = 10,
//   gender = "Female"
// ) {
//   const profilesCollection =
//     gender === "Male" ? "maleProfiles" : "femaleProfiles";

//   let q = query(
//     collection(db, profilesCollection),
//     orderBy("createdAt", "desc"),
//     limit(pageSize)
//   );

//   if (lastVisibleDoc) {
//     q = query(
//       collection(db, profilesCollection),
//       orderBy("createdAt", "desc"),
//       startAfter(lastVisibleDoc),
//       limit(pageSize)
//     );
//   }

//   const querySnapshot = await getDocs(q);

//   const profiles = querySnapshot.docs.map((doc) => ({
//     id: doc.id,
//     ...doc.data(),
//   }));

//   const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];

//   return { profiles, lastVisible };
// }

// let lastVisible = null;

// // First 10 profiles
// const { profiles, lastVisible: newLast } = await fetchNextProfiles(
//   null,
//   10,
//   "Female"
// );
// lastVisible = newLast;

// // Fetch next 10 profiles when user swipes
// const { profiles: nextProfiles, lastVisible: nextLast } =
//   await fetchNextProfiles(lastVisible, 10, "Female");
// lastVisible = nextLast;
