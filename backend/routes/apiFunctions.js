const axios = require("axios");

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
  try {
    const intradayPrice = await alpha.data.intraday(
      symbol,
      "full",
      null,
      "15min"
    );
    const keyArr = Object.keys(intradayPrice["Time Series (15min)"]);
    const valueArr = Object.values(intradayPrice["Time Series (15min)"]);
    const prices = makePriceObj(keyArr, valueArr).reverse(); //make them oldest date to newst date
    const companyIntraday = {
      symbol: intradayPrice["Meta Data"]["2. Symbol"],
      prices,
    };
    return companyIntraday;
  } catch (error) {
    console.log({ errorMessage: "There was an error", error });
    return { errorMessage: "There was an error", error };
  }
}

async function getDaily(symbol) {
  try {
    const dailyPrices = await alpha.data.daily_adjusted(symbol); //only need compact for now, returns 100 data points which is good enough for this now, need to update to full in 5 months, Aug-Sep
    const keyArr = Object.keys(dailyPrices["Time Series (Daily)"]);
    const valueArr = Object.values(dailyPrices["Time Series (Daily)"]); //get daily price values, for daily, price values isan object with open, close etc
    const newValueArr = extractProperty(valueArr, ["4. close"]); //extract closing price from the values arr
    const prices = makePriceObj(keyArr, valueArr).reverse(); //make them oldest date to newst date
    const companyDaily = {
      symbol,
      prices,
    };
    return companyDaily;
  } catch (error) {
    console.log({ errorMessage: "There was an error", error });
    return { errorMessage: "There was an error", error };
  }
}

async function getCryptoQuote(symbol) {
  try {
    const companyQuote = await alpha.crypto.daily(symbol, "usd");
    const finalQuote = Object.values(
      companyQuote["Time Series (Digital Currency Daily)"]
    )[0]["4b. close (USD)"];
    return { symbol, sharePrice: parseFloat(finalQuote) };
  } catch (error) {
    console.log(error);
    return { errorMessage: "There was an error" };
  }
}

async function getIntradayCrypto(symbol) {
  //receiving error because of standard api key call frequnecy(5 calls per min), althoiugh I have premium key
  try {
    const request = await axios.get(
      `https://www.alphavantage.co/query?function=CRYPTO_INTRADAY&symbol=${symbol}&market=USD&interval=60min&outputsize=full&apikey=${process.env.Alpha_Key}`
    );

    const intradayPrice = await request.data;
    const keyArr = Object.keys(intradayPrice["Time Series Crypto (60min)"]);
    const valueArr = Object.values(intradayPrice["Time Series Crypto (60min)"]);
    const prices = makePriceObj(keyArr, valueArr).reverse();
    const companyIntraday = {
      symbol: intradayPrice["Meta Data"]["2. Digital Currency Code"],
      prices,
    };
    return companyIntraday;
  } catch (error) {
    console.log({ errorMessage: "There was an error", error });
    return { errorMessage: "There was an error", error };
  }
}

function extractProperty(array, property) {
  //map the property I need from the object.values array
  return array.map((item) => item[property]);
}

exports.getQuote = getQuote;
exports.getIntraday = getIntraday;
exports.getIntradayCrypto = getIntradayCrypto;
exports.getCryptoQuote = getCryptoQuote;
exports.getDaily = getDaily;

//When updating daily price periodically need to, really only need to do this if one of my stocks split
//1) Add all data to my db, then run function that updates allFUnds up to the date it was created
