const pool = require('../database');

module.exports = {
  // Создать проект
  async create({ title, description, mediaPath, mediaType }) {
    const query = `
      INSERT INTO projects (title, description, media_path, media_type)
      VALUES ($1, $2, $3, $4)
      RETURNING 
        id, 
        title, 
        description, 
        media_path AS "mediaPath", 
        media_type AS "mediaType",
        created_at AS "createdAt"
    `;
    const { rows } = await pool.query(query, [
      title,
      description,
      mediaPath,
      mediaType
    ]);
    return rows[0];
  },

  // Получить все проекты (с сортировкой по дате)
  async findAll() {
    const query = `
      SELECT 
        id,
        title,
        description,
        media_path AS "mediaPath",
        media_type AS "mediaType",
        created_at AS "createdAt"
      FROM projects
      ORDER BY created_at DESC
    `;
    const { rows } = await pool.query(query);
    return rows;
  },

  // Найти проект по ID
  async findById(id) {
    const query = `
      SELECT 
        id,
        title,
        description,
        media_path AS "mediaPath",
        media_type AS "mediaType",
        created_at AS "createdAt"
      FROM projects
      WHERE id = $1
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  },

  // Обновить проект
  async update(id, { title, description, mediaPath, mediaType }) {
    const query = `
      UPDATE projects
      SET 
        title = COALESCE($2, title),
        description = COALESCE($3, description),
        media_path = COALESCE($4, media_path),
        media_type = COALESCE($5, media_type)
      WHERE id = $1
      RETURNING 
        id,
        title,
        description,
        media_path AS "mediaPath",
        media_type AS "mediaType",
        created_at AS "createdAt"
    `;
    const { rows } = await pool.query(query, [
      id,
      title,
      description,
      mediaPath,
      mediaType
    ]);
    return rows[0];
  },

  // Удалить проект
  async delete(id) {
    const query = 'DELETE FROM projects WHERE id = $1 RETURNING *';
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  },

  // Дополнительные методы:

  // Проверить существование проекта
  async exists(id) {
    const query = 'SELECT EXISTS(SELECT 1 FROM projects WHERE id = $1)';
    const { rows } = await pool.query(query, [id]);
    return rows[0].exists;
  },

  // Получить путь к медиафайлу
  async getMediaPath(id) {
    const query = 'SELECT media_path FROM projects WHERE id = $1';
    const { rows } = await pool.query(query, [id]);
    return rows[0]?.media_path;
  }
};
