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
    console.log([todayOne, comparisonDateOne]);
    return comparisonDateOne < todayOne;
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
