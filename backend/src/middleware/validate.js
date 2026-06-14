const { validationResult } = require('express-validator');

module.exports = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = {};
    for (const err of errors.array()) {
      details[err.path] = err.msg;
    }
    return res.status(400).json({ error: 'Validation failed', code: 'VALIDATION_ERROR', details });
  }
  next();
};
