const axios = require("axios");
const express = require("express");
const alpha = require("alphavantage")({ key: `${process.env.Alpha_Key}` });
let router = express.Router();
const { validationResult, check } = require("express-validator");
const {
  deleteFriend,
  updateUserById,
  findUser,
  updateUser,
  findUserById,
  addUserToDbAppUsers,
  updateUserArr,
  getCommunityData,
  findData,
  getMyFunds,
  updateUserArrPractice,
  getPriceFromDb,
} = require("./gainsMongoFunctions");
var sub = require("date-fns/sub");

const { myFunctions } = require("./backendMyFunctions");
const { User } = require("./classes");
const { dBCollectionTypes } = require("./types");
const {
  checkIfDupe,
  getPercentChange,
  getDatePrices,
  makePriceObj,
  checkIfSundayOrMonday,
} = myFunctions;

//const { default: axios } = require("axios");
function getPrice(priceObject) {
  const prices = Object.values(priceObject);
  return prices;
}

router.post("/login", async (req, res, err) => {
  console.log(`A login request has been made by ${req.body.email}`);
  const { email, password } = req.body; ///will nee
  if (!email || !password) return res.send(false);
  const user = new User(0, email.toLowerCase(), password, []);
  try {
    //res is sent in the class
    const loginTry = await user.signIn(password, res);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});
router.post("/asynclogin", async (req, res, err) => {
  console.log(`A login request has been made by ${req.body.userId}`);
  const { userId } = req.body;
  try {
    const user = await findUserById(userId);
    res.send(user);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

/*router.post("/addappuser", async (req, res, err) => {
  console.log("A request has been made");
  console.log(req.body);
  try {
    const user = await addUserToDbAppUsers(req.body);
    res.send(user);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
}); */

router.post("/singlestock", async (req, res, err) => {
  const priceInDbCollection = "intraday_prices";
  const today = new Date();
  const yesterday = sub(today, { days: checkIfSundayOrMonday() }); //Sunday/monday need to get fridays date, not yesterday
  today.toDateString();
  const localYesterday = yesterday.toLocaleDateString();
  const { Symbol } = req.body;
  if (!Symbol) Symbol = "AAPL";
  console.log(`${req.body.firstName} requested ${Symbol}`);
  try {
    const intradayPriceInDb = await getPriceFromDb(priceInDbCollection, Symbol);
    const companyOverviewRequest = await axios.get(
      //will be getCompanyOverView(Symbol), 1 for sure call
      `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${Symbol}&apikey=${process.env.Alpha_Key}`
    );
    const companyOverview = await companyOverviewRequest.data; //can delete
    ////if going with priceFromDB out if stmnt, if not do the below
    if (intradayPriceInDb) {
      const prices = [...intradayPriceInDb.prices].reverse(); //need to reverse so starts at latest date first
      const mostCurrentPrices = getDatePrices(prices, localYesterday); //getting yesterdays prices
      const firstPrice = mostCurrentPrices[0].value;
      const lastPrice = mostCurrentPrices[mostCurrentPrices.length - 1].value;
      const percentChange = getPercentChange(firstPrice, lastPrice);
      const stockObj = {
        Symbol: intradayPriceInDb.symbol,
        currentPrice: lastPrice,
        percentChange,
        companyOverview,
        mostCurrentPrices, //all prices, array
      };
      res.send(stockObj);
      return;
    } else {
      //make API
      const companyIntraday = await alpha.data.intraday(
        Symbol,
        null,
        null,
        "15min"
      );
      const companyQuote = await alpha.data.quote(Symbol); // // 1 request- should I use this or get from db? Would need to update if statment
      const keyArr = Object.keys(companyIntraday["Time Series (15min)"]);
      const valueArr = Object.values(companyIntraday["Time Series (15min)"]);
      const prices = makePriceObj(keyArr, valueArr); //don't need to reverse api, comes newest to oldest
      const mostCurrentPrices = getDatePrices(prices, yesterday); //getting yesterdays prices
      const firstPrice = mostCurrentPrices[0].value;
      const lastPrice = mostCurrentPrices[mostCurrentPrices.length - 1].value;
      const percentChange = getPercentChange(firstPrice, lastPrice);
      const stockObj = {
        Symbol: companyQuote["Global Quote"]["01. symbol"],
        currentPrice: lastPrice,
        percentChange,
        companyOverview,
        mostCurrentPrices, //all prices, array
      };
      res.send(stockObj);
    }
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

//not in sure, at the moment only searching stocks on my app, add back later
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
  try {
    const stocks = await getCommunityData("default_stocks");
    res.send(stocks);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

router.post("/getcommunityfunds", async (req, res, err) => {
  const { skipAmount, limit } = req.body;
  console.log(skipAmount, limit);
  try {
    const communityFunds = await getCommunityData("funds", skipAmount, limit);
    res.send(communityFunds);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

router.post("/getmyfunds", async (req, res, err) => {
  const userId = req.body.id;
  try {
    const userInfo = await findUserById(userId);
    const { createdFunds } = userInfo;
    res.send(createdFunds);
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});

router.post("/getuserinfo", async (req, res, err) => {
  try {
    const userInfo = await findUserById(req.body.id);
    res.send(userInfo);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

router.post("/getusers", async (req, res, err) => {
  const { skipAmount, limit } = req.body;
  console.log("yooooo", skipAmount);
  try {
    const fiftyUsers = await getCommunityData("users", skipAmount, limit);
    //will return an empty array if no more data to fetch, logic on what to do on frontend
    res.send(fiftyUsers);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

router.post("/getcommunitycompetitions", async (req, res, err) => {
  const { skipAmount, limit } = req.body;
  try {
    const first50Competitions = await getCommunityData(
      "competitions",
      skipAmount,
      limit
    );
    res.send(first50Competitions);
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});

router.post("/getusercompetition", async (req, res, err) => {
  const userId = req.body.id;
  try {
    const userInfo = await findUserById(userId);
    const { competitions } = userInfo;
    const getUserCompetitions = competitions.map(async (competition) => {
      const competitionId = competition.id.toString();
      try {
        const config = {
          collection: dBCollectionTypes.competitions,
          id: competitionId,
        };
        const competitionFound = await findData(config);
        console.log(
          competitionFound
            ? `compId: ${config.id} found `
            : `compId: ${config.id} not found `
        );

        return competitionFound;
      } catch (error) {
        console.log(error);
      }
    });
    const allUserCompetitions = await Promise.all(getUserCompetitions);
    const filterAllUsersComp = allUserCompetitions.filter(Boolean);

    return res.send(filterAllUsersComp);
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

router.post("/practicedata", async (req, res, err) => {
  try {
    const communityFunds = await getCommunityData("practiceCompetition");
    res.send(communityFunds);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

router.post("/getmyfundspractice", async (req, res, err) => {
  const userId = req.body.id;
  try {
    const communityFunds = await getMyFunds(userId);
    communityFunds.map(async (fund, index) => {});
    await updateUserArrPracticeTwo(userId, "createdFunds", [...communityFunds]);
    res.send(communityFunds);
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});

module.exports = router;
