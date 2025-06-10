const Program = require('../models/Program');

const create = async (req, res) => {
  try {
    console.log('Полученные данные:', {
      body: req.body,
      file: req.file ? `Файл получен (${req.file.size} байт)` : 'Файл отсутствует'
    });

    const { title, description } = req.body;
    const file = req.file;

    if (!file) {
      console.error('Ошибка: Файл не загружен');
      return res.status(400).json({ error: 'Требуется загрузить файл' });
    }

    const program = await Program.create({ title, description, file });
    console.log('Программа создана:', program);
    
    res.status(201).json({ success: true, program });
  } catch (err) {
    console.error('Ошибка создания:', {
      message: err.message,
      stack: err.stack,
      body: req.body
    });
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка сервера при создании программы',
      details: process.env.NODE_ENV === 'development' ? err.message : null
    });
  }
};

const getAll = async (req, res) => {
  try {
    const programs = await Program.getAll();
    res.json(programs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


module.exports = {
  create,
  getAll
};
