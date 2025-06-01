const express = require('express');
const router = express.Router();
const { upload } = require('../middleware/upload');
const pool = require('../db/index');

// GET /api/programs - получить все программы
router.get('/', async (req, res) => {
  try {
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
    
    res.json({
      success: true,
      data: rows,
      count: rows.length
    });
  } catch (err) {
    console.error('Ошибка получения программ:', err);
    res.status(500).json({ 
      success: false,
      error: 'Ошибка сервера при получении программ' 
    });
  }
});

// GET /api/programs/:id - получить программу по ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (isNaN(id)) {
      return res.status(400).json({ 
        success: false,
        error: 'Некорректный ID программы' 
      });
    }
    
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
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Программа не найдена' 
      });
    }
    
    res.json({
      success: true,
      data: rows[0]
    });
  } catch (err) {
    console.error('Ошибка получения программы:', err);
    res.status(500).json({ 
      success: false,
      error: 'Ошибка сервера при получении программы' 
    });
  }
});

// POST /api/programs - создать программу
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { title, description } = req.body;
    
    if (!title) {
      return res.status(400).json({ 
        success: false,
        error: 'Название программы является обязательным полем' 
      });
    }
    
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
    
    const query = `
      INSERT INTO programs (title, description, image, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      RETURNING *
    `;
    
    const values = [title, description || null, imagePath];
    const { rows } = await pool.query(query, values);
    
    res.status(201).json({
      success: true,
      message: 'Программа успешно создана',
      data: rows[0]
    });
    
  } catch (err) {
    console.error('Ошибка создания программы:', err);
    res.status(500).json({ 
      success: false,
      error: 'Ошибка сервера при создании программы' 
    });
  }
});

// PATCH /api/programs/:id - обновить программу
router.patch('/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    if (isNaN(id)) {
      return res.status(400).json({ 
        success: false,
        error: 'Некорректный ID программы' 
      });
    }
    
    // Проверяем существование программы
    const checkQuery = 'SELECT * FROM programs WHERE id = $1';
    const { rows: existingRows } = await pool.query(checkQuery, [id]);
    
    if (existingRows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Программа не найдена' 
      });
    }
    
    if (req.file) {
      updates.image = `/uploads/${req.file.filename}`;
    }
    
    const allowedFields = ['title', 'description', 'image'];
    const updateFields = [];
    const values = [];
    let paramIndex = 1;
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined && value !== '') {
        updateFields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Нет данных для обновления' 
      });
    }
    
    updateFields.push(`updated_at = $${paramIndex}`);
    values.push(new Date());
    values.push(id);
    
    const updateQuery = `
      UPDATE programs 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramIndex + 1}
      RETURNING *
    `;
    
    const { rows } = await pool.query(updateQuery, values);
    
    res.json({
      success: true,
      message: 'Программа обновлена',
      data: rows[0]
    });
    
  } catch (err) {
    console.error('Ошибка обновления программы:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка сервера при обновлении программы' 
    });
  }
});

// DELETE /api/programs/:id - удалить программу
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (isNaN(id)) {
      return res.status(400).json({ 
        success: false,
        error: 'Некорректный ID программы' 
      });
    }
    
    const checkQuery = 'SELECT * FROM programs WHERE id = $1';
    const { rows: existingRows } = await pool.query(checkQuery, [id]);
    
    if (existingRows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Программа не найдена' 
      });
    }
    
    const deleteQuery = 'DELETE FROM programs WHERE id = $1 RETURNING *';
    const { rows } = await pool.query(deleteQuery, [id]);
    
    res.json({
      success: true,
      message: 'Программа успешно удалена',
      data: rows[0]
    });
    
  } catch (err) {
    console.error('Ошибка удаления программы:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка сервера при удалении программы' 
    });
  }
});

module.exports = router;
