const express = require("express");
const validator = require("express-validator");
let app = express();
//BOdy Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
let postRouter = require("./routes/postroute");
let putRouter = require("./routes/putroute");
let getRouter = require("./routes/getrouteGainsLosses");

const cors = require("cors");

//Pulling in mongodata
const { MongoClient } = require("mongodb"); //don't forget to add the .MongoClient or use destructing example {MongoClient} = require('mongodb');
const uri =
  "mongodb+srv://jaywheel:Kcgame24@cluster0.lz4kl.mongodb.net/test?retryWrites=true&w=majority"; //getting data for my cluster, will always be used. Used Atlas connect via driver.
const client = new MongoClient(uri, { useUnifiedTopology: true }); //initiating the MongoClient class, this will always be used

app.use(cors());
app.use("/", (req, res, next, err) => {
  console.log(req.body);
  next();
});
app.use("/", getRouter);
app.use("/", postRouter);
app.use("/", putRouter);

app.listen(19007);
