const { myFunctions } = require("./backendMyFunctions");
const { MongoClient, ObjectId } = require("mongodb"); //don't forget to add the .MongoClient or use destructing example {MongoClient} = require('mongodb');
const dotenv = require("dotenv").config();
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.lz4kl.mongodb.net/myFirstDatabaseretryWrites=true&w=majority`; //getting data for my cluster, will always be used. Used Atlas connect via driver.
const client = new MongoClient(uri, { useUnifiedTopology: true }); //initiating the MongoClient class, this will always be used

async function cloneCollection() {
  await client.connect();
  client
    .db("GainsAndLosses")
    .collection("competitions")
    .copyTo("backupCompetitions");
}
async function addUserToDbAppUsers(user) {
  let { email } = user;
  await client.connect();
  let database = client.db("GainsAndLosses").collection("users");
  let isDupe = await database.findOne({ email: email }); //find the user
  if (isDupe) {
    console.log("I am dup", isDupe);
    return false;
  } else {
    console.log("true");
    database.insertOne(user); //if not duplicate insert user to db and return true
    return true;
  }
}

//Login or Search function find user, user parameter will be username value
async function findUser(user) {
  await client.connect();
  let data = client
    .db("GainsAndLosses")
    .collection("users")
    .findOne({ email: user }, { newPassword: 0 }); //find the user by username
  return data; //if found data will be the object if not found will return null
}

async function findUserById(id) {
  id.toString(); //make it a string since mongo id's are strings
  let userId = new ObjectId(id); //have to import ObjectID from mongo require, then put the id as the parameter. This is how you check for ID match
  try {
    await client.connect();
    let data = client
      .db("GainsAndLosses")
      .collection("users")
      .findOne({ _id: userId }); //find the user by username
    return data; //if found data will be the object if not found will return null
  } catch (error) {
    console.log(error);
    return false;
  }
}

//find customers(not user) by ID and push in data to arrName
async function updateUserArr(id, arrName, data) {
  //  console.log("I am the data", data);
  id.toString(); //make it a string since mongo id's are strings
  let userId = new ObjectId(id); //have to import ObjectID from mongo require, then put the id as the parameter. This is how you check for ID match
  try {
    await client.connect();
    let updatedUser = client
      .db("GainsAndLosses")
      .collection("users")
      .findOneAndUpdate(
        { _id: userId },
        { $push: { [arrName]: { $each: [...data] } } },
        //   { upsert: true },
        { returnNewDocument: true }
      ); //find user by ID
    return updatedUser ? true : false; //if found data will be the object if not found will return null
  } catch (error) {
    console.log(error);
  }
}

async function updateUserArrPractice(id, arrName, data) {
  //  console.log("I am the data", data);
  id.toString(); //make it a string since mongo id's are strings
  let userId = new ObjectId(id); //have to import ObjectID from mongo require, then put the id as the parameter. This is how you check for ID match
  try {
    await client.connect();
    let updatedUser = client
      .db("GainsAndLosses")
      .collection("practiceUsers")
      .findOneAndUpdate(
        { _id: userId },
        { $push: { [arrName]: { $each: [...data] } } },
        // { upsert: true },
        { returnNewDocument: true }
      ); //find user by ID
    return updatedUser ? true : false; //if found data will be the object if not found will return null
  } catch (error) {
    console.log(error);
  }
}

async function updateUserFunds({ collection, id, arrName, data }) {
  //  console.log("I am the data", data);
  id.toString(); //make it a string since mongo id's are strings
  let userId = new ObjectId(id); //have to import ObjectID from mongo require, then put the id as the parameter. This is how you check for ID match

  try {
    await client.connect();
    let updatedUser = client
      .db("GainsAndLosses")
      .collection(collection)
      .findOneAndUpdate(
        { _id: userId },
        { $set: { [arrName]: [...data] } },
        //  { upsert: true }, //upsert makes it insert the fund to users if there are no users connected to fund, don't want that
        { returnNewDocument: true }
      ); //find user by ID
    return updatedUser ? true : false; //if found data will be the object if not found will return null
  } catch (error) {
    console.log(error);
  }
}

async function updateCommunityArr(collection, data) {
  // console.log("I am the data for the community", data);
  if (!data || !data.length)
    return { type: "fail", message: "Ooops There was nothing to add" };
  try {
    await client.connect();
    let updatedArr = client
      .db("GainsAndLosses")
      .collection(collection)
      .insertMany([...data]);
    return { type: "success", message: "Community Updated" };
  } catch (error) {
    console.log(error);
    return error;
  }
}

async function replaceCommunityData({ collection, data, id }) {
  // console.log("I am the data for the community", data);
  if (!data || !data.length)
    return { type: "fail", message: "Ooops There was nothing to add" };
  const query = { _id: ObjectId(id) };
  try {
    await client.connect();
    let updatedArr = client
      .db("GainsAndLosses")
      .collection(collection)
      .findOneAndReplace(query, data);
    return { type: "success", message: "Community Updated" };
  } catch (error) {
    console.log(error);
    return error;
  }
}

//updating user passing user and customer object. Destructured id from user below. Pushed customer object onto myCustomer user Array
async function addPropToCommunityData({ collection, data, id, prop }) {
  const query = { _id: ObjectId(id) };
  try {
    await client.connect(); //find user by id      //push customer object to array
    let dataBase = client
      .db("GainsAndLosses")
      .collection(collection)
      .findOneAndUpdate(
        query,
        { $set: { [prop]: data } },
        { returnNewDocument: true }
      );
    return dataBase ? true : null;
  } catch (error) {
    console.log(error);
    return error;
  }
}
///takes a config object with parameters as props. Adding user to a collections objects arrName
async function addUsertoCommunityArr({
  collection,
  competitionId,
  arrName,
  data,
}) {
  console.log(data);
  //console.log("I am the data", data);
  try {
    await client.connect();
    let updatedFundsArr = client
      .db("GainsAndLosses")
      .collection(collection)
      .findOneAndUpdate(
        { _id: ObjectId(competitionId) },
        { $push: { [arrName]: { $each: [...data] } } },
        { upsert: true }, //no upsert because if competition deleted will create a random momgoobject
        { returnNewDocument: true }
      ); //find user by ID
    return updatedFundsArr ? true : false; //if found data will be the object if not found will return null
  } catch (error) {
    console.log(error);
  }
}

//delete arr item that meets condition
async function deleteFromUserArr({ userId, arr, condition }) {
  try {
    await client.connect();
    let updatedUser = client
      .db("GainsAndLosses")
      .collection("users")
      .findOneAndUpdate(
        { _id: ObjectId(userId) }, //find user
        { $pull: { [arr]: { _id: condition } } } //the _id is the competitions _id.delete the arr item that meets teh condition
      );
    return updatedUser;
    //   db.profiles.updateOne( { _id: 1 }, { $pull: { votes: { $gte: 6 } } } )
  } catch (error) {
    console.log(error);
    return error;
  }
}

async function deleteFromUserArrNotId({
  userId,
  arr,
  conditionKey,
  condition,
}) {
  const query = { [conditionKey]: condition };
  try {
    await client.connect();
    let updatedUser = client
      .db("GainsAndLosses")
      .collection("users")
      .findOneAndUpdate(
        { _id: ObjectId(userId) }, //find user
        { $pull: { [arr]: query } } //the _id is the competitions _id.delete the arr item that meets teh condition
      );
    return updatedUser;
    //   db.profiles.updateOne( { _id: 1 }, { $pull: { votes: { $gte: 6 } } } )
  } catch (error) {
    console.log(error);
    return error;
  }
}

async function findData({ collection, id }) {
  try {
    await client.connect();
    let foundData = client
      .db("GainsAndLosses")
      .collection(collection)
      .findOne({ _id: ObjectId(id) }); //find user by ID
    return foundData ? foundData : null; //if found data will be the object if not found will return null
  } catch (error) {
    console.log(error);
  }
}

//updating user passing user and customer object. Destructured id from user below. Pushed customer object onto myCustomer user Array
async function updateUser({ collection, userId, prop, data }) {
  await client.connect(); //find user by id      //push customer object to array
  const mongoId = ObjectId(userId);
  const query = { _id: mongoId };
  let dataBase = client
    .db("GainsAndLosses")
    .collection(collection)
    .findOneAndUpdate(
      query,
      { $set: { [prop]: data } },
      { returnNewDocument: true }
    );
  return dataBase;
}

async function setCommunityDataProp({ collection, fundId, prop, data }) {
  await client.connect(); //find user by id      //push customer object to array
  const mongoId = ObjectId(fundId);
  const query = { _id: mongoId };
  let dataBase = client
    .db("GainsAndLosses")
    .collection(collection)
    .findOneAndUpdate(
      query,
      { $set: { [prop]: data } },
      { returnNewDocument: true }
    );
  return dataBase;
}

async function getPriceFromDb(collection, symbol) {
  await client.connect(); //find user by id      //push customer object to array
  let quoteInDb = client
    .db("GainsAndLosses")
    .collection(collection)
    .findOne({ symbol }); //find the user by username

  return quoteInDb ? quoteInDb : false;
}

async function updateFundPrice(collection, fund) {
  const fundId = fund._id;
  const query = { _id: ObjectId(fundId) };
  await client.connect(); //find user by id      //push customer object to array
  let isUpdatedFund = client
    .db("GainsAndLosses")
    .collection(collection)
    .findOneAndReplace(query, fund);
  return isUpdatedFund ? true : null;
}

async function updateCompetitionPrices(competition) {
  console.log(competition.length);
  const arr = [];
  try {
    await client.connect(); //find user by id      //push customer object to array
    for (i = 0; i < competition.length; i++) {
      const myCompetition = competition[i];
      const competitionId = myCompetition._id;
      const { title } = myCompetition;
      const query = { _id: ObjectId(competitionId) };
      console.log(competition);
      let isUpdatedFund = client
        .db("GainsAndLosses")
        .collection("competitions")
        .findOneAndReplace(query, myCompetition);
      await isUpdatedFund;
      arr.push(`${title} has been updated`);
    }
    return arr;
  } catch (error) {
    console.log("I caught the error", error);
    return error;
  }
}

async function deleteCollectionDocs(collection) {
  await client.connect(); //find user by id      //push customer object to array
  let deletedCollection = client
    .db("GainsAndLosses")
    .collection(collection)
    .deleteMany({});
  return deletedCollection;
}

async function sendtoDB(collection, data) {
  await client.connect(); //find user by id      //push customer object to array
  let deletedCollection = client
    .db("GainsAndLosses")
    .collection(collection)
    .insertMany([...data]);
  return deletedCollection;
}

async function getCommunityData(collection, skipAmount, limit) {
  console.log(typeof skipAmount);
  console.log(skipAmount);

  try {
    await client.connect();
    if (
      skipAmount !== null &&
      skipAmount !== undefined &&
      skipAmount !== false
    ) {
      let database = client
        .db("GainsAndLosses")
        .collection(collection)
        .find()
        .limit(limit ? limit : 5)
        .skip(skipAmount); //return the first 50 docuents;
      const customers = await database.toArray(); // make it an array(have to do this to get the objects)
      return customers;
    }
    // let database = await client.db('sample_analytics').collection('customers').find().limit(10); //return the first 10 docuents
    let database = client.db("GainsAndLosses").collection(collection).find();

    const customers = await database.toArray(); // make it an array(have to do this to get the objects)
    return customers;
  } catch (error) {
    console.log(error);
  }
}

async function getMyFunds(fundId) {
  const stringFundId = fundId.toString(); //convert mongoID to string
  const query = { _id: ObjectId(stringFundId) };
  try {
    await client.connect();
    // let database = await client.db('sample_analytics').collection('customers').find().limit(10); //return the first 10 docuents
    let database = client.db("GainsAndLosses").collection("funds").find(query);
    //.limit(1); //don't need to objectId,keep userId a string
    const myFunds = await database.toArray(); // make it an array(have to do this to get the objects)
    return myFunds;
  } catch (error) {}
}

//increments and ecrements(pass negative vaule to decrement)
async function incrementUserData({ id, keyName, collection, amount }) {
  id.toString(); //make it a string since mongo id's are strings
  const query = { _id: ObjectId(id) };
  const parsedAmount = parseFloat(amount);
  await client.connect();
  let updatedCustomer = client
    .db("GainsAndLosses")
    .collection(collection)
    .findOneAndUpdate(query, { $inc: { [keyName]: parsedAmount } }); //find customer by ID
  console.log("updated");
  return updatedCustomer;
}

//replacing user by ID. USerOBject is the replacement document, will also contain the id used for the filter document.
async function updateUserById(db, collection, userObject) {
  const id = userObject._id; //pulling out the id, do not need to use new OBject ID because I am passing in and already found mongoDB object.
  await client.connect();
  try {
    let updatingdUser = await client
      .db(db)
      .collection(collection)
      .replaceOne({ _id: id }, userObject); //repalce with userObject(parameter)
    const updatedUser = findUserByIdResuse("social_finance", "loggedUsers", id); // refind user
    return updatedUser;
  } catch (error) {
    console.log(error);
  }
}

//delete friend function passing ids
async function deleteFriend(db, collection, userId, friendId) {
  await client.connect();
  let userIdUpdated = new ObjectId(userId); //need to use these with id's
  let friendIdUpdated = new ObjectId(friendId);
  try {
    //pull is how you delete items from array. the array name in this case is myCustomers, and we're deleting and _id's that are === to friendId
    const updatedUser = client
      .db(db)
      .collection(collection)
      .updateOne(
        { _id: userIdUpdated },
        { $pull: { myCustomers: { _id: friendIdUpdated } } },
        { returnNewDocument: true }
      ); //findUser by ID and update users customerArray. Find object in customerArray by id
    console.log(updatedUser);
    return updatedUser;
  } catch (error) {
    console.log(error);
  }
}

exports.findUser = findUser;
exports.updateUser = updateUser;
exports.findUserById = findUserById;
exports.updateUserById = updateUserById;
exports.deleteFriend = deleteFriend;
exports.addUserToDbAppUsers = addUserToDbAppUsers;
exports.updateUserArr = updateUserArr;
exports.updateCommunityArr = updateCommunityArr;
exports.getCommunityData = getCommunityData;
exports.addUsertoCommunityArr = addUsertoCommunityArr;
exports.findData = findData;
exports.deleteFromUserArr = deleteFromUserArr;
exports.deleteCollectionDocs = deleteCollectionDocs;
exports.getPriceFromDb = getPriceFromDb;
exports.updateFundPrice = updateFundPrice;
exports.getMyFunds = getMyFunds;
exports.sendtoDB = sendtoDB;
exports.updateCompetitionPrices = updateCompetitionPrices;
exports.replaceCommunityData = replaceCommunityData;
exports.addPropToCommunityData = addPropToCommunityData;
exports.incrementUserData = incrementUserData;
exports.updateUserArrPractice = updateUserArrPractice;
exports.updateUserFunds = updateUserFunds;
exports.deleteFromUserArrNotId = deleteFromUserArrNotId;
exports.cloneCollection = cloneCollection;
exports.setCommunityDataProp = setCommunityDataProp;
