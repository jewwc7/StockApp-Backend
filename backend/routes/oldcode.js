router.post("/updatecompetitionfunds", async (req, res, err) => {
  //return tickers with prices appened
  try {
    const allCompetitions = await getCommunityData("practiceCompetition"); //get competiitons and dstructure each fund from the joined investor arr
    const mappedCompetitions = allCompetitions.map(
      async (competition, index) => {
        const { joinedInvestors, starts, ends } = competition; //get ticker arr
        const today = new Date();
        console.log(competition.name, competition.title);
        console.log(isBefore(today, starts)); //if today is before start date, don't get prices
        console.log(isAfter(today, ends)); //if today is after the ends date don't get price
        console.log(isEqual(today, ends)); //if today is after the ends date don't get price
        const updatedInvestors = await appendIntraDayPrice({
          startDate: starts,
          arr: joinedInvestors,
        }); //updated tickers with current prices
        const updatedCompetition = {
          ...competition, //return the orginal fund(), but replace the ticker proprtey with the newTickerArr
          joinedInvestors: updatedInvestors,
          updatedDate: today,
        };
        return updatedCompetition;
      }
    );
    const updatedCompetition = await Promise.all(mappedCompetitions);
    console.log(updatedCompetition);
    const updateSuccessful = await updateCompetitionPrices([
      ...updatedCompetition,
    ]); //find and replace mongo db(by _id)
    res.send(updateSuccessful);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});
