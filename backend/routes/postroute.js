const express = require("express");
const { MongoClient, ObjectId } = require("mongodb"); //don't forget to add the .MongoClient or use destructing example {MongoClient} = require('mongodb');
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
  addUsertoCommunityArr,
  findData,
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

///add competition to creators arr, comminuty competition collection and also adds creator to the competitions joined players Arr property
router.post("/addcompetition", async (req, res, err) => {
  /* investmentsAllowed , ["# of Investestments"] ,amount,,[" # of Investors"],  Length8*/
  // console.log(req.body);
  const { Name, Length, Amount, createdByName, createdById, image } = req.body;
  const investmentsAllowed = req.body["# of Investments"];
  const investorsAllowed = req.body["# of Investors"];
  const selectedFund = req.body["Selected Fund"];
  const mongoID = ObjectId(); //make ID here so I can use within multiple objects
  const competionObj = {
    _id: mongoID,
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

    const userObj = {
      userId: createdById, //joined players object
      name: createdByName,
      image: image,
      fundInPlay: selectedFund,
      competitionId: mongoID,
    };
    const config = {
      collection: "competitions",
      competitionId: mongoID,
      arrName: "joinedInvestors",
      data: [userObj],
    };
    const creatorToCommunityFund = await addUsertoCommunityArr(config);
    res.send(mongoID);
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
  console.log(`A request to invite ${req.body.invitee}`); //this works, just work on the front end
  const inviteeId = req.body.invitee;

  try {
    const addedInvitation = await updateUserArr(inviteeId, "messages", [
      { ...req.body, sentDate: today },
    ]);
    res.send(addedInvitation);
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});

router.post("/acceptinvitation", async (req, res, err) => {
  //req.body has the competitionId and the userId(which is the creatorId)
  console.log(`Thanks for Joining ${req.body.name}`); //this works, just work on the front end
  const competitionId = ObjectId(req.body.competitionId);
  const creatorId = ObjectId(req.body.userId);
  console.log(competitionId);
  const config = {
    collection: "competitions",
    competitionId,
    arrName: "joinedInvestors",
    data: [req.body],
  };
  const dataConfig = {
    collection: "competitions",
    id: competitionId,
  };

  try {
    const acceptedInvitation = await addUsertoCommunityArr(config); //add accetptor to the competition
    const competition = await findData(dataConfig); //get competiiton
    const competitionCreatorId = await competition.createdById; //get the creator of competitions data
    const sendMsgtoCreator = await updateUserArr(
      //send acceptedInvitation to the competition creator
      competitionCreatorId,
      "messages",
      [{ ...req.body, acceptDate: today }]
    );
    res.send(true);
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});

var prevMonday = new Date();
console.log(
  prevMonday.setDate(prevMonday.getDate() - ((prevMonday.getDay() + 6) % 7))
);

//const date = new Date("2022-01-28 19:00:00");
console.log(date);
module.exports = router;
