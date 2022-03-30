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
  getMyFunds,
  updateUserArrPractice,
  updateUserArrPracticeTwo,
} = require("./gainsMongoFunctions");

const { myFunctions } = require("./backendMyFunctions");
const { User } = require("./classes");
const { checkIfDupe, getPercentChange } = myFunctions;

//const { default: axios } = require("axios");
function getPrice(priceObject) {
  const prices = Object.values(priceObject);
  return prices;
}

router.post("/login", async (req, res, err) => {
  console.log(`A login request has been made by ${req.body.name}`);
  const { name, email } = req.body; ///will nee
  const user = new User(0, email, newPassword, []);
  const login = user.signIn(passwordPlain);
  try {
    const loginSuccessful = await findUser(name);
    if (!loginSuccessful) return res.send(false);
    delete loginSuccessful.newPassword; //delete password
    res.send(loginSuccessful);
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
///add date comparison here
router.post("/singlestock", async (req, res, err) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  today.toDateString();
  const localYesterday = yesterday.toLocaleDateString();
  const { Symbol } = req.body;
  if (!Symbol) Symbol = "AAPL";
  console.log(`${req.body.userName} requested ${Symbol}`);
  try {
    const companyIntraday = await alpha.data.intraday(
      Symbol,
      null,
      null,
      "5min"
    );
    const companyQuote = await alpha.data.quote(Symbol);
    const companyOverviewRequest = await axios.get(
      `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${Symbol}&apikey=EUIY8ECEM4DJSHYU`
    );
    const companyOverview = await companyOverviewRequest.data;
    const keyArr = Object.keys(companyIntraday["Time Series (5min)"]);
    const valueArr = Object.values(companyIntraday["Time Series (5min)"]);
    function makePriceObj() {
      //format object for the chart on the front end
      const finalArr = valueArr
        .map((value, index) => {
          const date = new Date(keyArr[index]).toLocaleDateString();
          console.log(date, localYesterday);
          //only return data from yesterday, works but doesnt on Sundays and Mondays becuase Monday won't get Friday's data
          //  if (date < localYesterday) return false;
          return {
            value: parseFloat(value["4. close"]),
            timestamp: keyArr[index],
          };
        })
        .filter(Boolean);
      console.log(finalArr);
      return finalArr;
    }
    const prices = makePriceObj().reverse();
    const firstPrice = prices[0].value;
    const lastPrice = prices[prices.length - 1].value;
    const percentChange = getPercentChange(firstPrice, lastPrice);
    const stockObj = {
      Symbol: companyQuote["Global Quote"]["01. symbol"],
      //  currentPrice: companyQuote["Global Quote"]["05. price"],
      currentPrice: lastPrice,
      percentChange,
      // percentChange: companyQuote["Global Quote"]["10. change percent"],
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

router.post("/getmyfunds", async (req, res, err) => {
  const fundId = req.body.id;
  try {
    const communityFunds = await getMyFunds(fundId);
    res.send(communityFunds);
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
  //console.log(req.body);
  const config = {
    collection: "competitions",
    id: req.body.id.toString(),
  };
  try {
    const competitionFound = await findData(config);
    console.log(competitionFound ? "not found" : "competition found");
    return res.send(competitionFound);
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

const { myFunctions } = require("./backendMyFunctions");
const {
  checkIfDupe,
  makePriceObj,
  isEqualTo,
  isGreaterThan,
  getPercentChange,
  sortArr,
  isDateBefore,
} = myFunctions;
const bcrypt = require("bcrypt");
const { addUserToDbAppUsers, findUser } = require("./gainsMongoFunctions");
const saltRounds = 10;
const password = "Fkdj^45ci@Jad";

class Empire {
  constructor(id, name, hedgeFundName, cashBalance, data) {
    this.id = id;
    this.name = name;
    this.hedgeFundName = hedgeFundName;
    this.cashBalance = cashBalance;
    this.data = data;

    // this.startingValue = 1000;
  }
  //method that gets total amount of returns from all funds, map
  getAllInvestmentReturns() {
    if (!this.data.createdFunds || !this.data.createdFunds.length) return 0; //if this are no createdFunds
    return this.data.createdFunds
      .map((fund, index) => {
        const { tickers } = fund;
        return tickers
          .map((element, index) => {
            const dollars = getReturn(element); //send each ticket to get current of individual tiker
            return dollars;
          })
          .reduce((total, curr) => {
            return total + curr; //add value of tickers together, to get total value of created fund
          });
      })
      .reduce((total, curr) => {
        return total + curr; //add value of each createdfund together
      });
  }
  investmentReturns() {
    return this.getAllInvestmentReturns();
  }
  totalBalance() {
    return this.investmentReturns() + this.cashBalance;
  }
}

function getReturn(ticker) {
  const { amountPurchased, currentPrice, purchasePrice } = ticker;
  let finalDollar = amountPurchased * getPercentChange(); //percentofFund
  function getPercentChange() {
    return parseFloat(currentPrice) / parseFloat(purchasePrice);
  }
  return finalDollar;
}

class Competition {
  constructor(id, title, amount, starts, ends, data) {
    this.id = id;
    this.title = title;
    this.amount = amount;
    this.starts = starts;
    this.ends = ends;
    this.data = data;
  }
  hasEnded() {
    const today = new Date();
    return isDateBefore(today, this.ends);
  }
  getFinalStandings() {
    const updateInvestorWithTotal = decideWinner(
      this.data.joinedInvestors,
      this.amount
    );
    const sortedInvestors = sortArr(
      updateInvestorWithTotal,
      "finalBalance",
      "descending"
    );
    return sortedInvestors;
  }
  finalStandings() {
    return this.getFinalStandings();
  }
  replaceJoinedInvestors(newArr) {
    this.data.joinedInvestors = [...newArr];
    return this.data.joinedInvestors;
  }
  resultPropConfig() {
    return {
      collection: "practiceCompetition",
      id: this.id,
      prop: "results",
      data: this.resultsData(),
    };
  }
  getResultsData() {
    ///will be the prop passed to the mongo object,
    const clonedArr = [...this.finalStandings()]; //always clone when using shift
    const winner = clonedArr.shift(); //get first investor, mutates array
    const losers = [...clonedArr]; //rest of the array after shift are the losers
    const winningFund = winner.fundInPlay.name;
    const winningFundTicker = winner.fundInPlay.ticker;
    const winningAmount = winner.finalBalance;
    const winningTickers = winner.fundInPlay.tickers.map((ticker) => {
      const { symbol, percentOfFund } = ticker;
      return {
        symbol,
        percentOfFund,
      };
    });
    const results = {
      winner,
      winningFund,
      winningAmount,
      winningFundTicker,
      winningTickers,
      losers,
    };
    return results;
  }
  resultsData() {
    return this.getResultsData();
  }
}
//////////////////competition functions
function decideWinner(investorArr, amount) {
  const investorReturns = getWinner(investorArr, amount);
  const finalResults = investorReturns.map((investor, index) => {
    //array of arrays
    return investor.reduce((preValue, currValue) => {
      //add each arrays finalDollar amount
      const finalValue = preValue + currValue.finalDollarAmount;
      return finalValue;
    }, 0);
  });
  //add each result to their resepctive user
  finalResults.forEach((result, index) => {
    investorArr[index].finalBalance = result;
  });
  return investorArr;
}

function getWinner(investorArr, amount) {
  const newJoinedInvestors = investorArr.map((investor, index) => {
    const { fundInPlay, userId } = investor;
    const { tickers } = fundInPlay;
    const personalReturn = tickers.map((ticker, index) => {
      const { percentOfFund, tickerprices, symbol } = ticker;
      const clonedTickerPrices = [...tickerprices.prices];
      const begginingPrice = clonedTickerPrices.shift().value;
      const endingPrice = clonedTickerPrices.pop().value;
      const startEndPrice = [begginingPrice, endingPrice];
      const finalDollarAmount = getFinalDollarAmount(
        percentOfFund,
        amount, //competitionViewing.amount,
        startEndPrice
      );
      return { userId, symbol, percentOfFund, finalDollarAmount };
    });
    return personalReturn;
  });
  return newJoinedInvestors;
}

function getFinalDollarAmount(
  percentOfFund = 0.8,
  portfolioTotal,
  intradayPrices
) {
  const stockPrices = [...intradayPrices];
  const initalPrice = stockPrices[0];
  const finalPrice = stockPrices[1];
  let initalInvestment = (percentOfFund * portfolioTotal) / 100; //dollar amount invested
  const percentReturn = getPercentChange(initalPrice, finalPrice);
  const finalAmount =
    initalInvestment * (percentReturn / 100) + initalInvestment;
  return finalAmount;
}
///////////////////////////competition functions

class User {
  constructor(id, email, password, data) {
    (this.id = id),
      (this.email = email),
      (this.password = password),
      (this.data = data);
  }
  async add(res) {
    bcrypt.hash(this.password, saltRounds, async (err, hash) => {
      const addedUser = {
        ...this.data,
        password: hash,
      };
      const user = await addUserToDbAppUsers(addedUser); //returns false/null if dupe, reutns true if not dupe
      return res.send(user);
    });
  }
  async signIn(enteredPassword, res) {
    if (!enteredPassword) return false;
    const user = await findUser(this.email); //find user by email
    if (!user) return res.send(false); //if not correct email reutrn false
    const hashedPassword = user.password;
    console.log(enteredPassword, hashedPassword); //compare passwords
    return await bcrypt.compare(
      enteredPassword,
      hashedPassword,
      async (err, result) => {
        if (result) return res.send(user); //send user data if matches
        if (!result) return res.send(false); //send false
      }
    );
  }
}

//where I left off, need to save passwords for allcurrent users
bcrypt.hash("jerome", saltRounds, async (err, hash) => {
  console.log(hash);
  const addedUser = {
    ...this.data,
    password: hash,
  };
  console.log("yoooo", hash);
  // const user = await addUserToDbAppUsers(addedUser);
  return "success";
});

class CompetitionUser {
  constructor(id, name, image, competitionAmount, fund) {
    //fund is the fundIn Play info
    this.id = id;
    this.name = name;
    this.image = image;
    this.competitionAmount = competitionAmount;
    this.fund = fund;
    this.fundName = this.fund.name;
    this.fundTicker = this.fund.ticker;
  }
  getPersonalReturns(competionAmount = this.competitionAmount) {
    if (!this.fund.tickers || !this.fund.tickers.length) return 0; //if this are no createdFunds
    return this.fund.tickers.map((ticker, index) => {
      const { symbol } = ticker;
      if (!competionAmount) {
        competionAmount = 10;
        console.log("please pass a compeition amoiunt");
      }

      const { percentOfFund } = ticker;
      const dollars = getCompetitionReturns(
        percentOfFund,
        competionAmount,
        ticker.tickerprices.prices
      ); //send each ticket to get current of individual tiker
      return dollars;
    });
  }
  getTotalPercentChange() {
    return getPercentChange(
      this.competitionAmount,
      this.currentInvestmentValue()
    );
  }

  basicTickerData() {
    return this.fund.tickers.map((ticker, index) => {
      const { symbol, percentOfFund } = ticker;
      return { symbol, percentOfFund };
    });
  }
  setDollarChangeColor(value) {
    //  if (!value) console.log("inut a value");
    const parsedValue = parseFloat(value);
    if (!parsedValue) return "#a2d729";
    if (isLessThan(0, parsedValue)) return "rgba(230,0,0,.7)";
    return "#a2d729";
  }
  personalReturn() {
    return this.getPersonalReturns();
  }
  getChartReturns() {
    return getEachDayReturns(this.personalReturn());
  }
  chartArr() {
    return this.getChartReturns();
  }
  currentInvestmentValue() {
    const clonedChartArr = [...this.chartArr()];
    return clonedChartArr.pop().value.toFixed(2);
  }
  percentChange() {
    return this.getTotalPercentChange();
  }
  dollarChangeColor(value) {
    return this.setDollarChangeColor(value);
  }
  hi() {
    return `${this.fundTicker} says hi`;
  }
}
exports.Empire = Empire;
exports.Competition = Competition;
exports.User = User;
exports.CompetitionUser = CompetitionUser;
