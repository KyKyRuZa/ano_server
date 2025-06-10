const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: String(process.env.DB_PASSWORD),
  port: process.env.DB_PORT,
  ssl: true 
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  end: () => pool.end()
};
