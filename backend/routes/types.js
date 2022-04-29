const dBCollectionTypes = {
  users: "users",
  stockPrices: "stock prices",
  defaultStocks: "default_stocks",
  competitions: "competitions",
  funds: "funds",
  intraDayPrices: "intraday_prices",
  practiceCompetition: "practiceCompetition",
  practiceDB: "practiceDb",
  practiceFunds: "practiceFunds",
  practiceUsers: "practiceUsers",
  tweets: "tweets",
  backUpCompetitions: "backupCompetitions",
};

const responseTypes = {
  error: "error",
  success: "success",
  fail: "fail",
};

const DbDocsPropsTypes = {
  createdFunds: "createdFunds",
  cashBalance: "cashBalance",
  fail: "fail",
};

exports.dBCollectionTypes = dBCollectionTypes;
exports.responseTypes = responseTypes;
exports.DbDocsPropsTypes = DbDocsPropsTypes;
