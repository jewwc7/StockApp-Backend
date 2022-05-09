const express = require("express");
let router = express.Router();
const formData = require("form-data");
const Mailgun = require("mailgun.js");
const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: "Joshua",
  key: process.env.MAILGUN_API_KEY,
});
const {
  updateUser,
  findUser,
  findUserPractice,
  deleteUserProp,
  getCommunityData,
  replaceObjectById,
} = require("./gainsMongoFunctions");

const { myFunctions } = require("./backendMyFunctions");
const {
  dBCollectionTypes,
  responseTypes,
  DbDocsPropsTypes,
} = require("./types");
const { Empire, Competition, User } = require("./classes");
const { add, isAfter } = require("date-fns");
const { isEqualTo, getRandomNumber } = myFunctions;

const notFoundMessage = {
  type: "fail", //or error
  message: "That email wasnt found. Try again",
};
const noEmailMessage = {
  type: "error",
  message: "Please enter password and email",
};
const expiredPasswordMsg = {
  type: responseTypes.fail,
  message: "Temporary pascode expired, reset your password again",
};
const incorrectPassCode = {
  type: responseTypes.fail,
  message: "Passcode is incorrect",
};

const notVerifiedPassCode = {
  type: responseTypes.success,
  message: "Passcode not verfied, try again or check your email",
};

const emailFound = {
  type: responseTypes.success,
  message: "Email Sent",
};
//reset pasword-works, confirm email then send email with random created passcode
router.put("/resetpassword", async (req, res, err) => {
  const tempPassword = getRandomNumber();
  const { email } = req.body;
  try {
    if (!email) return res.send(noEmailMessage);
    const user = await findUser(email);
    if (!user) return res.send(notFoundMessage);
    const passwordExpireTime = add(new Date(), {
      minutes: 30,
    });
    const tempPassCodeConfig = {
      //  ip: ip,
      code: tempPassword, //stopped here use datefn isntead
      expire_timestamp: passwordExpireTime,
      created_timestamp: new Date(),
      verified: false,
    };
    const updateUserConfig = {
      collection: dBCollectionTypes.users,
      userId: user._id,
      prop: DbDocsPropsTypes.tempPasscode,
      data: tempPassCodeConfig,
    };
    updateUser(updateUserConfig);
    //sendUserEmail(email, tempPassword, message)
    const emailMessage = {
      from: "Stock Market Kings <mailgun@smarketkings.com>",
      to: email, //user email  //can also use array if myltiple ?     to: ["test@example.com"],
      subject: "Reset Your Password",
      text: `Please enter this passcode on verify screen ${tempPassword}`,
      html: `<h1>Please enter this passcode on the app verify screen ${tempPassword}</h1>`,
    };
    const sentMessage = await mg.messages.create(
      "smarketkings.com",
      emailMessage
    );
    console.log(tempPassword);
    res.send(emailFound); //send success message
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

//comparing passcode with user enterd passcode
router.put("/confirmresetpassword", async (req, res, err) => {
  const now = new Date();
  const { email, passcode } = req.body;
  try {
    if (!email) return res.send(noEmailMessage);
    const user = await findUser(email);
    if (!user) return res.send(notFoundMessage);
    const { tempPasscode } = user;
    const { expire_timestamp } = tempPasscode;
    const expiredTempPasscode = isAfter(now, expire_timestamp);
    const passcodeAreEqual = isEqualTo(tempPasscode.code, passcode);
    if (expiredTempPasscode) return res.send(expiredPasswordMsg);
    if (!passcodeAreEqual) return res.send(incorrectPassCode);
    const tempPassCodeConfig = {
      ...tempPasscode, //from the user
      verified: true, //updating to true after verification
    };
    const updateUserConfig = {
      collection: dBCollectionTypes.users,
      userId: user._id,
      prop: DbDocsPropsTypes.tempPasscode,
      data: tempPassCodeConfig,
    };
    updateUser(updateUserConfig);
    res.send({ type: "success", message: "Passcode correct" });
    //send email
    //make another route to confirm temppassword, check create to,e and code
    // const user = await newUser.add(res);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

//when user want to update password
router.put("/newpassword", async (req, res, err) => {
  const now = new Date();
  const { email, newPassword } = req.body;
  try {
    if (!email) return res.send(noEmailMessage);
    const user = await findUser(email);
    if (!user) return res.send(notFoundMessage); //make a class method to do this since i need to salt pasword
    const { tempPasscode } = user;
    const { expire_timestamp } = tempPasscode;
    const expiredTempPasscode = isAfter(now, expire_timestamp);
    if (expiredTempPasscode) return res.send(expiredPasswordMsg);
    if (!tempPasscode.verified) return res.send(notVerifiedPassCode);
    const classUser = new User(user._id, user.email, 0, []);
    classUser.addPassword(newPassword, res); //res is in the class
    const deleteUserPropConfig = {
      collection: dBCollectionTypes.users,
      userId: user._id,
      prop: DbDocsPropsTypes.tempPasscode,
    };
    deleteUserProp(deleteUserPropConfig); //deleting the passcode
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

///////////////////////////////////////////////////////////////

module.exports = router;
