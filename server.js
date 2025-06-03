const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
require('dotenv').config({ path: './config/.env' });

// Импортируем middleware
const { upload, uploadPath, handleMulterError } = require('./middleware/upload');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware для логирования запросов
app.use((req, res, next) => {
  const startTime = Date.now();
  
  // Логируем входящий запрос
  console.log(`📥 [${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`   Body:`, JSON.stringify(req.body, null, 2));
  }
  
  if (req.query && Object.keys(req.query).length > 0) {
    console.log(`   Query:`, req.query);
  }

  // Перехватываем ответ
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;
    
    // Логируем ответ
    console.log(`📤 [${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    
    // Логируем тело ответа (ограничиваем размер для читаемости)
    try {
      const responseData = typeof data === 'string' ? data : JSON.stringify(data);
      const truncatedData = responseData.length > 500 ? 
        responseData.substring(0, 500) + '...[truncated]' : 
        responseData;
      console.log(`   Response:`, truncatedData);
    } catch (e) {
      console.log(`   Response: [не удалось сериализовать]`);
    }
    
    console.log('─'.repeat(80)); // Разделитель для читаемости
    
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
  console.error('🚨 Глобальная ошибка:', err.stack);
  console.error(`   URL: ${req.method} ${req.originalUrl}`);
  console.error(`   IP: ${req.ip}`);
  console.error(`   User-Agent: ${req.get('User-Agent')}`);

  res.status(500).json({
    success: false,
    error: 'Внутренняя ошибка сервера',
    message: err.message
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`📁 Файлы загружаются в: ${uploadPath}`);

  // Финальная проверка доступности папки
  fs.access(uploadPath, fs.constants.W_OK, (err) => {
    if (err) {
      console.error('⚠️ Внимание: нет прав на запись в папку загрузки!');
      console.error('Выполните:');
      console.error(`chmod 775 "${uploadPath}"`);
      console.error(`chown -R n:www-data "${uploadPath}"`);
    } else {
      console.log('✅ Папка для загрузок доступна для записи');
    }
  });
});
