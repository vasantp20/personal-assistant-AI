const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const auth = require('./middleware/auth.middleware');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Public
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
const BASE = '/api/v1';
app.use(`${BASE}/auth`, require('./routes/auth.routes'));
// app.use(`${BASE}/transactions`, auth, require('./routes/transactions.routes'));
// app.use(`${BASE}/budgets`, auth, require('./routes/budgets.routes'));
// app.use(`${BASE}/recurring`, auth, require('./routes/recurring.routes'));
// app.use(`${BASE}/tags`, auth, require('./routes/tags.routes'));
// app.use(`${BASE}/images`, auth, require('./routes/images.routes'));
app.use(`${BASE}/agent`,auth, require('./routes/agent.routes'));

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', code: 'NOT_FOUND' });
});

app.use(errorHandler);

module.exports = app;
