const pool = require('../database');

class Program {
  static async findAll() {
    const query = `
      SELECT 
        id,
        title,
        description,
        image,
        created_at,
        updated_at
      FROM programs 
      ORDER BY created_at DESC
    `;
    const { rows } = await pool.query(query);
    return rows;
  }

  static async findById(id) {
    const query = `
      SELECT 
        id,
        title,
        description,
        image,
        created_at,
        updated_at
      FROM programs 
      WHERE id = $1
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  }

  static async create(data) {
    const { title, description, image } = data;
    const query = `
      INSERT INTO programs (title, description, image, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      RETURNING *
    `;
    const values = [title, description, image];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async update(id, data) {
    const allowedFields = ['title', 'description', 'image'];
    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(data)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updateFields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (updateFields.length === 0) {
      throw new Error('Нет данных для обновления');
    }

    updateFields.push(`updated_at = $${paramIndex}`);
    values.push(new Date());
    values.push(id);

    const query = `
      UPDATE programs 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramIndex + 1}
      RETURNING *
    `;

    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM programs WHERE id = $1 RETURNING *';
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  }
}

module.exports = Program;
