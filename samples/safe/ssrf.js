const axios = require("axios");
const { resolveAllowedUrl } = require("./url-allowlist");

app.post("/fetch-preview", async (req, res) => {
  const safeUrl = resolveAllowedUrl(req.body.url);
  if (!safeUrl) {
    return res.status(400).json({ error: "host not allowed" });
  }
  const response = await axios.get(safeUrl);
  res.json(response.data);
});
