const express = require("express");
const validator = require("express-validator");
let app = express();
//BOdy Parser Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false, limit: "50mb" }));
let postRouter = require("./routes/postroute");
let putRouter = require("./routes/putroute");
let getRouter = require("./routes/getrouteGainsLosses");

const cors = require("cors");

app.use(cors());
app.use("/", (req, res, next, err) => {
  console.log(req.body);
  res.send("It Worked!!!!");
  next();
});
app.use("/", getRouter);
app.use("/", postRouter);
app.use("/", putRouter);
const port = process.env.PORT || 19007;
console.log("listening on port", port);
app.listen(port);
