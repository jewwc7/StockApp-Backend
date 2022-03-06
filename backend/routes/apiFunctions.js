const { myFunctions } = require("./backendMyFunctions");
const alpha = require("alphavantage")({ key: `${process.env.Alpha_Key}` });
const { checkIfDupe, makePriceObj } = myFunctions;

async function getQuote(symbol) {
  try {
    const companyQuote = await alpha.data.quote(symbol);
    return companyQuote;
  } catch (error) {
    console.log(error);
    return { errorMessage: "There was an error" };
  }
}

async function getIntraday(symbol) {
  //receiving error because of standard api key call frequnecy(5 calls per min), althoiugh I have premium key
  try {
    const intradayPrice = await alpha.data.intraday(
      symbol,
      "full",
      null,
      "15min"
    );
    const keyArr = Object.keys(intradayPrice["Time Series (15min)"]);
    const valueArr = Object.values(intradayPrice["Time Series (15min)"]);
    const prices = makePriceObj(keyArr, valueArr).reverse();
    const companyIntraday = {
      symbol: intradayPrice["Meta Data"]["2. Symbol"],
      prices,
    };
    //  console.log(companyIntraday.prices[0]);
    return companyIntraday;
  } catch (error) {
    console.log({ errorMessage: "There was an error", error });
    return { errorMessage: "There was an error", error };
  }
}

exports.getQuote = getQuote;
exports.getIntraday = getIntraday;
