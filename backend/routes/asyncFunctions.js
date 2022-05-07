const axios = require("axios");
const { getPriceFromDb } = require("./gainsMongoFunctions");
const { getQuote, getIntraday, getDaily } = require("./apiFunctions");
const { myFunctions } = require("./backendMyFunctions");
const { isBefore } = require("date-fns");
const { getDatePrices } = myFunctions;

///used when fund first created
async function appendTodaysPrice(arr) {
  const collection = "stock prices";
  const completeTickers = Promise.all(
    //always use Promise all when looping
    arr.map(async (element, index) => {
      const { symbol } = element;
      console.log("append today pircies", element);
      const percentOfFund = element.percentOfFund * 0.01;
      const quoteInDb = await getPriceFromDb(collection, symbol);
      if (quoteInDb) {
        //if quote in db return the shareprice
        let tickerPrice = parseFloat(quoteInDb.sharePrice).toFixed(2);
        const tickerPriceObj = {
          value: tickerPrice,
          timestamp: new Date(),
        };
        console.log("append today pircies", tickerPriceObj);

        return {
          ...element, //return the orginal element with the purchase price added. Will be the and stay the orginal investment of the fund
          purchasePrice: tickerPrice,
          currentPrice: tickerPrice, //will be updated each day
          amountPurchased: percentOfFund * 1000, //dollars of 1000
          tickerprices: {
            symbol,
            prices: [tickerPriceObj],
          },
        };
      }
      const quote = await getQuote(symbol); //get quote
      let tickerPrice = parseFloat(quote["Global Quote"]["05. price"]).toFixed(
        2
      );
      const tickerPriceObj = {
        value: tickerPrice,
        timestamp: new Date(),
      };
      return {
        //if quore not in db, make api call and reutrn the quote object
        ...element, //return the orginal element with the purchase price added. Will be the and stay the orginal investment of the fund
        purchasePrice: tickerPrice,
        currentPrice: tickerPrice, //will be updated each day
        amountPurchased: percentOfFund * 1000, //dollars of 1000
        tickerprices: {
          symbol,
          prices: [tickerPriceObj],
        },
      };
    })
  );
  return completeTickers;
}

//used on nighgtly update of funds
async function appendCurrentPrice(arr) {
  const collection = "stock prices";
  const completeTickers = Promise.all(
    //always use Promise all when looping
    arr.map(async (element, index) => {
      const { symbol } = element;
      const quoteInDb = await getPriceFromDb(collection, symbol);
      if (quoteInDb) {
        //if quote in db return the shareprice
        // console.log(quoteInDb);
        const currentPrice = parseFloat(quoteInDb.sharePrice).toFixed(2);
        const currentPriceObj = {
          value: currentPrice,
          timestamp: new Date(),
        };
        const hasTickerPrices = element.tickerprices
          ? element.tickerprices.prices
          : [];
        return {
          ...element, //return the orginal element with the purchase price added. Will be the and stay the orginal investment of the fund
          currentPrice,
          tickerprices: {
            symbol,
            prices: [...hasTickerPrices, currentPriceObj],
          },
        };
      }
      const apiQuote = await getQuote(symbol); //get quote
      const currentPrice = parseFloat(
        apiQuote["Global Quote"]["05. price"]
      ).toFixed(2);
      const currentPriceObj = {
        value: currentPrice,
        timestamp: new Date(),
      };
      const hasTickerPrices = element.tickerprices
        ? element.tickerprices.prices
        : [];
      return {
        //if quore not in db, make api call and reutrn the quote object
        ...element, //return the orginal element with the purchase price added. Will be the and stay the orginal investment of the fund
        currentPrice,
        tickerprices: {
          symbol,
          prices: [...hasTickerPrices, currentPriceObj],
        },
      };
    })
  );
  return completeTickers;
}

//used periodically to append daily prices to funds
async function appendDailyPrice(arr, createDate) {
  const completeTickers = Promise.all(
    arr.map(async (element, index) => {
      const { symbol } = element;
      const apiDaily = await getDaily(symbol); //get quote
      const { prices } = apiDaily;
      const pricesWithinCreateDate = getDatePrices(
        prices.reverse(),
        createDate
      ); //need to reverse so newest to oldest
      // const hasTickerPrices = element.tickerprices.prices || [];
      return {
        //if quore not in db, make api call and reutrn the quote object
        ...element, //return the orginal element with the purchase price added. Will be the and stay the orginal investment of the fund
        tickerprices: {
          symbol,
          prices: [...pricesWithinCreateDate],
        },
      };
    })
  );
  return completeTickers;
}
//appending based on start date, pricesinDB need reverse, api prices do not as getIntraDay function reverses it
async function appendIntraDayPrice({ startDate, arr }) {
  const collection = "intraday_prices";
  const updatedInvestors = []; //array where the updated joinedinestors will be pushed
  const updatingInvestors = arr.map(async (investor, index) => {
    const { fundInPlay } = investor;
    const newTickerArr = fundInPlay.tickers.map(async (ticker) => {
      try {
        //search mongo
        const { symbol } = ticker;
        const priceInDb = await getPriceFromDb(collection, symbol);
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

async function getCompanyOverView(symbol) {
  const companyOverviewReq = await axios.get(
    `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${process.env.Alpha_Key}`
  );
  return companyOverviewReq.data;
}

exports.appendTodaysPrice = appendTodaysPrice;
exports.appendCurrentPrice = appendCurrentPrice;
exports.appendIntraDayPrice = appendIntraDayPrice;
exports.getCompanyOverView = getCompanyOverView;
exports.appendDailyPrice = appendDailyPrice;
