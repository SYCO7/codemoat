const { evaluate } = require("mathjs");

app.post("/calc", (req, res) => {
  const result = evaluate(req.body.expression);
  res.json({ result });
});
