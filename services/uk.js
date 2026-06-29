const axios = require('axios');

async function verifyUK({ postcode, city, street }) {
  const result = { verified: false, confidence: 0, normalized: {}, sources: [] };

  if (postcode) {
    try {
      const clean = postcode.replace(/\s/g, '').toUpperCase();
      const { data } = await axios.get(
        `https://api.postcodes.io/postcodes/${clean}`,
        { timeout: 5000 }
      );

      if (data.status === 200) {
        result.normalized.postcode = data.result.postcode;
        result.normalized.district = data.result.admin_district;
        result.normalized.region = data.result.region;
        result.normalized.country = data.result.country;
        result.normalized.latitude = data.result.latitude;
        result.normalized.longitude = data.result.longitude;
        result.confidence += 0.6;
        result.sources.push('Postcodes.io');
      }
    } catch (err) {
      // invalid postcode
    }
  }

  if (city || street) {
    try {
      const query = [street, city, 'United Kingdom'].filter(Boolean).join(', ');
      const { data } = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: { q: query, countrycodes: 'gb', format: 'json', limit: 1 },
        headers: { 'User-Agent': 'AddressVerificationAPI/1.0' },
        timeout: 8000
      });

      if (data.length > 0) {
        result.normalized.display_address = data[0].display_name;
        result.confidence += 0.3;
        result.sources.push('OpenStreetMap Nominatim');
      }
    } catch (err) {
      console.error('Nominatim error:', err.message);
    }
  }

  result.verified = result.confidence >= 0.5;
  result.confidence = Math.min(result.confidence, 1.0);
  return result;
}

module.exports = { verifyUK };
