const Joi = require("joi");
const ValidateRequest = require("../../_helper/validateRequest");

module.exports.Loginschema = (req, res, next) => {
  const schema = Joi.object({
    username: Joi.string().email().min(3).max(254).required(),
    password: Joi.string()
      .pattern(new RegExp("^[a-zA-Z0-9-+_!@#$%^&*., ?]{3,30}$"))
      .required(),
  });
  ValidateRequest(req, next, schema);
};

module.exports.Registerschema = (req, res, next) => {
  const schema = Joi.object({
    username: Joi.string().email().min(3).max(254).required(),
    password: Joi.string()
      // .pattern(new RegExp('^[a-zA-Z0-9]{3,30}$'))
      .required(),
    repeat_password: Joi.ref("password"),
  }).with("password", "repeat_password");
  ValidateRequest(req, next, schema);
};
