////////////////////Adding Names of stocks to funds, shouldn;t need to do this anymore

router.put("/stocknames", async (req, res, err) => {
  const allStocks = await getCommunityData(dBCollectionTypes.defaultStocks);
  const allFunds = await getCommunityData(dBCollectionTypes.funds);
  const stockSymbolNamesArr = mapStockSymbolNames(allStocks);
  //allStocks-returns arr
  allFunds.forEach((fund) => {
    //allFunds
    const fundId = fund._id;
    const newTickerArr = [];
    fund.tickers.forEach((ticker) => {
      const foundName = stockSymbolNamesArr.find(
        (stock) => stock.symbol.toLowerCase() === ticker.symbol.toLowerCase()
      );
      if (!foundName) return newTickerArr.push(ticker); //if not found push the orginal tickerInfo

      const newTicker = {
        ...ticker,
        companyName: foundName.companyName,
      };
      newTickerArr.push(newTicker);
    });
    const newFund = {
      ...fund,
      tickers: [...newTickerArr],
    };
    const replaceConfig = {
      id: fundId,
      collection: dBCollectionTypes.funds,
      newObject: newFund,
    };
    replaceObjectById(replaceConfig);
  });
  res.send("yes");
});

function mapStockSymbolNames(arr) {
    //get Deafault stocks
    const stockArr = [];
    arr.forEach((stock) => {
      const { Symbol } = stock;
      const { Name } = stock.companyOverview;
      const finalObject = {
        symbol: Symbol,
        companyName: Name,
      };
      stockArr.push(finalObject);
    });
    return stockArr;
  }
  //////////////////////////////////////////////
