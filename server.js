const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { upload, uploadPath, handleMulterError } = require('./middleware/upload');
require('dotenv').config({ path: './config/.env' });

const app = express();
const PORT = process.env.PORT || 3000;

// Получение времени по МСК
function getMoscowTime() {
  return new Date().toLocaleString('ru-RU', {
    timeZone: 'Europe/Moscow',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

// Middleware для логирования
app.use((req, res, next) => {
  const startTime = Date.now();

  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;
    const moscowTime = getMoscowTime();
    console.log(`[${moscowTime}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
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
    console.error('❌ Ошибка загрузки:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.use('/api/staff', require('./routes/staffRoutes'));
app.use('/api/programs', require('./routes/programs'));

app.use(handleMulterError);

// Обработка ошибок
app.use((err, req, res, next) => {
  const moscowTime = getMoscowTime();
  console.error(`[${moscowTime}] ❌ ОШИБКА: ${req.method} ${req.originalUrl} - ${err.message}`);
  res.status(500).json({ success: false, error: 'Внутренняя ошибка сервера' });
});

// Настройка HTTPS
const options = {
  key: fs.readFileSync('/etc/letsencrypt/live/anotsenimzhizn.ru/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/anotsenimzhizn.ru/fullchain.pem')
};

https.createServer(options, app).listen(PORT, () => {
  const moscowTime = getMoscowTime();
  console.log(`[${moscowTime}] 🚀 Сервер запущен на порту ${PORT} (HTTPS)`);
  console.log(`[${moscowTime}] 📁 Файлы загружаются в: ${uploadPath}`);

  fs.access(uploadPath, fs.constants.W_OK, (err) => {
    if (err) {
      console.error(`[${moscowTime}] ⚠️ Нет прав на запись в папку загрузки!`);
      console.error('Выполните:');
      console.error(`chmod 775 "${uploadPath}"`);
      console.error(`chown -R www-data:www-data "${uploadPath}"`);
    } else {
      console.log(`[${moscowTime}] ✅ Папка для загрузок доступна для записи`);
    }
  });
});