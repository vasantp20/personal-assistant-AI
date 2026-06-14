module.exports = (err, req, res, next) => {
  console.error(err.stack || err.message);

  if (err.name === 'ValidationError') {
    const details = {};
    for (const [key, val] of Object.entries(err.errors)) {
      details[key] = val.message;
    }
    return res.status(400).json({ error: 'Validation failed', code: 'VALIDATION_ERROR', details });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    return res.status(409).json({ error: `${field} already exists`, code: 'CONFLICT' });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid ID format', code: 'INVALID_ID' });
  }

  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  res.status(status).json({ error: message, code: err.code || 'INTERNAL_ERROR' });
};
