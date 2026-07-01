const fs = require("fs");
const path = require("path");

app.get("/files/:name", (req, res) => {
  const filePath = path.join(__dirname, "uploads", req.params.name);
  res.send(fs.readFileSync(filePath));
});
