const jwt = require("jsonwebtoken");

function verifySession(token) {
  return jwt.verify(token, null, { algorithms: ["none"] });
}
