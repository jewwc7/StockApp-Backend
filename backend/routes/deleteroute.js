const express = require("express");
const dotenv = require("dotenv").config();
let router = express.Router();
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
  deleteCollectionDocs,
  setCommunityDataProp,
  findUserByIdPractice,
  getCommunityData,
  deleteById,
} = require("./gainsMongoFunctions");
const {
  dBCollectionTypes,
  DbDocsPropsTypes,
  responseTypes,
} = require("./types");

const { myFunctions } = require("./backendMyFunctions");
const { differenceInDays } = require("date-fns");

const { isGreaterThan, isLessThan, hasStarted } = myFunctions;
const tryAgainResponse = {
  type: responseTypes.error,
  message: "Something went wrong try again",
};

router.delete("/bankrupt", async (req, res, err) => {
  const Not_Bankruput_Amount = 9999;
  const New_Money = 10000;
  const userId = req.body.id;
  const tryAgainMsg = {
    message: "Try again",
    type: responseTypes.fail,
  };
  const enoughMoneyMsg = {
    message: "You have enough money",
    type: responseTypes.fail,
  };
  try {
    const user = await findUserById(userId);
    if (!user) return res.send(tryAgainMsg);
    const notBankrupt = isGreaterThan(Not_Bankruput_Amount, user.cashBalance);
    if (notBankrupt) return res.send(enoughMoneyMsg);
    const { createdFunds } = user;
    if (createdFunds && isGreaterThan(0, createdFunds.length)) {
      await sellAllUserFunds(createdFunds);
    }
    //await promise all above, i
    const cashBalanceConfig = {
      userId: userId,
      collection: dBCollectionTypes.users,
      prop: DbDocsPropsTypes.cashBalance,
      data: New_Money,
    };
    const emptyArrConfig = {
      userId: userId,
      collection: dBCollectionTypes.users,
      prop: DbDocsPropsTypes.createdFunds,
      data: [],
    };
    await updateUser(emptyArrConfig); //empty createdFundsArr
    await updateUser(cashBalanceConfig); //add money from teh fund to cash balance
    res.send("sucess"); //does not control anything, success msg is on front end
  } catch (error) {
    console.log(error);
    res.send(tryAgainMsg);
  }
});

async function sellAllUserFunds(funds) {
  for (let i = 0; i < funds.length; i++) {
    const currentFund = funds[i];
    const setCommunityDataPropConfig = {
      fundId: currentFund._id, //sell all users funds
      prop: "sold",
      collection: dBCollectionTypes.funds,
      data: true,
    };
    setCommunityDataProp(setCommunityDataPropConfig);
  }
}

router.delete("/stockprices", async (req, res, err) => {
  try {
    const deletedDocs = await deleteCollectionDocs(
      dBCollectionTypes.stockPrices
    ); //delete prior data
    res.send(deletedDocs);
  } catch (error) {
    console.log(error);
    res.send(tryAgainResponse);
  }
});

router.delete("/defaultstocks", async (req, res, err) => {
  try {
    const deletedDocs = await deleteCollectionDocs(
      dBCollectionTypes.defaultStocks
    ); //delete prior data
    res.send(deletedDocs);
  } catch (error) {
    console.log(error);
    res.send(tryAgainResponse);
  }
});

router.delete("/dailyPrices", async (req, res, err) => {
  try {
    const deletedDocs = await deleteCollectionDocs(
      dBCollectionTypes.dailyPrices
    ); //delete prior data
    res.send(deletedDocs);
  } catch (error) {
    console.log(error);
    res.send(tryAgainResponse);
  }
});
router.delete("/intraday", async (req, res, err) => {
  try {
    const deletedDocs = await deleteCollectionDocs(
      dBCollectionTypes.intraDayPrices
    ); //delete prior data
    res.send(deletedDocs);
  } catch (error) {
    console.log(error);
    res.send(tryAgainResponse);
  }
});

//delete old comps
router.delete("/competitions", async (req, res, err) => {
  try {
    const oldCompetitionsArr = [];
    const competitions = await getCommunityData(dBCollectionTypes.competitions);
    for (let index = 0; index < competitions.length; index++) {
      const competition = competitions[index];
      const { ends, _id } = competition;
      const parsedEnds = new Date(ends);
      const today = new Date();
      console.log(differenceInDays(parsedEnds, today));
      if (isGreaterThan(6, differenceInDays(today, parsedEnds)))
        //week passed
        oldCompetitionsArr.push(_id);
    }
    oldCompetitionsArr.map(async (_id) => {
      const deleteConfig = {
        id: _id,
        collection: dBCollectionTypes.competitions,
      };
      await deleteById(deleteConfig);
    });
    const deletedComps = await Promise.all(oldCompetitionsArr);
    res.send(deletedComps);
  } catch (error) {
    console.log(error);
    res.send(tryAgainResponse);
  }
});

//delete comps wth only one investor
router.delete("/singleplayercomp", async (req, res, err) => {
  try {
    const singleInvestorArr = [];
    const competitions = await getCommunityData(dBCollectionTypes.competitions);
    for (let index = 0; index < competitions.length; index++) {
      const competition = competitions[index];
      const { starts, joinedInvestors, _id } = competition;
      const betStarted = hasStarted(starts);
      const hasOneInvestor = isLessThan(2, joinedInvestors.length);
      if (betStarted && hasOneInvestor) singleInvestorArr.push(_id);
    }
    singleInvestorArr.map(async (_id) => {
      const deleteConfig = {
        id: _id,
        collection: dBCollectionTypes.competitions,
      };
      await deleteById(deleteConfig);
    });
    const deletedComps = await Promise.all(singleInvestorArr);
    res.send(deletedComps);
  } catch (error) {
    console.log(error);
    res.send(tryAgainResponse);
  }
});

module.exports = router;
