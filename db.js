const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on('connect', () => {
  console.log('Connected to Neon PostgreSQL Database successfully!');
});

const initDb = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS questions (
      id SERIAL PRIMARY KEY,
      section VARCHAR(100) NOT NULL,
      question TEXT NOT NULL,
      code TEXT,
      options JSONB NOT NULL,
      answer INT NOT NULL,
      explanation TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(createTableQuery);
    console.log('Database tables verified / created.');
  } catch (err) {
    console.error('Error initializing database tables:', err);
  }
};

initDb();

module.exports = pool;
