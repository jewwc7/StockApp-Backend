const { myFunctions } = require("./backendMyFunctions");
const { MongoClient, ObjectId } = require("mongodb"); //don't forget to add the .MongoClient or use destructing example {MongoClient} = require('mongodb');
const dotenv = require("dotenv").config();
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.lz4kl.mongodb.net/test?retryWrites=true&w=majority`; //getting data for my cluster, will always be used. Used Atlas connect via driver.
const client = new MongoClient(uri, { useUnifiedTopology: true }); //initiating the MongoClient class, this will always be used
const alpha = require("alphavantage")({ key: `${process.env.Alpha_Key}` });
async function getQuote(symbol) {
  const companyQuote = await alpha.data.quote(symbol);
  return companyQuote;
}

console.log(dotenv);

exports.getQuote = getQuote;
