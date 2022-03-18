const express = require("express");
const alpha = require("alphavantage")({ key: `${process.env.Alpha_Key}` });
const axios = require("axios");
const { ObjectId } = require("mongodb"); //don't forget to add the .MongoClient or use destructing example {MongoClient} = require('mongodb');

let router = express.Router();
const { validationResult, check } = require("express-validator");
const {
  appendTodaysPrice,
  appendCurrentPrice,
  appendIntraDayPrice,
} = require("./asyncFunctions");
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
  deleteFromUserArr,
  deleteCollectionDocs,
  getPriceFromDb,
  getCommunityData,
  updateFundPrice,
  sendtoDB,
  updateCompetitionPrices,
  replaceCommunityData,
  addPropToCommunityData,
  incrementUserData,
  updateUserArrPractice,
  getMyFunds,
  deleteFromUserArrNotId,
  updateUserFunds,
} = require("./gainsMongoFunctions");
const { getQuote, getIntraday } = require("./apiFunctions");
const { myFunctions } = require("./backendMyFunctions");
const { Empire } = require("./classes");
const {
  checkIfDupe,
  makePriceObj,
  isEqualTo,
  isGreaterThan,
  getPercentChange,
  sortArr,
  isDateBefore,
} = myFunctions;
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
  const tickers = req.body.tickers;
  const mongoID = ObjectId(); //make ID here so I can use within multiple objects
  //get price of all funds tickers

  //Will need to get stock prcies for each symbol, try the db first then try the api
  ///need to create MongoID and so it can be placed on user FUnd and Comm Fund
  //addedFUnd should be finalCreatedFUnd and add _id:
  try {
    const { createdById } = req.body;

    const newTickerArr = await appendTodaysPrice(tickers);
    const finalCreatedFund = {
      _id: mongoID,
      ...req.body,
      tickers: newTickerArr,
      createDate: today,
    };
    const addedFund = await updateUserArr(createdById, "createdFunds", [
      { ...finalCreatedFund },
    ]);
    const addedFundCommunity = await updateCommunityArr("funds", [
      { ...finalCreatedFund },
    ]);
    res.send("Updated");
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});
//delete s
///add competition to creators arr, comminuty competition collection and also adds creator to the competitions joined players Arr property
router.post("/addcompetition", async (req, res, err) => {
  /* investmentsAllowed , ["# of Investestments"] ,amount,,[" # of Investors"],  Length8*/
  // console.log(req.body);
  const nextMonday = new Date();
  nextMonday.setDate(
    nextMonday.getDate() + ((((7 - nextMonday.getDay()) % 7) + 1) % 7 || 7)
  );
  function addDays(date, days) {
    let result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
  //5,12,19,26
  function addEndDate(date, days) {
    const endDate = addDays(date, days);
    return endDate;
  }
  function convertToTradingDays(days) {
    if (isEqualTo(5, days)) return 5;
    if (isEqualTo(10, days)) return 12;
    if (isEqualTo(15, days)) return 19;
    if (isEqualTo(20, days)) return 26;
    return 5; //default will be a week
  }

  const {
    name,
    length,
    amount,
    createdByName,
    createdById,
    image,
    investmentsAllowed,
    investorsAllowed,
    selectedFund,
  } = req.body;

  const tradingDays = convertToTradingDays(length);
  const endDate = addEndDate(nextMonday, tradingDays);

  const mongoID = ObjectId(); //make ID here so I can use within multiple objects
  const competionObj = {
    _id: mongoID,
    createdById: createdById,
    createdByName: createdByName,
    title: name,
    investmentsAllowed: investmentsAllowed || 5,
    investorsAllowed: investorsAllowed || 5,
    fundsInPlay: [selectedFund],
    amount: amount,
    length: length,
    starts: nextMonday.toLocaleDateString(),
    ends: endDate.toLocaleDateString(),
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
      competitionId: mongoID.toString(),
    };
    const config = {
      collection: "competitions",
      competitionId: mongoID,
      arrName: "joinedInvestors",
      data: [userObj],
    };
    const addToCreatorComps = await updateUserArr(createdById, "competitions", [
      { id: mongoID, joinDate: today },
    ]);
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
  const messageId = Math.floor(Math.random() * 1000000);
  try {
    const addedInvitation = await updateUserArr(inviteeId, "messages", [
      { ...req.body, sentDate: today, messageId },
    ]);
    res.send(addedInvitation);
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});

///used when accepting invitation to competition or joining a competition
router.post("/acceptinvitation", async (req, res, err) => {
  //req.body has the competitionId and the userId(which is the creatorId)
  console.log(`Thanks for Joining ${req.body.name}`); //this works, just work on the front end
  const competitionId = req.body.competitionId;
  const acceptorId = req.body.userId;
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
  const deleteUserArrConfig = {
    userId: acceptorId, //checking if equal to
    arr: "messages",
    condition: competitionId, //
  };
  function checkNumberOfInvestors(investmentsAllowed, investorsInCompetition) {
    if (
      isGreaterThan(investmentsAllowed, investorsInCompetition) ||
      isEqualTo(investmentsAllowed, investorsInCompetition)
    ) {
      return true;
    }
    return false;
  }
  try {
    const competition = await findData(dataConfig); //get competition
    const { joinedInvestors, createdById, investorsAllowed } = competition; //pull out the joinedInvestors Arr
    const hasTooManyInvestors = checkNumberOfInvestors(
      investorsAllowed,
      joinedInvestors.length
    );
    if (hasTooManyInvestors) {
      res.send({ type: "fail", message: "Competition Full" });
      return;
    }
    const joinedInvestorsId = joinedInvestors.map(
      (investor) => investor.userId
    ); //map the id's
    const isDuplicate = checkIfDupe(joinedInvestorsId, req.body.userId); //check if the joinerId is already in the array
    if (isDuplicate) {
      console.log("duplicate");
      res.send({ type: "fail", message: "Your're already In the competition" });
      return;
    }
    const acceptedInvitation = await addUsertoCommunityArr(config); //add acceptor to the competition
    const deleteMsg = await deleteFromUserArr(deleteUserArrConfig);
    const addToAcceptorsComp = await updateUserArr(acceptorId, "competitions", [
      {
        id: competitionId,
        joinDate: today,
      },
    ]);
    const sendMsgtoCreator = await updateUserArr(
      //send acceptedInvitation to the competition creator
      createdById,
      "acceptedInvites",
      [{ ...req.body, acceptDate: today }]
    );

    res.send({ type: "success", message: "You've Joined!" });
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});

router.post("/deletemessage", async (req, res, err) => {
  const deleteUserArrConfig = {
    userId: req.body.userId, //checking if equal to
    arr: "messages",
    conditionKey: "messageId",
    condition: req.body.messageId, //
  };

  try {
    const deleteMsg = await deleteFromUserArrNotId(deleteUserArrConfig);
    res.send(deleteMsg);
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});

router.post("/deleteinvite", async (req, res, err) => {
  const deleteUserArrConfig = {
    userId: req.body.userId, //checking if equal to
    arr: "acceptedInvites",
    conditionKey: "competitionId",
    condition: req.body.competitionId, //
  };

  try {
    const deleteMsg = await deleteFromUserArrNotId(deleteUserArrConfig);
    res.send(deleteMsg);
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});
router.post("/likefund", async (req, res, err) => {
  //req.body has the competitionId and the userId(which is the creatorId)
  console.log(req.body); //this works just need to match the payload from the front end
  const config = {
    collection: "funds",
    competitionId: req.body.fundId,
    arrName: "likes",
    data: [req.body],
  };

  try {
    const likedFund = await addUsertoCommunityArr(config);
    const likedFundUser = await updateUserArr(req.body.likerId, "likedFunds", [
      req.body.fundId,
    ]);
    //need to add to users likedFunds as well
    res.send(likedFund);
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});

//when user clicks bear
router.post("/addBullUser", async (req, res, err) => {
  console.log(req.body); //this works just need to match the payload from the front end
  const config = {
    collection: "funds",
    competitionId: req.body.fundId, //is not actually competiitonID, that is just the parameter name
    arrName: "bulls",
    data: [req.body],
  };
  try {
    const bullFund = await addUsertoCommunityArr(config);
    res.send(bullFund._id);
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});
//when user clicks bear
router.post("/addBearUser", async (req, res, err) => {
  const config = {
    collection: "funds",
    competitionId: req.body.fundId, //is not actually competiitonID, that is just the parameter name
    arrName: "bears",
    data: [req.body],
  };
  try {
    const bullFund = await addUsertoCommunityArr(config);
    res.send(bullFund._id);
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});
router.post("/onboardingviewed", async (req, res, err) => {
  console.log(req.body); //this works just need to match the payload from the front end
  try {
    const viewedOnboarding = await updateUser(req.body.id);
    res.send(viewedOnboarding);
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});

router.post("/addstockprices", async (req, res, err) => {
  const symbols = req.body;
  //req.body has the competitionId and the userId(which is the creatorId)
  // console.log(req.body); //this works just need to match the payload from the front end
  try {
    await deleteCollectionDocs("stock prices"); //delete prior data
    const stocksPrices = symbols.map(async (symbol, index) => {
      const quote = await getQuote(symbol);
      const quoteObject = {
        symbol: quote["Global Quote"]["01. symbol"],
        sharePrice: parseFloat(quote["Global Quote"]["05. price"]).toFixed(2),
      };
      return quoteObject;
    });
    const finalStockPrices = await Promise.all(stocksPrices);
    const pricesUpdated = await updateCommunityArr(
      "stock prices",
      finalStockPrices
    );
    const updateSuccessful = isEqualTo("success", pricesUpdated.type);
    res.send(updateSuccessful ? "Update Successful" : "Update Failed");
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});

router.post("/addintradayprices", async (req, res, err) => {
  const symbols = req.body;
  const collection = "intraday_prices";
  try {
    await deleteCollectionDocs(collection); //delete prior data
    const intradayPrices = symbols.map(async (symbol, index) => {
      ///get quote for each symbol and push into arr
      const intradayPrice = await getIntraday(symbol);
      const quoteObject = {
        ...intradayPrice,
        updated: new Date(),
      };
      return quoteObject;
    });
    const finalStocks = await Promise.all(intradayPrices);
    const pricesUpdated = await updateCommunityArr(collection, finalStocks);
    const updateSuccessful = isEqualTo("success", pricesUpdated.type);
    res.send(updateSuccessful ? "Update Successful" : "Update Failed");
  } catch (error) {
    console.log(error);
    //res.send(error);
  }
});

router.post("/practicefund", async (req, res, err) => {
  const tickers = req.body.tickers;

  //return tickers with prices appened
  try {
    const newTickerArr = await appendTodaysPrice(tickers);

    //return the orginal fund(req.body), but replace the ticker proprtey with the newTickerArr
    const finalCreatedFund = {
      ...req.body,
      tickers: newTickerArr,
      createDate: today,
    };

    res.send(finalCreatedFund);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

router.post("/updatefunds", async (req, res, err) => {
  //return tickers with prices appened
  try {
    const allFunds = await getCommunityData("funds");
    const allFundsMapped = allFunds.map(async (fund, index) => {
      const { tickers } = fund; //get ticker arr
      const updatedTickers = await appendCurrentPrice(tickers); //updated tickers with current prices
      const updatedFund = {
        ...fund, //return the orginal fund, but replace the ticker proprtey with the newTickerArr
        tickers: updatedTickers,
        updatedDate: today,
      };
      updateFundPrice(updatedFund); //find and replace mongo db(by _id)
      return "Updated";
    });
    const allFundsUpdated = await Promise.all(allFundsMapped);
    //get current price for today(update daily)
    res.send(allFundsUpdated);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

router.post("/updatecompetitionfunds", async (req, res, err) => {
  //return tickers with prices appened
  try {
    const allCompetitions = await getCommunityData("competitions"); //get competiitons and dstructure each fund from the joined investor arr
    ///
    const mappedCompetitions = allCompetitions.map(
      async (competition, index) => {
        const { joinedInvestors, starts } = competition; //get ticker arr
        console.log(joinedInvestors);
        const updatedInvestors = await appendIntraDayPrice({
          startDate: starts,
          arr: joinedInvestors,
        }); //updated tickers with current prices
        const updatedCompetition = {
          ...competition, //return the orginal fund(), but replace the ticker proprtey with the newTickerArr
          joinedInvestors: updatedInvestors,
          updatedDate: today,
        };
        return updatedCompetition;
      }
    );
    const updatedCompetition = await Promise.all(mappedCompetitions);
    console.log(updatedCompetition);
    const updateSuccessful = await updateCompetitionPrices([
      ...updatedCompetition,
    ]); //find and replace mongo db(by _id)
    res.send(updateSuccessful);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

router.post("/practicecompetition", async (req, res, err) => {
  //return tickers with prices appened
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
  function getWinner(today, endDate, competition) {
    const { joinedInvestors, amount } = competition;
    const newJoinedInvestors = joinedInvestors.map((investor, index) => {
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
  function decideWinner(competition) {
    const { ends, joinedInvestors } = competition;
    const investorReturns = getWinner(today, ends, competition);
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
      joinedInvestors[index].finalBalance = result;
    });
    return joinedInvestors;
  }
  try {
    const allCompetitions = await getCommunityData("practiceCompetition"); //get competiitons and dstructure each fund from the joined investor arr
    //  console.log(allCompetitions);
    const finalBoard = allCompetitions.map(async (competition, index) => {
      const { ends, _id, results } = competition;
      const compeitionEnded = isDateBefore(today, ends);
      if (!compeitionEnded)
        //if comps hasnt ended or if results already are already determined
        //only issue is game ends saurdays, so currently won't be updated until Sunday
        return { compId: _id, msg: "This Competition hasn't ended" };
      if (results)
        return {
          compId: _id,
          msg: "This Competition results were already determined",
        };
      const updateInvestorWithTotal = decideWinner(competition);
      const competitionAmount = competition.amount;
      delete competition.joinedInvestors;
      const updatedCompetition = {
        ...competition, //update comp with new investor
        joinedInvestors: updateInvestorWithTotal, //is the joinedInvestorArr with updated final Balance
      };
      ///sort so the investor are in order
      const rankings = sortArr(
        updatedCompetition.joinedInvestors,
        "finalBalance",
        "descending"
      );
      const replaceConfig = {
        collection: "practiceCompetition",
        id: _id,
        data: updatedCompetition,
      };
      await replaceCommunityData(replaceConfig);
      const winnerAndLosers = addWinnerLosers(rankings);
      const resultPropConfig = {
        collection: "practiceCompetition",
        id: _id,
        prop: "results",
        data: winnerAndLosers,
      };
      const competitionFullyUpdated = await addPropToCommunityData(
        resultPropConfig
      );
      await updateUserRecord(winnerAndLosers, competitionAmount);
      console.log("new ranking", competitionFullyUpdated);
      return { compId: _id, msg: "This Competition has been updated" };
    });
    const updatedCompetition = await Promise.all(finalBoard);

    res.send(updatedCompetition);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

function addWinnerLosers(array) {
  if (!Array.isArray(array)) throw new Error("Array must be passed");
  const clonedArr = [...array]; //always clone when using shift
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

async function updateUserRecord(rankingObj, competitionAmount) {
  const { winner, losers } = rankingObj;
  const keyName = "cashBalance";
  const collectionName = "practiceUsers";
  //delete winner.fundInPlay.tickers ?
  const winnerConfig = {
    id: winner.userId,
    keyName,
    collectionName,
    amount: winner.finalBalance,
  };
  try {
    await updateUserArrPractice(winner.userId, "2wins", [winner]);
    await incrementUserData(winnerConfig);
    const updateLosers = losers.map(async (loser, index) => {
      const negativeAmount = -competitionAmount;
      const loserConfig = {
        id: loser.userId,
        keyName,
        collectionName,
        amount: negativeAmount,
      };
      await updateUserArrPractice(loser.userId, "2losses", [loser]);
      await incrementUserData(loserConfig);
      return { compId: loser.userId, msg: "The losers data has been updated" };
    });
    const updatedLoser = await Promise.all(updateLosers);
    return updatedLoser;
  } catch (error) {
    console.log(error);
  }
}

//run after the funds in the community updated. This grabs the
//users funds from the community and updates the users createdFunds array with
//updated fund,, look to make this cleaner
router.post("/updateuserfunds", async (req, res, err) => {
  try {
    const users = await getCommunityData("users");

    //move users into their own arrays
    const updatedUsers = users.map((user) => {
      const userWithUpdates = {
        id: user._id,
        updatedFunds: [],
      };
      user.createdFunds.forEach((fund) => {
        userWithUpdates.updatedFunds.push(fund);
      });
      return userWithUpdates;
    });
    //update each fund in their own array with the community fund(updated), returns array of arrays.
    const updateUsers = updatedUsers.map(async (user = {}, index) => {
      const userWithUpdates = {
        id: user.id, //make another object
        updatedFunds: [],
      };
      return Promise.all(
        user.updatedFunds.map(async (fund, index) => {
          try {
            const updatedFund = await getMyFunds(fund._id); //get fund
            userWithUpdates.updatedFunds.push(updatedFund[0]); //push fund to the users array//
            return userWithUpdates;
          } catch (error) {
            console.log(error);
            return { err: "There was an error", errMsg: error };
          }
        })
      );
    });
    const usersUpdated = await Promise.all(updateUsers);
    //first index of array hold amultiple array with same data in it
    //need to reduce the each index of the array to one array([[[],[],[]],[],[]]
    const reduceLengthToOne = usersUpdated.forEach((item, index) => {
      console.log(item);
      if (!item.length) return (item = null);
      item.length = 1;
    });

    //update User
    const updatedUser = await usersUpdated.flat().map(async (user) => {
      if (!user.updatedFunds.length) return;
      try {
        const updateUserFundConfig = {
          id: user.id, //checking if equal to
          arrName: "createdFunds",
          collection: "users",
          data: [...user.updatedFunds],
        };
        console.log(updateUserFundConfig);
        await updateUserFunds(updateUserFundConfig);
        return `${user.id} was updated`;
      } catch (error) {
        console.log(error);
        return { error };
      }
    });
    await updatedUser;
    res.send(updatedUser);
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});

router.post("/sellfund", async (req, res, err) => {
  console.log(`A sell fund request made by ${req.body.userId}`); //this works, just work on the front end
  const cashBalanceConfig = {
    id: req.body.userId,
    collectionName: "users",
    keyName: "cashBalance",
    amount: req.body.amount,
  };
  try {
    const user = await findUserById(req.body.userId);
    //filter out the deleted fund
    const newUserCreatedFunds = user.createdFunds.filter((fund) => {
      const stringId = fund._id.toString(); //make string because is a MongoId object
      return stringId !== req.body.fundId;
    });
    const updateUserFundConfig = {
      id: req.body.userId, //checking if equal to
      arrName: "createdFunds",
      collection: "users",
      data: [...newUserCreatedFunds],
    };
    await updateUserFunds(updateUserFundConfig); //add new fundArr to user(overrides prior fundArr($set))
    await incrementUserData(cashBalanceConfig); //add money from teh fund to cash balance
    res.send("hahahah");
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});

router.post("/updateUsersBalance", async (req, res, err) => {
  //console.log(`A sell fund request made by ${req.body.userId}`); //this works, just work on the front end
  try {
    const users = await getCommunityData("users");
    const empireUsers = users.map(async (user, index) => {
      const { _id, name, hedgeFundName, cashBalance } = user;
      const empireUser = new Empire(
        _id,
        name,
        hedgeFundName,
        cashBalance,
        user
      );
      const totalBalance = empireUser.totalBalance();
      const userPrice = {
        value: totalBalance,
        timestamp: today,
      };
      console.log(empireUser.id);
      await updateUserArr(empireUser.id, "empireDailyPrice", [userPrice]);
      return { msg: `${name} price has been updated to ${totalBalance}` };
    });
    const allEmpireUsersUpdated = await Promise.all(empireUsers);
    res.send(allEmpireUsersUpdated);
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});

module.exports = router;
