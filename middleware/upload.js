const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadPath = path.join(__dirname, '../uploads');

// Проверяем и создаем папку uploads при запуске
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
  console.log('Создана папка для загрузок:', uploadPath);
}

// Настройка Multer с проверкой ошибок
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Дополнительная проверка существования папки
    fs.access(uploadPath, fs.constants.W_OK, (err) => {
      if (err) {
        console.error('Ошибка доступа к папке:', err);
        return cb(new Error('Не могу записать в папку загрузки'));
      }
      cb(null, uploadPath);
    });
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB
  }
});

// Middleware для обработки ошибок multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ 
      success: false,
      error: 'Ошибка загрузки файла',
      details: err.code === 'LIMIT_FILE_SIZE' 
        ? 'Файл слишком большой (максимум 20MB)' 
        : err.message 
    });
  }
  next(err);
};

module.exports = { 
  upload, 
  uploadPath,
  handleMulterError
};