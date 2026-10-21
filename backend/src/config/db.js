require('dotenv').config();
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is missing. Set it in backend/.env before starting SAINO backend.');
}

let isLocal = false;
try {
  const parsed = new URL(connectionString);
  isLocal = ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname);
} catch (_) {
  throw new Error('DATABASE_URL is not a valid PostgreSQL connection URL.');
}

const pool = new Pool({
  connectionString,
  ssl: isLocal ? false : { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err.message);
});

module.exports = pool;
