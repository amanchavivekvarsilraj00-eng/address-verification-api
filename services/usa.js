const axios = require('axios');

async function verifyUSA({ zipcode, city, state, street }) {
  const result = { verified: false, confidence: 0, normalized: {}, sources: [] };

  if (zipcode) {
    try {
      const { data } = await axios.get(
        `https://api.zippopotam.us/us/${zipcode}`,
        { timeout: 5000 }
      );
      // Zippopotam returns 404 for invalid ZIPs (axios throws), so if we get here it's valid
      result.normalized.zipcode = data['post code'];
      result.normalized.city = data.places[0]['place name'];
      result.normalized.state = data.places[0]['state'];
      result.normalized.country = 'United States';
      result.confidence += 0.5;
      result.sources.push('Zippopotam');

      if (state && data.places[0]['state abbreviation'].toLowerCase() === state.toLowerCase()) {
        result.confidence += 0.2;
      }
    } catch (err) {
      // 404 means invalid ZIP
    }
  }

  if (city || street) {
    try {
      const query = [street, city, state, 'USA'].filter(Boolean).join(', ');
      const { data } = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: { q: query, countrycodes: 'us', format: 'json', limit: 1 },
        headers: { 'User-Agent': 'AddressVerificationAPI/1.0' },
        timeout: 8000
      });

      if (data.length > 0) {
        result.normalized.latitude = data[0].lat;
        result.normalized.longitude = data[0].lon;
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

module.exports = { verifyUSA };
