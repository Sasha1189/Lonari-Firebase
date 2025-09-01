const { db } = require("../firebaseAdmin"); // import db and admin SDK

// Update Mobile Number Controller
const updateMobileNumber = async (req, res) => {
  try {
    const { uid } = req.user;
    const { mobile } = req.body;

    if (!mobile) {
      return res.status(400).json({ message: "Mobile number is required" });
    }

    // Update the mobile field in Firestore
    await db.collection("users").doc(uid).update({
      mobile,
    });

    return res
      .status(200)
      .json({ message: "Mobile number updated successfully" });
  } catch (error) {
    console.error("Update Mobile Error:", error);
    return res
      .status(500)
      .json({ message: "Update mobile failed", error: error.message });
  }
};

module.exports = {
  updateMobileNumber, // <- export this
};
