const multer = require('multer');

const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error(`Multer error: ${err.message}`);
    return res.status(400).json({ error: 'Ошибка загрузки файла' });
  } else if (err) {
    console.error(`Unexpected error during upload: ${err.message}`);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
  next();
};

module.exports = handleMulterError;
