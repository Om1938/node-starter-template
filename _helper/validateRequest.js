function validateRequest(req, next, schema) {
  const options = {
    abortEarly: false, // include all errors
    allowUnknown: true, // ignore unknown props
    stripUnknown: true, // remove unknown props
  };
  const { error, value } = schema.validate(req.body, options);
  if (error) {
    let err = new Error(
      `Validation error: ${error.details.map((x) => x.message).join(", ")}`
    );
    err.status = 400;
    next(err);
  } else {
    req.body = value;
    next();
  }
}
module.exports = validateRequest;
