const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
require('dotenv').config({ path: './config/.env' });

// Импортируем middleware
const { upload, uploadPath, handleMulterError } = require('./middleware/upload');

const app = express();
const PORT = process.env.PORT || 8000;

// Функция для получения времени по МСК
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

// Middleware для логирования запросов
app.use((req, res, next) => {
  const startTime = Date.now();
  
  // Перехватываем ответ
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;
    const moscowTime = getMoscowTime();
    
    // Простое логирование: время, метод, URL, статус
    console.log(`[${moscowTime}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    
    originalSend.call(this, data);
  };
  
  next();
});

// Middleware
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static('/var/www/uploads/'));

// Маршрут для загрузки файла
app.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      throw new Error('Файл не был загружен');
    }

    const response = {
      success: true,
      message: 'Файл успешно загружен',
      filename: req.file.filename,
      path: `/uploads/${req.file.filename}`
    };

    res.json(response);
  } catch (error) {
    console.error('❌ Ошибка загрузки:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Подключаем маршруты
const staffRoutes = require('./routes/staffRoutes');
const programsRouter = require('./routes/programs');

app.use('/api/staff', staffRoutes);
app.use('/api/programs', programsRouter);

// Middleware для обработки ошибок multer
app.use(handleMulterError);

// Улучшенная обработка ошибок
app.use((err, req, res, next) => {
  const moscowTime = getMoscowTime();
  console.error(`[${moscowTime}] ❌ ОШИБКА: ${req.method} ${req.originalUrl} - ${err.message}`);

  res.status(500).json({
    success: false,
    error: 'Внутренняя ошибка сервера',
    message: err.message
  });
});

// Запуск сервера
app.listen(PORT, () => {
  const moscowTime = getMoscowTime();
  console.log(`[${moscowTime}] 🚀 Сервер запущен на порту ${PORT}`);
  console.log(`[${moscowTime}] 📁 Файлы загружаются в: ${uploadPath}`);

  // Финальная проверка доступности папки
  fs.access(uploadPath, fs.constants.W_OK, (err) => {
    if (err) {
      console.error(`[${moscowTime}] ⚠️ Внимание: нет прав на запись в папку загрузки!`);
      console.error('Выполните:');
      console.error(`chmod 775 "${uploadPath}"`);
      console.error(`chown -R n:www-data "${uploadPath}"`);
    } else {
      console.log(`[${moscowTime}] ✅ Папка для загрузок доступна для записи`);
    }
  });
});
