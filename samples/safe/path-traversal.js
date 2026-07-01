const fs = require("fs");
const path = require("path");

app.get("/files/:name", (req, res) => {
  const safeName = path.basename(req.params.name);
  const filePath = path.join(__dirname, "uploads", safeName);
  if (!filePath.startsWith(path.join(__dirname, "uploads"))) {
    return res.status(400).send("invalid path");
  }
  res.send(fs.readFileSync(filePath));
});
