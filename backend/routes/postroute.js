const express = require("express");
const alpha = require("alphavantage")({ key: `${process.env.Alpha_Key}` });
const axios = require("axios");
const bcrypt = require("bcryptjs");

const { ObjectId } = require("mongodb"); //don't forget to add the .MongoClient or use destructing example {MongoClient} = require('mongodb');
//const nodemailer = require("nodemailer");
//let transporter = nodemailer.createTransport();
let router = express.Router();
const { validationResult, check } = require("express-validator");
const isBefore = require("date-fns/isBefore");
var isAfter = require("date-fns/isAfter");
var isEqual = require("date-fns/isEqual");
const {
  appendTodaysPrice,
  appendCurrentPrice,
  appendIntraDayPrice,
  getCompanyOverView,
  appendDailyPrice,
} = require("./asyncFunctions");
const {
  updateUser,
  findUserById,
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
  getMyFunds,
  deleteFromUserArrNotId,
  updateUserFunds,
  cloneCollection,
  setCommunityDataProp,
  findUser,
  findUserPractice,
} = require("./gainsMongoFunctions");
const {
  getQuote,
  getIntraday,
  getIntradayCrypto,
  getCryptoQuote,
  getDaily,
  getIntradayPractice,
} = require("./apiFunctions");
const { myFunctions } = require("./backendMyFunctions");

const { dBCollectionTypes, responseTypes } = require("./types");
const tryAgainResponse = {
  type: responseTypes.error,
  message: "Something went wrong try again",
};

const { Empire, Competition, User } = require("./classes");
const { add } = require("date-fns");
const {
  checkIfDupe,
  makePriceObj,
  isEqualTo,
  isGreaterThan,
  getPercentChange,
  sortArr,
  isDateBefore,
  getDatePrices,
  deleteTickerPrices,
} = myFunctions;

const today = new Date();

