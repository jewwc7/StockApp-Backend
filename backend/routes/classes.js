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

exports.Empire = Empire;
