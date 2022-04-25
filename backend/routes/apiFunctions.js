const axios = require("axios");
const { isEqual, isAfter, getTime, add } = require("date-fns");

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

async function getIntradayPractice(symbol) {
  //oldintraday
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

async function getIntraday(symbol) {
  try {
    const intradayPrice = await alpha.data.intraday(
      symbol,
      "full",
      null,
      "15min"
    );
    const allDatesArr = []; //multidimensionalArr with prices for each day
    const keyArr = Object.keys(intradayPrice["Time Series (15min)"]);
    const valueArr = Object.values(intradayPrice["Time Series (15min)"]);
    const prices = makePriceObj(keyArr, valueArr).reverse(); //make them oldest date to newst date
    const splitByDayPrices = splitByDays(prices, allDatesArr);
    const marketTimes = splitByTime(splitByDayPrices);
    const companyIntraday = {
      symbol: intradayPrice["Meta Data"]["2. Symbol"],
      prices: marketTimes,
    };
    return companyIntraday;
  } catch (error) {
    console.log({ errorMessage: "There was an error", error });
    return { errorMessage: "There was an error", error };
  }
}

function returnLocalDate(date) {
  const currentDate = new Date(date);
  return new Date(currentDate.toLocaleDateString());
}

function returnCurrentDates(arr, currentDate) {
  const currentDateArr = [];
  let nextDate = null;
  for (let i = 0; i < arr.length; i++) {
    const stockPrice = arr[i];
    const stockTimeStamp = returnLocalDate(stockPrice.timestamp);
    if (isAfter(stockTimeStamp, currentDate)) {
      nextDate = stockTimeStamp; //if after then make that the next day
      break;
    } else currentDateArr.push(stockPrice);
  }
  return { currentDateArr, nextDate };
}

function deleteCurrentDatesPrices(arr, currentDate) {
  const clonedArr = [...arr]; //cloned
  for (let i = 0; i < arr.length; i++) {
    const stockPrice = arr[i];
    const stockTimeStamp = returnLocalDate(stockPrice.timestamp);
    if (isEqual(stockTimeStamp, currentDate)) {
      clonedArr.shift(); //if equal remove that el from the arr
    } else break; //once here I know i'am at the next date,
  }
  return clonedArr;
}

function splitByDays(arr, allDatesArr) {
  ////works, maybe write some test, after final array then need to compare if between 9-430
  const clonedArr = [...arr];
  //console.log(allDatesArr, "yessir");
  const currentDate = returnLocalDate(clonedArr[0].timestamp);
  const currentDates = returnCurrentDates(clonedArr, currentDate);
  if (currentDates.nextDate) {
    //if nextDay push currentPrices, then delete them, then rerun this function with newArr(after items deleted)
    allDatesArr.push(currentDates.currentDateArr); //if nextDay
    const newArr = deleteCurrentDatesPrices(clonedArr, currentDate);
    splitByDays(newArr, allDatesArr);
  }
  if (!currentDates.nextDate) allDatesArr.push(currentDates.currentDateArr); //if there's not nextDay(end of Arr), push the lastDates prices
  return allDatesArr;
}

/////////////////////////////Time//////////////////////////////////////////
function returnCurrentTimes(arr, start, end) {
  const timeWithinMarketArr = [];
  for (let i = 0; i < arr.length; i++) {
    const stockPrice = arr[i];
    const stockTimeStamp = new Date(stockPrice.timestamp);
    const stockTimeStampInMili = getTime(stockTimeStamp);
    if (isBetween(start, end, stockTimeStampInMili)) {
      timeWithinMarketArr.push(stockPrice);
      // nextDate = stockTimeStamp; //if after then make that the next day
    } else continue;
  }
  return timeWithinMarketArr;
}

function splitByTime(arr) {
  ////works, maybe write some test, after final array then need to compare if between 9-430
  const clonedArr = [...arr]; //multidimensionalArr with prices for each day
  const allDatesArr = [];
  const Minutes_Until_858AM = 538;
  const Minutes_Until_405PM = 965;
  clonedArr.forEach((dateArr, index) => {
    const currentDate = new Date(returnLocalDate(dateArr[0].timestamp)); //get local date and return date at 12am
    const startTime = getTime(
      //market start
      add(currentDate, {
        minutes: Minutes_Until_858AM,
      })
    );
    const endTime = getTime(
      //market end
      add(currentDate, {
        minutes: Minutes_Until_405PM,
      })
    );
    const currentDates = returnCurrentTimes(dateArr, startTime, endTime);
    allDatesArr.push(currentDates);
  });
  // console.log(allDatesArr.flat()); //flatten array so now just one
  return allDatesArr.flat();
}
function isBetween(greaterNumber, lessNumber, value) {
  if (value > greaterNumber && value < lessNumber) {
    return true;
  }
  return false;
}

//When updating daily price periodically need to, really only need to do this if one of my stocks split
//1) Add all data to my db, then run function that updates allFUnds up to the date it was created

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
exports.getIntradayPractice = getIntradayPractice;
