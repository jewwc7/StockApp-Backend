const { isBefore, getDay, isEqual, isAfter } = require("date-fns");

const myFunctions = {
  add: function (a, b) {
    return a + b;
  },
  createUniqueArr: function (array, property, map) {
    if (!property) return Array.from(new Set([...array]));
    if (property) {
      const newArray = array.map((item) => item[property]);
      return Array.from(new Set([...newArray]));
    }
  },
  filterArrEquality: function ({ array, filteredProperty, comparison }) {
    const filteredArray = array.filter(
      (item) => item[filteredProperty] === comparison
    );
    return filteredArray;
  },
  filterArrNonEquality: function ({ array, filteredProperty, comparison }) {
    const filteredArray = array.filter(
      (item) => item[filteredProperty] !== comparison
    );
    return filteredArray;
  },
  sortArr: function (array, property, direction) {
    if (direction === "descending") {
      const sortedArr = array.sort((a, b) => a[property] - b[property]);
      return sortedArr.reverse();
    }
    const sortedArr = array.sort((a, b) => a[property] - b[property]);
    return sortedArr;
  },
  hasObjectKey: function (object = {}, key) {
    //boolean
    return object.hasOwnProperty(key) ? true : false;
  },
  isGreaterThan: function (comparison = 0, object = 0) {
    //boolean
    return object > comparison ? true : false;
  },
  isLessThan: function (comparison = 0, object = 0) {
    //boolean

    return object < comparison ? true : false;
  },
  isEqualTo: function (comparison = 0, object = 0) {
    //boolean
    return object === comparison ? true : false;
  },
  getRandomArrItem: function (array) {
    return array[Math.floor(Math.random() * array.length)];
  }, //remember 0 will return false. use different function if checking for numbers
  isTrue: function (objectChecking, ifTrue, ifFalse) {
    return objectChecking ? ifTrue : ifFalse;
  },
  checkIfDupe: function (arr, condition) {
    if (arr.includes(condition)) return true;
    return false;
  },
  getRandomNumber: function (number) {
    const numberToMultiply = number || 1000000;
    const randomNumber = Math.floor(Math.random() * numberToMultiply);
    return randomNumber;
  },

  makePriceObj: function (keyArr, valueArr) {
    //works with intraday prices, format object for the chart on the front end
    const finalArr = valueArr.map((value, index) => {
      return {
        value: parseFloat(value["4. close"]),
        timestamp: keyArr[index], //match timestamp with the closing price
      };
    });
    return finalArr;
  },
  getPercentChange: function (initialInvestment, currentValue) {
    const percentChange =
      ((currentValue - initialInvestment) / initialInvestment) * 100;
    return +percentChange.toFixed(2);
  },
  isDateBefore: function (dateChecking, comparisonDate) {
    const todayOne = new Date(dateChecking);
    const comparisonDateOne = new Date(comparisonDate);
    const localTOday = todayOne.toLocaleDateString();
    const localComparison = comparisonDateOne.toLocaleDateString();
    console.log([localTOday, localComparison]);
    return comparisonDateOne < todayOne;
  },
  getDatePrices: function (priceArr, dateChecking) {
    //based on Start Date, array should be from newst date to oldes date
    if (!Array.isArray(priceArr)) throw new Error("Must pass an Array");
    const startDate = new Date(dateChecking);
    const pricesWithinStartDate = [];
    const { length } = priceArr;
    for (let i = 0; i < length; i++) {
      const dateObject = priceArr[i];
      const dateOfPrice = new Date(dateObject.timestamp);
      if (!isBefore(startDate, dateOfPrice)) {
        //if false that ddate ofPrice before keep going, if it's true, return
        break;
      }
      pricesWithinStartDate.push(dateObject); //keep loop going, no returns
    }
    return [...pricesWithinStartDate].reverse();
  },
  getEachDayReturns: function (investorArr) {
    if (!Array.isArray(investorArr) || !investorArr.length) return [0];
    let sum = []; //first array
    function checkArrNumber(arrNumber, index) {
      if (arrNumber > 0) {
        let previousValue = sum[index] ? sum[index].value : false;
        return previousValue;
      } else {
        let previousValue = sum[index] ? sum[index].value || 0 : 0; //check if there is anything at index and if so checkes if it has value
        return previousValue;
        //if no value property return value of the last added obj. If nothing at index return 0. Needed when lengths of array differs
      }
    }
    //need to sort array from lowest length to highest, so array with more data(higher length) that data can be removed as it messes up the cart figures
    const sortedInvestorArr = investorArr
      .sort(function (a, b) {
        return b.length - a.length;
      })
      .reverse();
    sortedInvestorArr.forEach((arr, arrNumber) => {
      arr.forEach((item, index) => {
        const { timestamp } = item;
        const priorValue = checkArrNumber(arrNumber, index);
        if (priorValue === false) {
          const { length } = sum;
          let obj = {
            ...sum[length - 1],
          };
          sum[index] = obj; //make new index equal to last
          return;
        }
        let obj = {
          timestamp,
          value: item.value + priorValue,
        };
        sum[index] = obj;
        return;
      });
    });
    return sum;
  },
  deleteTickerPrices: function (obj = {}) {
    if (!Object.keys(obj)) {
      console.log("must pass an object");
      return;
    }
    obj.tickers.forEach((ticker) => {
      if (!ticker.tickerprices || !ticker.tickerprices.prices) return;
      ticker.tickerprices.prices.length = 0;
    });
  },
  checkIfSundayOrMonday: function () {
    const result = getDay(new Date());
    if (result === 0) return 2; //if 0(sunday) subtract 2 days(to getFridays data)
    if (result === 1) return 3; //if 1(mondday) subtract 3days(to getFridays data)
    return 1; //all other days just subtract one
  },
  getCompetitionReturns: function (
    percentOfFund,
    portfolioTotal,
    intradayPrices
  ) {
    const stockPrices = [...intradayPrices];
    const startDate = stockPrices[0].timestamp;

    let initalInvestment = (percentOfFund * portfolioTotal) / 100; //dollar amount invested
    const myReturns = [{ value: initalInvestment, timestamp: startDate }]; //starting prcie needs to be intital dollar amount invested
    //snend to be an object and time stamp should be start of bet
    //push each dollar return into myReturns array, so can display on chart
    stockPrices.forEach((price, index) => {
      const { value, timestamp } = price;
      if (index === 0) {
        //if at start compare index 0 and 1
        const secondPrice = stockPrices[index + 1].value;
        initalInvestment = initalInvestment * (secondPrice / value);
        return myReturns.push({ value: initalInvestment, timestamp });
      }
      if (index === 1) return; //don't need to compare index 1 as above code does it
      const priorPrice = stockPrices[index - 1].value; //chaining, because at index 0 -1, there is not value(-1)
      initalInvestment = initalInvestment * (value / priorPrice); //else stock went up are stayed flat
      return myReturns.push({ value: initalInvestment, timestamp });
    });
    return myReturns;
  },
  hasStarted: function (dateChecking) {
    const today = new Date();
    const start = new Date(dateChecking);
    if (isEqual(today, start) || isAfter(today, start)) {
      return true;
    }
    return false;
  },
};

const dummyArr = [
  { name: "josh", age: 15 },
  { name: "wasington", age: 15 },
  { name: "juwan", age: 15 },
  { name: "chris", age: 15 },
  { name: "josh", age: 15 },
];

exports.myFunctions = myFunctions;
