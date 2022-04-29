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

  setCommunityDataProp,
  findUserByIdPractice,
} = require("./gainsMongoFunctions");
const {
  dBCollectionTypes,
  DbDocsPropsTypes,
  responseTypes,
} = require("./types");

const { myFunctions } = require("./backendMyFunctions");

const { isGreaterThan } = myFunctions;

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
    const updatedUser = await updateUser(cashBalanceConfig); //add money from teh fund to cash balance
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

module.exports = router;
