const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: String(process.env.DB_PASSWORD), // Явное преобразование в строку
  port: process.env.DB_PORT,
  ssl: false // Если не используете SSL
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  end: () => pool.end()
};
