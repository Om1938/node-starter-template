const sanitizer = require('sanitizer');
function SanitizeBody(req, res, next) {

    let x = Object.entries(req.body).reduce((_acc, val) => {
        let sanitizedObj = sanitizer.sanitize(val[1])
        _acc[val[0]] = sanitizedObj
        return _acc;
    }, {})
    req.body = x;
    next();
}
module.exports = SanitizeBody;