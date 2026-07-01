const axios = require("axios");

app.post("/fetch-preview", async (req, res) => {
  const response = await axios.get(req.body.url);
  res.json(response.data);
});
