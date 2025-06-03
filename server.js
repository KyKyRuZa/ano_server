const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { getMoscowTime } = require('./utils/timeUtils');
const logger = require('./helpers/logger');
const { upload, uploadPath, handleMulterError } = require('./middleware/upload');
require('dotenv').config({ path: './config/.env' });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware для логирования запросов
app.use((req, res, next) => {
  const startTime = Date.now();

  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;
    logger.info(`${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    originalSend.call(this, data);
  };

  next();
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('/var/www/uploads/'));

// Роуты
app.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) throw new Error('Файл не был загружен');

    res.json({
      success: true,
      message: 'Файл успешно загружен',
      filename: req.file.filename,
      path: `/uploads/${req.file.filename}`
    });
  } catch (error) {
    logger.error(`Ошибка загрузки файла: ${error.message}`, {
      stack: error.stack
    });
    res.status(500).json({ success: false, error: error.message });
  }
});

app.use('/api/staff', require('./routes/staffRoutes'));
app.use('/api/programs', require('./routes/programs'));

app.use(handleMulterError);

// Обработка ошибок
app.use((err, req, res, next) => {
  logger.error(`Ошибка обработки запроса: ${err.message}`, {
    method: req.method,
    url: req.originalUrl,
    stack: err.stack
  });

  res.status(500).json({ success: false, error: 'Внутренняя ошибка сервера' });
});

// Настройка HTTPS
const options = {
  key: fs.readFileSync('/etc/letsencrypt/live/anotsenimzhizn.ru/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/anotsenimzhizn.ru/fullchain.pem')
};

https.createServer(options, app).listen(PORT, () => {
  logger.info(`🚀 Сервер запущен на порту ${PORT} (HTTPS)`);
  logger.info(`📁 Файлы загружаются в: ${uploadPath}`);

  fs.access(uploadPath, fs.constants.W_OK, (err) => {
    if (err) {
      logger.error(`⚠️ Нет прав на запись в папку загрузки!`);
      logger.warn(`Выполните следующие команды:`);
      logger.warn(`chmod 775 "${uploadPath}"`);
      logger.warn(`chown -R www-data:www-data "${uploadPath}"`);
    } else {
      logger.info(`✅ Папка для загрузок доступна для записи`);
    }
  });
});