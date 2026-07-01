const express = require("express");
const cors = require("cors");
const app = express();

const allowedOrigins = ["https://app.example.com"];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

module.exports = app;
