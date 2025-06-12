const pool = require('../database');

class Staff {
  static async create(staffData) {
    const { photo, name, position, callsign, about, external_texts } = staffData;
    
    const query = `
      INSERT INTO staff (photo, name, position, callsign, about, external_texts, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *
    `;
    
    const values = [photo, name, position, callsign, about, external_texts];
    
    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async getAll() {
    const query = 'SELECT * FROM staff ORDER BY created_at DESC';
    
    try {
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  static async getById(id) {
    const query = 'SELECT * FROM staff WHERE id = $1';
    
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async update(id, staffData) {
    const { photo, name, position, callsign, about, external_texts } = staffData;
    
    // Строим динамический запрос только для переданных полей
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (photo !== undefined) {
      fields.push(`photo = $${paramCount}`);
      values.push(photo);
      paramCount++;
    }
    if (name !== undefined) {
      fields.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }
    if (position !== undefined) {
      fields.push(`position = $${paramCount}`);
      values.push(position);
      paramCount++;
    }
    if (callsign !== undefined) {
      fields.push(`callsign = $${paramCount}`);
      values.push(callsign);
      paramCount++;
    }
    if (about !== undefined) {
      fields.push(`about = $${paramCount}`);
      values.push(about);
      paramCount++;
    }
    if (external_texts !== undefined) {
      fields.push(`external_texts = $${paramCount}`);
      values.push(external_texts);
      paramCount++;
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE staff 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async delete(id) {
    const query = 'DELETE FROM staff WHERE id = $1 RETURNING *';
    
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Добавляем методы для совместимости
  static async findAll() {
    return this.getAll();
  }

  static async findById(id) {
    return this.getById(id);
  }
}

module.exports = Staff;
