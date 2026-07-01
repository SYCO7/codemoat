const express = require("express");
const app = express();

app.get("/__debug", (req, res) => {
  res.json({ env: process.env, config: app.locals.config });
});

app.get("/users", (req, res) => {
  res.json(getUsers());
});

module.exports = app;
