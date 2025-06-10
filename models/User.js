const pool = require('../db');

module.exports = {
  async create({ login, password }) {
    const query = `
      INSERT INTO users (login, password_hash)
      VALUES ($1, $2)
      RETURNING id, login
    `;
    const { rows } = await pool.query(query, [login, password]);
    return rows[0];
  },

  async findByLogin(login) {
    const query = 'SELECT * FROM users WHERE login = $1';
    const { rows } = await pool.query(query, [login]);
    return rows[0];
  }
};