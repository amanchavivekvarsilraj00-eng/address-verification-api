const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const { validateAddress } = require('../middleware/validate');
const { verifyIndia } = require('../services/india');
const { verifyUSA } = require('../services/usa');
const { verifyUK } = require('../services/uk');

const verifiers = { india: verifyIndia, usa: verifyUSA, uk: verifyUK };

// POST /api/verify
router.post('/verify', validateAddress, async (req, res) => {
  const startTime = Date.now();
  const requestId = uuidv4();
  const { country, address } = req.body;

  // Create a hash of the input for cache lookup
  const addressHash = crypto
    .createHash('md5')
    .update(country + JSON.stringify(address))
    .digest('hex');

  try {
    // Check cache first
    const [cached] = await db.query(
      'SELECT * FROM verification_cache WHERE address_hash = ?',
      [addressHash]
    );

    if (cached.length > 0) {
      const row = cached[0];
      return res.json({
        success: true,
        request_id: requestId,
        cached: true,
        country,
        verified: !!row.is_verified,
        confidence: parseFloat(row.confidence),
        normalized_address: typeof row.normalized_address === 'string' ? JSON.parse(row.normalized_address) : row.normalized_address,
        sources: row.source ? row.source.split(', ') : [],
      });
    }

    // Call country-specific verifier
    const verifyFn = verifiers[country];
    const result = await verifyFn(address);

    // Save to cache
    await db.query(
      `INSERT INTO verification_cache 
       (country, address_input, address_hash, is_verified, confidence, normalized_address, source)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        country,
        JSON.stringify(address),
        addressHash,
        result.verified,
        result.confidence,
        JSON.stringify(result.normalized),
        result.sources.join(', ')
      ]
    );

    // Log the request
    await db.query(
      `INSERT INTO request_logs (request_id, country, ip_address, response_time_ms, status_code, cached)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [requestId, country, req.ip, Date.now() - startTime, 200, false]
    );

    return res.json({
      success: true,
      request_id: requestId,
      cached: false,
      country,
      verified: result.verified,
      confidence: result.confidence,
      normalized_address: result.normalized,
      sources: result.sources,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Internal server error', request_id: requestId });
  }
});

// GET /api/countries — list supported countries
router.get('/countries', (req, res) => {
  res.json({
    success: true,
    supported_countries: [
      { code: 'india', fields: ['street', 'city', 'state', 'pincode'] },
      { code: 'usa',   fields: ['street', 'city', 'state', 'zipcode'] },
      { code: 'uk',    fields: ['street', 'city', 'postcode'] },
    ]
  });
});

// GET /api/stats — bonus: show cache stats
router.get('/stats', async (req, res) => {
  try {
    const [stats] = await db.query(`
      SELECT country, COUNT(*) as total, 
             SUM(is_verified) as verified, 
             AVG(confidence) as avg_confidence
      FROM verification_cache GROUP BY country
    `);
    res.json({ success: true, stats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
