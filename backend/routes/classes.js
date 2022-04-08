const { myFunctions } = require("./backendMyFunctions");
const {
  checkIfDupe,
  makePriceObj,
  isEqualTo,
  isGreaterThan,
  getEachDayReturns,

  getPercentChange,
  sortArr,
  isDateBefore,
} = myFunctions;
const bcrypt = require("bcryptjs");
const { addUserToDbAppUsers, findUser } = require("./gainsMongoFunctions");
const { isBefore, isEqual, parseISO, isAfter } = require("date-fns");
const saltRounds = 10;

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
    const today = new Date(); //want to return false if hasnt ended, return true
    const endDate = new Date(this.ends);
    return isBefore(endDate, today); //works on saturdays becuase it compares the time as well, my end dates are all at 12am Saturday, so any time after 1230 works
  }
  getFinalStandings() {
    const updateInvestorWithTotal = getWinner(
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
function getWinner(investorArr, amount) {
  const newJoinedInvestors = investorArr.map((investor, index) => {
    const { userId, name, image, fundInPlay } = investor;
    const myInvestor = new CompetitionUser(
      userId,
      name,
      image,
      amount,
      fundInPlay
    );
    const currentInvestmentValue = myInvestor.currentInvestmentValue(); //get last value of arr(represent the final value)
    return { userId, finalBalance: currentInvestmentValue };
  });
  return newJoinedInvestors;
}

///////////////////////////competition functions

class User {
  constructor(id, email, password, data) {
    (this.id = id),
      (this.email = email),
      (this.password = password),
      (this.data = data);
    this.accountCreateDate = new Date();
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
