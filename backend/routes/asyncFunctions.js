const {
  deleteFriend,
  updateUserById,
  findUser,
  getCustomers,
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
} = require("./gainsMongoFunctions");
const { getQuote, getIntraday } = require("./apiFunctions");
const { isBefore } = require("date-fns");

async function appendTodaysPrice(arr) {
  const collection = "stock prices";
  const completeTickers = Promise.all(
    //always use Promise all when looping
    arr.map(async (element, index) => {
      const { symbol } = element;
      const percentOfFund = element.percentOfFund * 0.01;
      const quoteInDb = await getPriceFromDb(collection, symbol);
      if (quoteInDb) {
        //if quote in db return the shareprice
        let tickerPrice = parseFloat(quoteInDb.sharePrice).toFixed(2);
        return {
          ...element, //return the orginal element with the purchase price added. Will be the and stay the orginal investment of the fund
          purchasePrice: tickerPrice,
          currentPrice: tickerPrice, //will be updated each day
          amountPurchased: percentOfFund * 1000, //dollars of 1000
          shares: percentOfFund * parseFloat(quoteInDb.sharePrice).toFixed(2),
        };
      }
      const quote = await getQuote(symbol); //get quote
      let tickerPrice = parseFloat(quote["Global Quote"]["05. price"]).toFixed(
        2
      );
      return {
        //if quore not in db, make api call and reutrn the quote object
        ...element, //return the orginal element with the purchase price added. Will be the and stay the orginal investment of the fund
        purchasePrice: tickerPrice,
        currentPrice: tickerPrice, //will be updated each day
        amountPurchased: percentOfFund * 1000, //dollars of 1000
        shares: percentOfFund * tickerPrice,
      };
    })
  );
  return completeTickers;
}

async function appendCurrentPrice(arr) {
  const collection = "stock prices";

  const completeTickers = Promise.all(
    //always use Promise all when looping
    arr.map(async (element, index) => {
      const { symbol } = element;
      const quoteInDb = await getPriceFromDb(collection, symbol);
      if (quoteInDb) {
        //if quote in db return the shareprice
        console.log(quoteInDb);
        return {
          ...element, //return the orginal element with the purchase price added. Will be the and stay the orginal investment of the fund
          currentPrice: parseFloat(quoteInDb.sharePrice).toFixed(2),
        };
      }
      const quote = await getQuote(symbol); //get quote
      return {
        //if quore not in db, make api call and reutrn the quote object
        ...element, //return the orginal element with the purchase price added. Will be the and stay the orginal investment of the fund
        currentPrice: parseFloat(quote["Global Quote"]["05. price"]).toFixed(2),
      };
    })
  );
  return completeTickers;
}

async function appendIntraDayPrice({ startDate, arr }) {
  function getDatePrices(priceArr, dateChecking) {
    if (!Array.isArray(priceArr)) throw new Error("Must pass an Array");
    const startDate = new Date(dateChecking);
    const pricesWithinStartDate = [];
    const { length } = priceArr;
    console.log(length);
    for (let i = 0; i < length; i++) {
      const dateObject = priceArr[i];
      const dateOfPrice = new Date(dateObject.timestamp);
      if (isBefore(startDate, dateOfPrice)) {
        console.log("Im breaking here", dateObject);
        break;
      }
      pricesWithinStartDate.push(dateObject); //keep loop going, no returns
    }
    return [...pricesWithinStartDate].reverse();
  }
  const collection = "intraday_prices";
  const updatedInvestors = []; //array where the updated joinedinestors will be pushed
  const updatingInvestors = arr.map(async (investor, index) => {
    console.log(investor.name);
    const { fundInPlay } = investor;
    const newTickerArr = fundInPlay.tickers.map(async (ticker) => {
      try {
        //search mongo
        if (!ticker || !ticker.symbol) return; //can delete
        const { symbol } = ticker;
        const priceInDb = await getPriceFromDb(collection, symbol);
        await priceInDb;
        // console.log(priceInDb);
        if (priceInDb) {
          const priceObject = getDatePrices(
            priceInDb.prices.reverse(),
            startDate
          );
          const updatedTicker = {
            ...ticker, //return the orginal element with the new ticker price added. Will be the and stay the orginal investment of the fund
            tickerprices: {
              symbol,
              prices: priceObject,
            },
          };
          //if quote in db return the intradayprices
          return updatedTicker;
        } else {
          //call API
          const intradayPrice = await getIntraday(symbol);
          const priceObject = getDatePrices(
            intradayPrice.prices.reverse(),
            startDate
          );
          const updatedTicker = {
            ...ticker, //return the orginal element with the new ticker price added. Will be the and stay the orginal investment of the fund
            tickerprices: {
              symbol,
              prices: priceObject,
            },
          };
          //    console.log(updatedTicker);
          return updatedTicker;
        }
      } catch (error) {
        console.log(error);
      }
    });
    const tickersAreUpdated = await Promise.all(newTickerArr); //this is how you await an array of promises, ususful when running a promise within a promise
    const updatedObj = {
      ///update the investorObj
      ...investor, //return the orginal obj with the tickers updated
      fundInPlay: {
        ...fundInPlay,
        tickers: tickersAreUpdated, //
      },
    };
    return updatedInvestors.push(updatedObj);
  });
  await Promise.all(updatingInvestors); //important, wait for the promises to resolve. updatinginvestors is a Prmoise.All map
  return updatedInvestors;
}

exports.appendTodaysPrice = appendTodaysPrice;
exports.appendCurrentPrice = appendCurrentPrice;
exports.appendIntraDayPrice = appendIntraDayPrice;
