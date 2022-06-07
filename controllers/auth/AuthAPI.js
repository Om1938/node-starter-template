const router = require("express").Router();
const swaggerUi = require("swagger-ui-express");

const { Loginschema, Registerschema } = require("./User");
const {
  register,
  login,
  refreshJWTToken,
  GetUserProfileByUserName,
} = require("./AuthDAL");
const SanitizeBody = require("../../_helper/SanitizeBody");
const authorize = require("../../_helper/authorize");

// Sanitize body used for avoiding XSS.
// Using Schema is optional, can be ignored, if manual validation is done validation.
router.post(
  "/register",
  SanitizeBody,
  Registerschema,
  async (req, res, next) => {
    register(req.body.username, req.body.password, req.ip)
      .then((result) => {
        res
          .status(201)
          .json({ message: "User Created successfully", userid: result });
      })
      .catch(next);
  }
);

router.post("/login", SanitizeBody, Loginschema, async (req, res, next) => {
  login(req.body.username, req.body.password, req.ip)
    .then(({ refreshToken, ...user }) => {
      setHttpOnlyCookie(res, refreshToken);
      res.status(200).json({ message: "Logged In Successfully", ...user });
    })
    .catch(next);
});

router.post("/refresh-token", (req, res, next) => {
  let token = req.cookies.refreshToken;
  refreshJWTToken(token, req.ip)
    .then(({ refreshToken, ...user }) => {
      setHttpOnlyCookie(res, refreshToken);
      res
        .status(200)
        .json({ message: "Token Refreshed successfully", ...user });
    })
    .catch(next);
});

router.get("/tokenProfile", authorize([]), (req, res, next) => {
  if (!req.auth || !req.auth.username) res.status(401).end("Unauthorized");
  GetUserProfileByUserName(req.auth.username).then((user) => {
    res.status(200).json({ message: "Success", ...user });
  });
});

function setHttpOnlyCookie(res, token) {
  // create http only cookie with refresh token that expires in 7 days
  const cookieOptions = {
    secure: process.env.NODE_ENV !== "development",
    httpOnly: true,
    // 7 days * 24 hours * 60 mins * 60 secs * 1000 ms
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  };
  res.cookie("refreshToken", token, cookieOptions);
}

module.exports = router;
