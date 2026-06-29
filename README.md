# Address Verification API

A REST API that takes an address as input, calls real country-specific address databases, verifies if the address exists, caches results in MySQL, and is configured for deployment on Vercel.

## Supported Countries
- **India** 🇮🇳 (api.postalpincode.in)
- **USA** 🇺🇸 (api.zippopotam.us)
- **UK** 🇬🇧 (api.postcodes.io)
- **Global Geocoding** via OpenStreetMap Nominatim

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a MySQL database and tables:
   ```sql
   CREATE DATABASE address_verification;
   USE address_verification;

   CREATE TABLE verification_cache (
     id INT AUTO_INCREMENT PRIMARY KEY,
     country VARCHAR(10) NOT NULL,
     address_input TEXT NOT NULL,
     address_hash VARCHAR(64) NOT NULL,
     is_verified BOOLEAN NOT NULL,
     confidence DECIMAL(3,2),
     normalized_address JSON,
     source VARCHAR(100),
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     INDEX idx_hash (address_hash)
   );

   CREATE TABLE request_logs (
     id INT AUTO_INCREMENT PRIMARY KEY,
     request_id VARCHAR(36),
     country VARCHAR(10),
     ip_address VARCHAR(45),
     response_time_ms INT,
     status_code INT,
     cached BOOLEAN DEFAULT FALSE,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```

3. Setup environment variables:
   Copy `.env.example` to `.env` and fill in your MySQL credentials.

4. Run the server:
   ```bash
   npm start
   # or
   node api/index.js
   ```

## Example API Request

```json
POST /api/verify
{
  "country": "india",
  "address": {
    "street": "MG Road",
    "city": "Bangalore",
    "state": "Karnataka",
    "pincode": "560001"
  }
}
```
