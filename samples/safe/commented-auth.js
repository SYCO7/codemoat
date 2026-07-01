const express = require("express");
const router = express.Router();

router.get(
  "/admin/settings",
  requireAuth,
  (req, res) => {
    res.json({ settings: getSettings() });
  }
);

module.exports = router;
