const express = require("express");
const { MongoClient, ObjectId } = require("mongodb"); //don't forget to add the .MongoClient or use destructing example {MongoClient} = require('mongodb');
const dotenv = require("dotenv").config();
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.lz4kl.mongodb.net/myFirstDatabaseretryWrites=true&w=majority`; //getting data for my cluster, will always be used. Used Atlas connect via driver.

const client = new MongoClient(uri, { useUnifiedTopology: true }); //initiating the MongoClient class, this will always be used
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
  findUserByIdPractice,
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

const { dBCollectionTypes } = require("./types");

const { Empire, Competition, User } = require("./classes");
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

router.delete("/bankrupt", async (req, res, err) => {
  const Not_Bankruput_Amount = 100000;
  const New_Money = 10000;
  const userId = req.body.id;
  try {
    const user = await findUserByIdPractice(userId);
    if (!user) return res.send({ message: "Try again", type: "fail" });
    const notBankrupt = isGreaterThan(Not_Bankruput_Amount, user.cashBalance);
    if (notBankrupt)
      return res.send({ message: "You have enough money", type: "fail" });
    const { createdFunds } = user;
    if (createdFunds && isGreaterThan(0, createdFunds.length)) {
      await sellAllUserFunds(createdFunds);
    }
    //await promise all above, i
    const cashBalanceConfig = {
      userId: userId,
      collection: dBCollectionTypes.practiceUsers,
      prop: "cashBalance",
      data: New_Money,
    };
    const updatedUser = await updateUser(cashBalanceConfig); //add money from teh fund to cash balance
    res.send(updatedUser);
  } catch (error) {
    console.log(error);
    //res.send(error);
  }
});

async function sellAllUserFunds(funds) {
  for (let i = 0; i < funds.length; i++) {
    const currentFund = funds[i];
    const setCommunityDataPropConfig = {
      fundId: currentFund._id, //sell all users funds
      prop: "sold",
      collection: dBCollectionTypes.practiceFunds,
      data: true,
    };
    setCommunityDataProp(setCommunityDataPropConfig);
  }
}

module.exports = router;
