const Program = require('../models/Program');
const { upload } = require('../middleware/upload');
const fs = require('fs');
const path = require('path');

const UPLOAD_DIR = './uploads/programs';

// Создаем папку для загрузок, если её нет
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const createProgram = async (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      const { title, description } = req.body;
      
      if (!req.file) {
        console.error('Ошибка: Файл не загружен');
        return res.status(400).json({ error: 'Требуется загрузить файл' });
      }

      console.log('Полученные данные:', {
        body: req.body,
        file: req.file ? `Файл получен (${req.file.size} байт)` : 'Файл отсутствует'
      });

      const program = await Program.create({ 
        title, 
        description, 
        file: req.file 
      });
      
      console.log('Программа создана:', program);
      res.status(201).json({ success: true, program });
    } catch (error) {
      console.error('Ошибка создания:', {
        message: error.message,
        stack: error.stack,
        body: req.body
      });
      res.status(500).json({
        success: false,
        error: 'Ошибка сервера при создании программы',
        details: process.env.NODE_ENV === 'development' ? error.message : null
      });
    }
  });
};

const updateProgram = async (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      const { id } = req.params;
      const { title, description } = req.body;

      // Получаем текущую программу
      const currentProgram = await Program.findById(id);
      if (!currentProgram) {
        return res.status(404).json({ error: 'Программа не найдена' });
      }

      // Удаление старого файла при загрузке нового
      if (req.file && currentProgram.file_path) {
        const oldFilePath = path.join('./uploads', currentProgram.file_path);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      const updateData = {
        title: title || currentProgram.title,
        description: description || currentProgram.description,
        file: req.file || currentProgram.file
      };

      const updatedProgram = await Program.update(id, updateData);
      res.status(200).json(updatedProgram);
    } catch (error) {
      console.error('Ошибка при обновлении программы:', error);
      res.status(500).json({
        error: 'Ошибка сервера',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });
};

const partialUpdateProgram = async (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      const { id } = req.params;
      const updates = {};

      // Получаем текущую программу
      const currentProgram = await Program.findById(id);
      if (!currentProgram) {
        return res.status(404).json({ error: 'Программа не найдена' });
      }

      // Удаление старого файла при загрузке нового
      if (req.file) {
        if (currentProgram.file_path) {
          const oldFilePath = path.join('./uploads', currentProgram.file_path);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }
        updates.file = req.file;
      }

      const fields = ['title', 'description'];
      fields.forEach(field => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      const updatedProgram = await Program.update(id, updates);
      res.status(200).json(updatedProgram);
    } catch (error) {
      console.error('Ошибка при частичном обновлении программы:', error);
      res.status(500).json({
        error: 'Ошибка сервера',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });
};

const deleteProgram = async (req, res) => {
  try {
    const { id } = req.params;
    const program = await Program.findById(id);
    
    if (!program) {
      return res.status(404).json({ error: 'Программа не найдена' });
    }

    // Удаление файла
    if (program.file_path) {
      const filePath = path.join('./uploads', program.file_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await Program.delete(id);
    res.json({ message: 'Program deleted successfully' });
  } catch (error) {
    console.error('Ошибка при удалении программы:', error);
    res.status(500).json({
      error: 'Ошибка сервера',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getAllPrograms = async (req, res) => {
  try {
    const programs = await Program.findAll();
    res.status(200).json(programs);
  } catch (error) {
    console.error('Ошибка при получении программ:', error);
    res.status(500).json({
      error: 'Ошибка сервера',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getProgramById = async (req, res) => {
  try {
    const { id } = req.params;
    const program = await Program.findById(id);
    
    if (!program) {
      return res.status(404).json({ error: 'Программа не найдена' });
    }
    
    res.status(200).json(program);
  } catch (error) {
    console.error('Ошибка при получении программы:', error);
    res.status(500).json({
      error: 'Ошибка сервера',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  createProgram,
  updateProgram,
  partialUpdateProgram,
  deleteProgram,
  getAllPrograms,
  getProgramById
};
