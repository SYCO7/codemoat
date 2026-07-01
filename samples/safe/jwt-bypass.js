const jwt = require("jsonwebtoken");

function verifySession(token) {
  return jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
}
