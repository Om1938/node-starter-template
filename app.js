require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");
var cookieParser = require("cookie-parser");
const allowedMethods = require("./_helper/allowedMethods");

// const swaggerUi = require("swagger-ui-express");
// const swaggerDocument = require("./swagger.json");

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(helmet());
app.use(morgan("combined"));
app.use(cors({ origin: "http://localhost:4200", credentials: true }));
app.use(cookieParser());

app.use(allowedMethods);
// app.use("/api", swaggerUi.serve);
// app.get("/api", swaggerUi.setup(swaggerDocument));
let err = (req, res, next) => {
  res.status(403).json({
    message:
      "I think you are not supposed to hit here, anyways welcome to Auth Endpoint.",
  });
};
app.get("/", err);
app.get("/api/", err);
app.use("/api/auth", require("./controllers/auth/AuthAPI"));

const port = process.env.PORT || 5000;
app.listen(port, () =>
  console.log(
    `> Server is up and running in ${process.env.NODE_ENV} mode  on port : ${port}`
  )
);

app.use(function (err, req, res, next) {
  let status = err.status || 500;
  res.status(status);
  if (process.env.NODE_ENV == "development") console.log(err);
  if (err.data) res.json({ message: err.message, ...err.data });
  else res.json({ message: err.message });
});
