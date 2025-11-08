const jwt = require('jsonwebtoken');

exports.signOTPToken = (payload) => {
  try {
    console.log("JWT Helper - Signing token with payload:", payload);
    console.log("JWT Helper - JWT_SECRET exists:", !!process.env.JWT_SECRET);
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '180d' });
    console.log("JWT Helper - Token generated successfully");
    return token;
  } catch (error) {
    console.log("JWT Helper - Error generating token:", error.message);
    throw error;
  }
};

exports.verifyOTPToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};
