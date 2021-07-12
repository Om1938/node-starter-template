let db = require("../../conffig/db");
const Roles = require("../../_helper/UserRoles");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const crypto = require("crypto");

module.exports.register = async (username, password, ipAdress) => {
  let dbo = await db;
  let Users = dbo.collection("user");

  let emailExists = await getUserByUserName(username);
  if (emailExists) {
    throw throwError("Email Already Exists", 400);
  }

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password.toString(), salt);

  const user = {
    username,
    password: hash,
    roles: [Roles.User],
  };

  let result = await Users.insertOne(user);

  if (result.insertedCount == 1) return result.insertedId;
  else {
    throw throwError("Some Error Occured", 500);
  }
};

module.exports.login = async (username, password, ipAdress) => {
  let user = await getUserByUserName(username);
  console.log(!user);
  console.log(await bcrypt.compare(password, user.password));
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw throwError("Invalid Credentials", 401);
  }
  const jwtToken = await getJWTtoken(username);
  const refreshToken = await generateRefreshToken(username);
  return {
    ...GetUserProfile(user),
    jwtToken,
    refreshToken: refreshToken.token,
  };
};

module.exports.refreshJWTToken = async (token, ipAddress) => {
  let dbo = await db;
  const refreshToken = await getRefreshToken(token);
  const user = await dbo
    .collection("user")
    .findOne({ username: refreshToken.userName });

  console.log(refreshToken, user, { username: refreshToken.userName });
  // replace old refresh token with a new one and save
  const newRefreshToken = await generateRefreshToken(user.username, ipAddress);
  refreshToken.revoked = new Date();
  refreshToken.revokedByIp = ipAddress;
  refreshToken.replacedByToken = newRefreshToken.token;
  await dbo
    .collection("refreshToken")
    .findOneAndReplace({ token: refreshToken.token }, refreshToken);
  // generate new jwt
  const jwtToken = await getJWTtoken(user.username);
  // return basic details and tokens
  return {
    ...GetUserProfile(user),
    jwtToken,
    refreshToken: newRefreshToken.token,
  };
};

async function getUserByUserName(username) {
  let dbo = await db;
  let Users = dbo.collection("user");
  return Users.findOne({ username });
}

async function getJWTtoken(user) {
  let privateKey = fs.readFileSync("./assets/token_private.key");
  return jwt.sign(
    {
      username: user.username,
      roles: user.roles,
    },
    privateKey,
    {
      expiresIn: "30m",
      algorithm: "RS256",
      issuer: process.env.ISSUER,
    }
  );
}

async function generateRefreshToken(userName, ipAdress) {
  // create a refresh token that expires in 7 days
  let dbo = await db;
  let token = randomTokenString();
  let result = await dbo.collection("refreshToken").insertOne({
    userName: userName,
    token,
    createdByIp: ipAdress,
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
  return result.ops[0];
}

async function getRefreshToken(token) {
  let dbo = await db;
  const refreshToken = await dbo.collection("refreshToken").findOne({ token });

  if (!refreshToken || !isActive(refreshToken))
    throw throwError("Invalid token", 403);
  return refreshToken;
}

function randomTokenString() {
  return crypto.randomBytes(40).toString("hex");
}

function isActive(refreshToken) {
  return (
    !(Date.now() >= new Date(refreshToken.expires)) || !refreshToken.revoked
  );
}

function GetUserProfile(user) {
  delete user.password;
  delete user.roles;
  return user;
}

function throwError(message, status) {
  let error = new Error(message);
  error.status = status;
  return error;
}
