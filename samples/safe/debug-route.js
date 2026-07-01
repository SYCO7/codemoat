const express = require("express");
const app = express();

if (process.env.NODE_ENV !== "production") {
  app.get("/__debug", (req, res) => {
    res.json({ config: app.locals.config });
  });
}

app.get("/users", (req, res) => {
  res.json(getUsers());
});

module.exports = app;
