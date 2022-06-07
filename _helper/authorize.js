var { expressjwt: jwt } = require("express-jwt");
const db = require("../config/db");
const authDAL = require("../controllers/auth/AuthDAL");
const fs = require("fs");
module.exports = authorize;

function authorize(roles = []) {
  // roles param can be a single role string (e.g. Role.User or 'User')
  // or an array of roles (e.g. [Role.Admin, Role.User] or ['Admin', 'User'])
  if (typeof roles === "string") {
    roles = [roles];
  }

  var publicKey = fs.readFileSync("assets/token_public.key");
  return [
    // authenticate JWT token and attach user to request object (req.user)
    jwt({
      secret: publicKey,
      algorithms: ["RS256"],
      issuer: process.env.ISSUER,
    }),

    // authorize based on user role
    async (req, res, next) => {
      let dbo = await db;
      const { username, roles: userRoles } = req.auth;
      const account = await getUserByUserName(username);
      if (!account || (roles.length && !roles.includes(account.role))) {
        // account no longer exists or role not authorized
        return res.status(401).json({ message: "Unauthorized" });
      }
      next();
    },
  ];
}

async function getUserByUserName(username) {
  let dbo = await db;
  let Users = dbo.collection("user");
  return Users.findOne({ username });
}
