const axios = require('axios');

async function verifyIndia({ pincode, city, state, street }) {
  const result = { verified: false, confidence: 0, normalized: {}, sources: [] };

  // Layer 1: Pincode verification (India Post API)
  if (pincode) {
    try {
      const { data } = await axios.get(
        `https://api.postalpincode.in/pincode/${pincode}`,
        { timeout: 5000 }
      );

      if (data[0].Status === 'Success') {
        const postOffice = data[0].PostOffice[0];
        result.normalized.pincode = pincode;
        result.normalized.district = postOffice.District;
        result.normalized.state = postOffice.State;
        result.normalized.country = 'India';
        result.confidence += 0.5;
        result.sources.push('India Post Pincode API');

        // Cross-check: does the state in request match API response?
        if (state && postOffice.State.toLowerCase().includes(state.toLowerCase())) {
          result.confidence += 0.2;
        }
      }
    } catch (err) {
      console.error('India Post API error:', err.message);
    }
  }

  // Layer 2: Full address geocoding (Nominatim)
  if (city || street) {
    try {
      const query = [street, city, state, 'India'].filter(Boolean).join(', ');
      const { data } = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: { q: query, countrycodes: 'in', format: 'json', limit: 1 },
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

module.exports = { verifyIndia };
