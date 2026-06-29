const mysql = require('mysql2/promise');
require('dotenv').config();

async function initDB() {
  console.log('Connecting to database...');
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: {
        rejectUnauthorized: false
      }
    });

    console.log('Connected! Creating tables...');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS verification_cache (
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
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS request_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        request_id VARCHAR(36),
        country VARCHAR(10),
        ip_address VARCHAR(45),
        response_time_ms INT,
        status_code INT,
        cached BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Tables created successfully!');
    await connection.end();
  } catch (err) {
    console.error('Error creating tables:', err);
  }
}

initDB();
