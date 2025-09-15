const { admin } = require("../firebaseAdmin");

const authToken = async (req, res, next) => {
  const token = req.headers.authorization?.split("Bearer ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });
  console.log("middleware hit");

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    ////////////////////////////
    // const user = await admin.auth().getUser(decoded.uid);
    // req.user = {
    //   uid: decoded.uid,
    //   gender: user.displayName?.toLowerCase(), // "male" or "female"
    // };
    next();
  } catch (err) {
    console.error("Token verification failed:", err);
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

module.exports = authToken;
