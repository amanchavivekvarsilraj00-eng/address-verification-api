const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

app.get('/api/ping', (req, res) => res.json({ status: 'booted' }));

const verifyRoutes = require('../routes/verify');

app.set('trust proxy', 1); // Required for rate limiting behind Vercel's proxy
app.use(cors());
app.use(express.json());

// Rate limiting: max 30 requests per minute per IP
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { success: false, error: 'Too many requests. Try again in a minute.' }
});
app.use('/api', limiter);

app.use('/api', verifyRoutes);

app.use(express.static('public'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Address Verification API is running' });
});

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app; // Required for Vercel