router.post("/addappuser", async (req, res, err) => {
  console.log("A request has been made");
  const { email, password } = req.body;
  if (!email || !password)
    return res.send({ type: "error", msg: "Please enter password and email" });
  const newUser = new User(0, email.toLowerCase(), password, req.body);
  try {
    const user = await newUser.add(res);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

router.post("/updateProfilePic", async (req, res, err) => {
  console.log("A request has been made");
  const { id, image } = req.body;
  const updateUserConfig = {
    collection: dBCollectionTypes.users,
    userId: id,
    prop: "image",
    data: image,
  };
  try {
    const updatedUserPic = await updateUser(updateUserConfig);
    const userWithNewPic = updatedUserPic.value ? updatedUserPic.value : null; //value will be null if not found, return the doc if found
    if (
      !userWithNewPic ||
      !userWithNewPic.createdFunds ||
      !userWithNewPic.createdFunds.length
    )
      return res.send("no createdFunds");
    res.send("updated"); //I want to put this here, so user doesn’t have to wait until their funds are updated.

    //updated all User created FUnds
    const userFunds = userWithNewPic.createdFunds.map(async (fund) => {
      const fundId = fund._id;
      const updateCommunityDataConfig = {
        collection: dBCollectionTypes.funds,
        id: fundId,
        prop: "image",
        data: image, //from req.body
      };
      try {
        await addPropToCommunityData(updateCommunityDataConfig);
        return { fund: fundId, msg: "pic has been updated" };
      } catch (error) {
        console.log(error);
        return { error, msg: `${fundId} was not updated` };
      }
    });
    return;
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

//this works just make switch collection and paste to aws,
//to test paste a new comp in practice comp and send request to change from front end
router.post("/userUpdatedCompFund", async (req, res, err) => {
  console.log("A request has been made");
  const collection = dBCollectionTypes.competitions;
  const { userId, compId, newFund } = req.body;
  const compDataConfig = {
    collection,
    id: compId,
  };

  try {
    const competition = await findData(compDataConfig); //get competition
    if (!competition) return res.send(tryAgainResponse);
    const { joinedInvestors } = competition;
    const user = joinedInvestors.filter(
      (investor) => investor.userId === userId
    )[0]; //get user
    deleteTickerPrices(newFund); //need to reset ticker prices to 0
    const userWithNewFund = {
      ...user,
      fundInPlay: newFund,
    };
    const otherInvestors = joinedInvestors.filter(
      (investor) => investor.userId !== userId
    ); //sepearate other investors
    otherInvestors.push(userWithNewFund);
    console.log(userWithNewFund);
    console.log("yoooo", otherInvestors);
    const updateCommunityDataConfig = {
      collection: dBCollectionTypes.competitions,
      id: compId,
      prop: "joinedInvestors",
      data: otherInvestors, //new joinedinvestors with updated user pushed
    };
    await addPropToCommunityData(updateCommunityDataConfig);
    return res.send({
      type: responseTypes.success,
      message: "Fund Updated",
    });
  } catch (error) {
    console.log(error);
    res.status(400).send("error");
  }
});

router.post("/addtofavorites", async (req, res, err) => {
  const { id, arrName, symbol } = req.body;
  try {
    //  const stock = await getQuote(symbol);
    const addedToFavorites = await updateUserArr(id, arrName, [{ symbol }]);
    res.send(addedToFavorites);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

router.post("/addcreatedfund", async (req, res, err) => {
  const tickers = req.body.tickers;

  const mongoID = ObjectId(); //make ID here so I can use within multiple objects
  //get price of all funds tickers
  const decrementAmount = -1000;

  //Will need to get stock prcies for each symbol, try the db first then try the api
  ///need to create MongoID and so it can be placed on user FUnd and Comm Fund
  //addedFUnd should be finalCreatedFUnd and add _id:
  try {
    const { createdById } = req.body;
    console.log(req.body);
    const newTickerArr = await appendTodaysPrice(tickers);
    const finalCreatedFund = {
      _id: mongoID,
      ...req.body,
      tickers: newTickerArr,
      createDate: today,
    };
    const incrementConfig = {
      id: createdById,
      keyName: "cashBalance",
      collection: dBCollectionTypes.users,
      amount: decrementAmount,
    };
    const addFund = await updateUserArr(createdById, "createdFunds", [
      { ...finalCreatedFund },
    ]);
    const addFundCommunity = await updateCommunityArr(dBCollectionTypes.funds, [
      { ...finalCreatedFund },
    ]);
    incrementUserData(incrementConfig);
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
  const collection = dBCollectionTypes.competitions;
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
  try {
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

    //want to delete tickerprices in the fund,
    deleteTickerPrices(selectedFund);

    const mongoID = ObjectId(); //make ID here so I can use within multiple objects
    const userObj = {
      userId: createdById, //joined players object
      name: createdByName,
      image: image,
      fundInPlay: selectedFund,
      competitionId: mongoID.toString(),
    };
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
      joinedInvestors: [userObj], //add the user obj
      starts: nextMonday.toLocaleDateString(),
      ends: endDate.toLocaleDateString(),
    };

    const addedToUserComps = await updateUserArr(
      createdById,
      "createdCompetitions",
      [competionObj]
    );
    const addedCompCommunity = await updateCommunityArr(collection, [
      competionObj,
    ]);

    const addToCreatorComps = await updateUserArr(createdById, "competitions", [
      { id: mongoID, joinDate: today },
    ]);
    res.send(mongoID);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
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
  const collection = dBCollectionTypes.competitions;
  //req.body has the competitionId and the userId(which is the creatorId)
  console.log(`Thanks for Joining ${req.body.name}`); //this works, just work on the front end
  try {
    const { fundInPlay } = req.body;
    deleteTickerPrices(fundInPlay);
    const competitionId = req.body.competitionId;
    const acceptorId = req.body.userId;
    const config = {
      collection,
      competitionId,
      arrName: "joinedInvestors",
      data: [req.body],
    };
    const dataConfig = {
      collection,
      id: competitionId,
    };
    const deleteUserArrConfig = {
      userId: acceptorId, //checking if equal to
      arr: "messages",
      condition: ObjectId(competitionId), //
    };
    function checkNumberOfInvestors(
      investmentsAllowed,
      investorsInCompetition
    ) {
      if (
        isGreaterThan(investmentsAllowed, investorsInCompetition) ||
        isEqualTo(investmentsAllowed, investorsInCompetition)
      ) {
        return true;
      }
      return false;
    }
    function hasStarted(dateChecking) {
      const today = new Date();
      const start = new Date(dateChecking);
      if (isEqual(today, start) || isAfter(today, start)) {
        return true;
      }
      return false;
    }
    const competition = await findData(dataConfig); //get competition
    const { joinedInvestors, createdById, investorsAllowed, starts } =
      competition; //pull out the joinedInvestors Arr
    const hasTooManyInvestors = checkNumberOfInvestors(
      investorsAllowed,
      joinedInvestors.length
    );
    if (hasTooManyInvestors) {
      res.send({ type: "fail", message: "Competition Full" });
      return;
    }
    if (hasStarted(starts)) {
      res.send({ type: "fail", message: "Competition Started" });
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
  const collection = dBCollectionTypes.funds;
  //req.body has the competitionId and the userId(which is the creatorId)
  const config = {
    collection,
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
  const collection = dBCollectionTypes.funds;
  const config = {
    collection,
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
  const collection = dBCollectionTypes.funds;

  const config = {
    collection: collection,
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
  const collection = dBCollectionTypes.users;

  const updateUserConfig = {
    collection,
    userId: req.body.id,
    prop: "firstLogin",
    data: false,
  };
  try {
    const viewedOnboarding = await updateUser(updateUserConfig);
    res.send(viewedOnboarding);
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});

/////////////////////////////////////Nightly Post routes Starts

router.post("/addstockprices", async (req, res, err) => {
  const collection = dBCollectionTypes.stockPrices;
  const symbols = req.body;
  try {
    const stocksPrices = symbols.map(async (symbol, index) => {
      const quote = await getQuote(symbol);
      const quoteObject = {
        symbol: quote["Global Quote"]["01. symbol"],
        sharePrice: parseFloat(quote["Global Quote"]["05. price"]),
      };
      return quoteObject;
    });
    const finalStockPrices = await Promise.all(stocksPrices);
    const pricesUpdated = await updateCommunityArr(
      collection,
      finalStockPrices
    );
    const updateSuccessful = isEqualTo("success", pricesUpdated.type);
    res.send(updateSuccessful ? "Update Successful" : "Update Failed");
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});

router.post("/updatedefaultstocks", async (req, res, err) => {
  const communityCollection = dBCollectionTypes.defaultStocks; //use types after confirming everything works
  const priceInDbCollection = dBCollectionTypes.stockPrices;
  let apiCallsForPrice = 0;
  const apiCallPriceArr = [];
  try {
    const updateDefaultStocks = req.body.map(async (symbol, index) => {
      symbol.trim();
      const companyOverview = await getCompanyOverView(symbol);
      const quoteInDB = await getPriceFromDb(priceInDbCollection, symbol);
      if (quoteInDB) {
        return {
          Symbol: quoteInDB.symbol,
          currentPrice: quoteInDB.sharePrice,
          companyOverview,
          updated: new Date(),
        };
      } else {
        apiCallsForPrice = apiCallsForPrice + 1;
        apiCallPriceArr.push(symbol);
        const companyQuote = await getQuote(symbol);
        return {
          Symbol: companyQuote["Global Quote"]["01. symbol"],
          currentPrice: companyQuote["Global Quote"]["05. price"],
          companyOverview,
          updated: new Date(),
        };
      }
    });
    const updatedDefaultStocks = await Promise.all(updateDefaultStocks);
    const defaultStocksUpdated = await updateCommunityArr(communityCollection, [
      ...updatedDefaultStocks,
    ]);
    const updateSuccessful = isEqualTo("success", defaultStocksUpdated.type);
    res.send(
      updateSuccessful
        ? {
            msg: `"All done", there were ${apiCallsForPrice} apiCalls for price`,
            apiCallPriceArr,
          }
        : "Update Failed"
    );
  } catch (error) {
    console.log(error);
    res.status().send(error);
  }
});

router.post("/addintradayprices", async (req, res, err) => {
  const symbols = req.body;

  const collection = dBCollectionTypes.intraDayPrices;
  let apiCalls = 0;
  try {
    const intradayPrices = symbols.map(async (symbol, index) => {
      ///get quote for each symbol and push into arr
      const intradayPrice = await getIntraday(symbol);
      apiCalls = apiCalls + 1;
      const quoteObject = {
        ...intradayPrice,
        updated: new Date(),
      };
      return quoteObject;
    });
    const finalStocks = await Promise.all(intradayPrices);
    const pricesUpdated = await updateCommunityArr(collection, finalStocks);
    const updateSuccessful = isEqualTo("success", pricesUpdated.type);
    res.send(
      updateSuccessful
        ? `Update Successful, there were ${apiCalls} api calls`
        : "Update Failed"
    );
  } catch (error) {
    console.log(error);
    //res.send(error);
  }
});

router.post("/updatefunds", async (req, res, err) => {
  //return tickers with prices appened
  const collection = dBCollectionTypes.funds;

  try {
    const allFunds = await getCommunityData(collection);
    const allFundsMapped = allFunds.map(async (fund, index) => {
      const { tickers, name, sold } = fund; //get ticker arr
      //if fund sold, rturn  msg saying this fund sold
      if (sold) return `Fund ${name} was sold and won't be updated"`;

      const updatedTickers = await appendCurrentPrice(tickers); //updated tickers with current prices
      const updatedFund = {
        ...fund, //return the orginal fund, but replace the ticker proprtey with the newTickerArr
        tickers: updatedTickers,
        updatedDate: today,
      };
      updateFundPrice(collection, updatedFund); //find and replace mongo db(by _id)
      return `Fund ${name} "Updated"`;
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
  const collection = dBCollectionTypes.competitions;
  try {
    const allCompetitions = await getCommunityData(collection); //get competiitons and dstructure each fund from the joined investor arr
    const mappedCompetitions = allCompetitions.map(
      async (competition, index) => {
        const { joinedInvestors, starts, ends, results, title } = competition; //get ticker arr
        const today = new Date();
        const startDate = new Date(starts);
        const endDate = new Date(ends);

        if (
          isBefore(today, startDate) || //is 1st before second-start
          // isAfter(today, endDate) || //is first after second- not needed if i determine winners on saturday. ANd aws time zones mess this up
          results
        )
          return false;

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
    const updatedCompetition = (await Promise.all(mappedCompetitions)).filter(
      Boolean
    );
    const updateSuccessful = await updateCompetitionPrices([
      ...updatedCompetition,
    ]); //find and replace mongo db(by _id)
    res.send(updateSuccessful);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

router.post("/determineWinner", async (req, res, err) => {
  const collection = dBCollectionTypes.competitions;
  try {
    const allCompetitions = await getCommunityData(collection); //get competiitons and dstructure each fund from the joined investor arr
    const finalBoard = allCompetitions.map(async (competition, index) => {
      const { _id, title, amount, starts, ends, results } = competition;
      const competitionClass = new Competition(
        _id,
        title,
        amount,
        starts,
        ends,
        competition
      );
      const compeitionEnded = competitionClass.hasEnded();
      if (!compeitionEnded)
        return { compId: _id, msg: "This Competition hasn't ended" };
      if (results)
        return {
          compId: _id,
          msg: "This Competition results were already determined",
        };
      // const finalStanding = competitionClass.getFinalStandings(); dont need either
      // competitionClass.replaceJoinedInvestors(finalStanding);
      const resultsData = competitionClass.resultsData();
      const replaceConfig = {
        collection: collection,
        id: _id,
        data: { ...competitionClass.data, results: resultsData }, //important only want the data, not the rest of the class. Also adding the results prop forMongo
      };
      await replaceCommunityData(replaceConfig);
      await updateUserRecord(resultsData, competitionClass.amount);
      return { compId: _id, msg: "This Competition has been updated" };
    });
    const updatedCompetition = await Promise.all(finalBoard);
    res.send(updatedCompetition);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

async function updateUserRecord(rankingObj, competitionAmount) {
  const { winner, losers } = rankingObj;
  const keyName = "cashBalance";
  const collection = dBCollectionTypes.users;

  //delete winner.fundInPlay.tickers ?
  const winnerConfig = {
    id: winner.id,
    keyName,
    collection,
    amount: winner.finalBalance,
  };
  try {
    await updateUserArr(winner.id, "wins", [winner]);
    await incrementUserData(winnerConfig);
    const updateLosers = losers.map(async (loser, index) => {
      const negativeAmount = -competitionAmount;
      const loserConfig = {
        id: loser.id,
        keyName,
        collection,
        amount: negativeAmount,
      };
      await updateUserArr(loser.id, "losses", [loser]);
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
  const collection = dBCollectionTypes.users;
  try {
    const users = await getCommunityData(collection);
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
    const updatedUser = usersUpdated.flat().map(async (user) => {
      if (!user.updatedFunds.length) return;
      try {
        const updateUserFundConfig = {
          id: user.id, //checking if equal to
          arrName: "createdFunds",
          collection: dBCollectionTypes.users,
          data: [...user.updatedFunds],
        };
        console.log(updateUserFundConfig);
        await updateUserFunds(updateUserFundConfig);
        return `User ${user.id} funds were updated`;
      } catch (error) {
        console.log(error);
        return { error };
      }
    });
    const usersAreUpdated = await Promise.all(updatedUser);
    res.send(usersAreUpdated);
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});
router.post("/updateUsersBalance", async (req, res, err) => {
  const collection = dBCollectionTypes.users;
  try {
    const users = await getCommunityData(collection);
    const empireUsers = users.map(async (user, index) => {
      const { _id, firstName, hedgeFundName, cashBalance } = user;
      const empireUser = new Empire(
        _id,
        firstName,
        hedgeFundName,
        cashBalance,
        user
      );
      const totalBalance = empireUser.totalBalance();
      const userPrice = {
        value: totalBalance,
        timestamp: new Date(),
      };
      await updateUserArr(empireUser.id, "empireDailyPrice", [userPrice]);
      return { msg: `${firstName} price has been updated to ${totalBalance}` };
    });
    const allEmpireUsersUpdated = await Promise.all(empireUsers);
    res.send(allEmpireUsersUpdated);
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});

/////////////////////////////////////////////Nightly Routes Ends

router.post("/sellfund", async (req, res, err) => {
  const collection = dBCollectionTypes.users;
  console.log(`A sell fund request made by ${req.body.userId}`); //this works, just work on the front end
  const cashBalanceConfig = {
    id: req.body.userId,
    collection: collection,
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
      collection: collection,
      data: [...newUserCreatedFunds],
    };
    await updateUserFunds(updateUserFundConfig); //add new fundArr to user(overrides prior fundArr($set))
    await incrementUserData(cashBalanceConfig); //add money from teh fund to cash balance
    res.send(` ${req.body.userId}cash balance increased by ${req.body.amount}`);
    const setCommunityDataPropConfig = {
      fundId: req.body.fundId, //checking if equal to
      prop: "sold",
      collection: dBCollectionTypes.funds,
      data: true,
    };
    setCommunityDataProp(setCommunityDataPropConfig);
  } catch (error) {
    console.log(error);
    res.send(error);
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

//this is only ran periodically, basically, when a stock split happens,
router.post("/updatefundsDailyPrice", async (req, res, err) => {
  //return tickers with prices appened
  const collection = dBCollectionTypes.funds;

  try {
    const allFunds = await getCommunityData(collection);
    const allFundsMapped = allFunds.map(async (fund, index) => {
      const { tickers, createDate } = fund; //get ticker arr
      const updatedTickers = await appendDailyPrice(tickers, createDate); //updated tickers with current prices
      const updatedFund = {
        ...fund, //return the orginal fund, but replace the ticker proprtey with the newTickerArr
        tickers: updatedTickers,
        updatedDate: today,
      };
      updateFundPrice(collection, updatedFund); //find and replace mongo db(by _id)
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

//*Not in use for now, crpyto Prices intraday does not go back as far as stocks on 15min(because crypto is all day)
//30min almost goes back far enought, and horuly does, it just won't have as many data points for the chart on front end
//figure out how I will do this

/*router.post("/practiceCrypto", async (req, res, err) => {
  //console.log(`A sell fund request made by ${req.body.userId}`); //this works, just work on the front end
  try {
    const price = await getIntradayCrypto(req.body.symbol);
    res.send(price);
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});
router.post("/addCryptoprices", async (req, res, err) => {
  const symbols = req.body;
  //req.body has the competitionId and the userId(which is the creatorId)
  // console.log(req.body); //this works just need to match the payload from the front end
  try {
    const stocksPrices = symbols.map(async (symbol, index) => {
      const quote = await getCryptoQuote(symbol);
      const quoteObject = {
        symbol: quote.symbol,
        sharePrice: quote.sharePrice,
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

router.post("/addintradayCryptoprices", async (req, res, err) => {
  const symbols = req.body;
  console.log(symbols);
  const collection = "intraday_prices";
  try {
    const intradayPrices = symbols.map(async (symbol, index) => {
      console.log("yoo", symbol);
      ///get quote for each symbol and push into arr
      const intradayPrice = await getIntradayCrypto(symbol);
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
}); */

////////////////////////////////Test ROutes /////////////////////////////////////////////////////////
router.post("/practiceintra", async (req, res, err) => {
  const { symbol, startDate } = req.body;
  try {
    const intradayPrice = await getIntraday(symbol);
    const priceObject = getDatePrices(
      intradayPrice.prices.reverse(), //don't need to reverse api, comes newest to oldest
      startDate
    );
    console.log(priceObject);
    res.send(priceObject);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

router.post("/updatefundspractice", async (req, res, err) => {
  //return tickers with prices appened
  const collection = dBCollectionTypes.funds;

  try {
    const allFunds = await getCommunityData(collection);
    const allFundsMapped = allFunds.map(async (fund, index) => {
      const { tickers, createDate } = fund; //get ticker arr
      const updatedTickers = await appendDailyPrice(tickers, createDate); //updated tickers with current prices
      const updatedFund = {
        ...fund, //return the orginal fund, but replace the ticker proprtey with the newTickerArr
        tickers: updatedTickers,
        updatedDate: new Date(),
      };
      updateFundPrice(collection, updatedFund); //find and replace mongo db(by _id)
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

router.post("/marketonlyPrices", async (req, res, err) => {
  //return tickers with prices appened
  const symbols = req.body;
  let apiCalls = 0;
  try {
    const intradayPrices = symbols.map(async (symbol, index) => {
      ///get quote for each symbol and push into arr
      const intradayPrice = await getIntradayPractice(symbol);
      apiCalls = apiCalls + 1;
      const quoteObject = {
        ...intradayPrice,
        updated: new Date(),
      };
      return quoteObject;
    });
    const data = await Promise.all(intradayPrices);
    //get current price for today(update daily)
    res.send(data);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});
//////////////////////////////////Test Routes Ends///////////////////////////////////////////

module.exports = router;
