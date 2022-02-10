const axios = require("axios");
const express = require("express");
const alpha = require("alphavantage")({ key: `${process.env.Alpha_Key}` });
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
  getCommunityData,
  findData,
} = require("./gainsMongoFunctions");
//const { default: axios } = require("axios");
function getPrice(priceObject) {
  const prices = Object.values(priceObject);
  return prices;
}

router.post("/login", async (req, res, err) => {
  console.log(`A login request has been made by ${req.body.userName}`);
  const { name } = req.body; ///will nee
  try {
    const loginSuccessful = await findUser(name);
    if (!loginSuccessful) return res.send(false);
    res.send(loginSuccessful);
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

//Not in use in front enddefault stock list array, for some reason the for each runs duplicate values
router.post("/stocklist", async (req, res, err) => {
  const { _id } = req.body;
  console.log(`Adding default stocks to ${req.body.userName} array`);
  try {
    const request1 = await alpha.data.quote("AAPL");
    const request2 = await alpha.data.quote("TSLA");
    const request3 = await alpha.data.quote("GOOG");
    const request4 = await alpha.data.quote("GME");
    const stockArr = Promise.all([request1, request2, request3, request4]);
    const response = await stockArr;
    res.send(response);
    updateUserArr(_id, "favorites", [...response]);
    return;
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

router.post("/singlestock", async (req, res, err) => {
  const { Symbol } = req.body;
  if (!Symbol) Symbol = "AAPL";
  console.log(`${req.body.userName} requested ${Symbol}`);
  try {
    const companyIntraday = await alpha.data.intraday(
      Symbol,
      null,
      null,
      "15min"
    );
    const companyQuote = await alpha.data.quote(Symbol);
    const companyOverviewRequest = await axios.get(
      `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${Symbol}&apikey=EUIY8ECEM4DJSHYU`
    );
    const companyOverview = await companyOverviewRequest.data;
    const keyArr = Object.keys(companyIntraday["Time Series (15min)"]);
    const valueArr = Object.values(companyIntraday["Time Series (15min)"]);
    function makePriceObj() {
      //format object for the chart on the front end
      const finalArr = valueArr.map((value, index) => {
        return {
          value: parseFloat(value["4. close"]),
          timestamp: keyArr[index],
        };
      });
      return finalArr;
    }
    const prices = makePriceObj().reverse();
    /* const oldprices = [
      ...getPrice(companyIntraday["Time Series (15min)"]),
    ].reverse(); //move prices to an array, and reverse so beginning day data shows first
    console.log(prices); */

    const stockObj = {
      Symbol: companyQuote["Global Quote"]["01. symbol"],
      currentPrice: companyQuote["Global Quote"]["05. price"],
      percentChange: companyQuote["Global Quote"]["10. change percent"],
      open: companyQuote["Global Quote"]["02. open"],
      companyOverview,
      prices, //all prices, array
    };
    res.send(stockObj);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

router.post("/search", async (req, res, err) => {
  const { keywords } = req.body;
  try {
    const req = await alpha.data.search(keywords);
    console.log(req);
    res.send(req);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

router.post("/defaultstocks", async (req, res, err) => {
  /* investmentsAllowed , ["# of Investestments"] ,amount,,[" # of Investors"],  Length8*/
  // console.log(req.body);
  try {
    const stocks = await getCommunityData("default_stocks");
    res.send(stocks);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

router.post("/getcommunityfunds", async (req, res, err) => {
  try {
    const communityFunds = await getCommunityData("funds");
    res.send(communityFunds);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

router.post("/getuserinfo", async (req, res, err) => {
  console.log(req.body.id);
  try {
    const userInfo = await findUserById(req.body.id);
    res.send(userInfo);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

router.post("/getusers", async (req, res, err) => {
  try {
    const first50Users = await getCommunityData("users");
    res.send(first50Users);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

router.post("/getcommunitycompetitions", async (req, res, err) => {
  try {
    const first50Competitions = await getCommunityData("competitions");
    res.send(first50Competitions);
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});

router.post("/getusercompetition", async (req, res, err) => {
  console.log(req.body);
  const config = {
    collection: "competitions",
    id: req.body.id,
  };
  try {
    const competitionFound = await findData(config);
    return competitionFound
      ? res.send(competitionFound)
      : console.log("not found");
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});

router.post("/likedfunds", async (req, res, err) => {
  console.log(req.body.id);
  const config = {
    collection: "funds",
    id: req.body.id,
  };
  try {
    const competitionFound = await findData(config);
    console.log(competitionFound);
    return competitionFound
      ? res.send(competitionFound)
      : console.log("not found");
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});

module.exports = router;
