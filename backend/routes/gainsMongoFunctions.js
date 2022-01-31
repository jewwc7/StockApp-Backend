const { myFunctions } = require("./backendMyFunctions");
const { MongoClient, ObjectId } = require("mongodb"); //don't forget to add the .MongoClient or use destructing example {MongoClient} = require('mongodb');
const dotenv = require("dotenv").config();
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.lz4kl.mongodb.net/test?retryWrites=true&w=majority`; //getting data for my cluster, will always be used. Used Atlas connect via driver.
const client = new MongoClient(uri, { useUnifiedTopology: true }); //initiating the MongoClient class, this will always be used
async function addUserToDb(user) {
  let { username } = user; //
  await client.connect();
  let database = client.db("social_finance").collection("loggedUsers");
  let isDupe = await database.findOne({ username: username }); //find the user
  console.log(isDupe);
  if (isDupe) {
    //if it is duplicate return false
    return false;
  } else {
    console.log("true");
    database.insertOne(user); //if not duplicate insert user to db and return true
    return true;
  }
}

async function addUserToDbAppUsers(user) {
  let { name } = user; //
  await client.connect();
  let database = client.db("GainsAndLosses").collection("users");
  let isDupe = await database.findOne({ name: name }); //find the user
  console.log(isDupe);
  if (isDupe) {
    return "THis is a duplicate";
  } else {
    console.log("true");
    database.insertOne(user); //if not duplicate insert user to db and return true
    return "Succesfully Added";
  }
}

//Login or Search function find user, user parameter will be username value
async function findUser(user) {
  await client.connect();
  let data = client
    .db("GainsAndLosses")
    .collection("users")
    .findOne({ name: user }); //find the user by username
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
        { upsert: true },
        { returnNewDocument: true }
      ); //find user by ID
    return updatedUser ? true : false; //if found data will be the object if not found will return null
  } catch (error) {
    console.log(error);
  }
}

async function updateCommunityArr(collection, data) {
  let count = 0;
  console.log(data);
  //console.log("I am the data", data);
  try {
    await client.connect();
    let updatedFundsArr = client
      .db("GainsAndLosses")
      .collection(collection)
      .insertMany([...data]);
    count++;
    console.error(count);
    return updatedFundsArr ? true : false; //if found data will be the object if not found will return null
  } catch (error) {
    console.log(error);
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
        { _id: competitionId },
        { $push: { [arrName]: { $each: [...data] } } },
        //   { upsert: true }, //no upsert because if competition deleted will create a random momgoobject
        { returnNewDocument: true }
      ); //find user by ID
    return updatedFundsArr ? true : false; //if found data will be the object if not found will return null
  } catch (error) {
    console.log(error);
  }
}
async function findData({ collection, id }) {
  try {
    await client.connect();
    let foundData = client
      .db("GainsAndLosses")
      .collection(collection)
      .findOne({ _id: ObjectId(id) }); //find user by ID
    return foundData ? foundData : false; //if found data will be the object if not found will return null
  } catch (error) {
    console.log(error);
  }
}

async function getQuote() {}

//find customer, customer parameter is the email address
async function findCustomer(customer) {
  await client.connect();
  let data = client
    .db("social_finance")
    .collection("financeUsers")
    .findOne({ _id: customer }); //find customer by email
  return data; //if found data will be the object if not found will return null
}
async function getCustomers() {
  await client.connect();
  // let database = await client.db('sample_analytics').collection('customers').find().limit(10); //return the first 10 docuents
  let database = client
    .db("wild_daisy")
    .collection("products")
    .find()
    .limit(50); //return the first 50 docuents
  customers = await database.toArray(); // make it an array(have to do this to get the objects)
  return customers;
}

async function getCommunityData(collection) {
  await client.connect();
  // let database = await client.db('sample_analytics').collection('customers').find().limit(10); //return the first 10 docuents
  let database = client
    .db("GainsAndLosses")
    .collection(collection)
    .find()
    .limit(50); //return the first 50 docuents
  const customers = await database.toArray(); // make it an array(have to do this to get the objects)
  return customers;
}

//updating user passing user and customer object. Destructured id from user below. Pushed customer object onto myCustomer user Array
async function updateUser(user, customer) {
  await client.connect(); //find user by id      //push customer object to array
  let dataBase = client
    .db("social_finance")
    .collection("loggedUsers")
    .findOneAndUpdate(
      { _id: user._id },
      { $push: { myCustomers: customer } },
      { upsert: true },
      { returnNewDocument: true }
    );
}

async function findCustomerAndUpdate(id, reactionName) {
  id.toString(); //make it a string since mongo id's are strings
  let customerId = new ObjectId(id); //have to import ObjectID from mongo require, then put the id as the parameter. This is how you check for ID match
  await client.connect();
  console.log(id, reactionName);
  let updatedCustomer = client
    .db("social_finance")
    .collection("financeUsers")
    .findOneAndUpdate({ _id: customerId }, { $inc: { [reactionName]: 1 } }); //find customer by ID
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

//used to find name proprerties(Mongo Object) that much the searchCriteria parameters
async function findSearchMatches(searchCriteria) {
  console.log(["search criteria", searchCriteria]);
  await client.connect();
  try {
    //   await client.db('social_finance').collection('financeUsers').createIndex( { name: "text"} ) //in order to seach, have to include this line becuae I have to createIndex in Mongo(can also do in Atlas, 'name' is the name of the property that I want to search. Can only have one text index, so if there's another one, I will get an error)
    let matchedSearches = await client
      .db("social_finance")
      .collection("financeUsers")
      .find({ $text: { $search: searchCriteria } })
      .toArray(); //search the name property for the search criteria, 'returns a 'cursor' so have to use toArray method
    return matchedSearches;
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

exports.addUserToDb = addUserToDb;
exports.findUser = findUser;
exports.getCustomers = getCustomers;
exports.findCustomer = findCustomer;
exports.updateUser = updateUser;
exports.findUserById = findUserById;
exports.findCustomerAndUpdate = findCustomerAndUpdate;
exports.updateUserById = updateUserById;
exports.findSearchMatches = findSearchMatches;
exports.deleteFriend = deleteFriend;
exports.addUserToDbAppUsers = addUserToDbAppUsers;
exports.updateUserArr = updateUserArr;
exports.updateCommunityArr = updateCommunityArr;
exports.getCommunityData = getCommunityData;
exports.addUsertoCommunityArr = addUsertoCommunityArr;
exports.findData = findData;
