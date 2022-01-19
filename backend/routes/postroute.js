const express = require("express");
const { MongoClient, ObjectId } = require("mongodb"); //don't forget to add the .MongoClient or use destructing example {MongoClient} = require('mongodb');
const dotenv = require("dotenv").config();
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.lz4kl.mongodb.net/test?retryWrites=true&w=majority`; //getting data for my cluster, will always be used. Used Atlas connect via driver.
const client = new MongoClient(uri, { useUnifiedTopology: true }); //initiating the MongoClient class, this will always be used
const alpha = require("alphavantage")({ key: `${process.env.Alpha_Key}` });
const axios = require("axios");

let router = express.Router();
const { validationResult, check } = require("express-validator");
const {
  deleteFriend,
  findSearchMatches,
  addUserToDb,
  findUserByIdResuse,
  updateUserById,
  findUser,
  getCustomers,
  findCustomer,
  updateUser,
  findUserById,
  findCustomerAndUpdate,
  addUserToDbAppUsers,
  updateUserArr,
  updateCommunityArr,
} = require("./gainsMongoFunctions");

const { getQuote } = require("./apiFunctions");

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const currentMonth = months[new Date().getMonth()];
const day = new Date().getDate();
const year = new Date().getFullYear();
const today = `${currentMonth} ${day}, ${year}`;

router.post("/", async (req, res, err) => {
  console.log("A request has been made");
  console.log(req.body);
  try {
    const customers = await getCustomers();
    res.send(customers);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

router.post("/addappuser", async (req, res, err) => {
  console.log("A request has been made");
  console.log(req.body);
  try {
    const user = await addUserToDbAppUsers(req.body);
    res.send(user);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

router.post("/addtofavorites", async (req, res, err) => {
  console.log(`A request to add ${req.body.symbol}`);
  const { id, arrName, symbol } = req.body;
  try {
    const stock = await getQuote(symbol);
    const addedToFavorites = await updateUserArr(id, arrName, [stock]);
    res.send(addedToFavorites);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

router.post("/addcreatedfund", async (req, res, err) => {
  /* investmentsAllowed , ["# of Investestments"] ,amount,,[" # of Investors"],  Length8*/
  // console.log(req.body);
  try {
    const { createdById } = req.body;
    const addedFund = await updateUserArr(createdById, "createdFunds", [
      { ...req.body, createDate: today },
    ]);
    const addedFundCommunity = await updateCommunityArr("funds", [
      { ...req.body, createDate: today },
    ]);
    res.send(addedFund);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

router.post("/addcompetition", async (req, res, err) => {
  /* investmentsAllowed , ["# of Investestments"] ,amount,,[" # of Investors"],  Length8*/
  console.log(req.body);

  const { Name, Length, Amount, createdByName, createdById } = req.body;
  const investmentsAllowed = req.body["# of Investestments"];
  const investorsAllowed = req.body["# of Investors"];
  const selectedFund = req.body["Selected Fund"];
  res.send(true);
  const competionObj = {
    createdById: createdById,
    createdByName: createdByName,
    title: Name,
    investmentsAllowed: investmentsAllowed || 0,
    investorsAllowed: investorsAllowed || 0,
    fundsInPlay: [selectedFund],
    amount: Amount,
    length: Length,
    startsIn: 0,
  };
  try {
    const addedToUserComps = await updateUserArr(
      createdById,
      "createdCompetitions",
      [competionObj]
    );
    const addedCompCommunity = await updateCommunityArr("competitions", [
      competionObj,
    ]);
    res.send("successful update");
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

router.post("/savequotes", async (req, res, err) => {
  /* investmentsAllowed , ["# of Investestments"] ,amount,,[" # of Investors"],  Length8*/
  // console.log(req.body);
  try {
    req.body.forEach(async (symbol, index) => {
      symbol.trim();
      const companyQuote = await alpha.data.quote(symbol);
      const companyOverviewRequest = await axios.get(
        `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=EUIY8ECEM4DJSHYU`
      );
      const companyOverview = await companyOverviewRequest.data;

      const stockObj = {
        Symbol: companyQuote["Global Quote"]["01. symbol"],
        currentPrice: companyQuote["Global Quote"]["05. price"],
        percentChange: companyQuote["Global Quote"]["10. change percent"],
        open: companyQuote["Global Quote"]["02. open"],
        companyOverview,
      };
      updateCommunityArr("default_stocks", [stockObj]);
    });
    res.send("All done :)");
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

router.post("/practice", async (req, res, err) => {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const currentMonth = months[new Date().getMonth()];
  const day = new Date().getDate();
  const year = new Date().getFullYear();
  const today = `${currentMonth} ${day}, ${year}`;
  const newBody = {
    ...req.body,
    createDate: today,
  };
  res.send(newBody);
});

router.post("/addfollower", async (req, res, err) => {
  console.log(`A request to add ${req.body.followerObj}`);
  const { followerObj, followingObj } = req.body;
  //const { followerId } = req.body;
  try {
    const addedToFollowers = await updateUserArr(
      followingObj.followingId,
      "followers",
      [followerObj]
    );
    const addedToFollowing = await updateUserArr(
      followerObj.followerId,
      "following",
      [followingObj]
    );
    res.send("I am added");
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});

router.post("/sendinvitation", async (req, res, err) => {
  console.log(`A request to ivnite ${req.body.id}`); //this works, just work on the front end
  const userId = req.body.id;
  try {
    const addedInvitation = await updateUserArr(userId, "messages", [
      { ...req.body, sentDate: today },
    ]);
    res.send(addedInvitation);
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});

module.exports = router;
