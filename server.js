const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
require('dotenv').config({ path: './config/.env' });

// Импортируем middleware
const { upload, uploadPath, handleMulterError } = require('./middleware/upload');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Раздаем статику из папки uploads
app.use('/uploads', express.static(uploadPath));

// Тестовый маршрут
app.get('/', (req, res) => {
  res.json({
    message: 'API сервер работает',
    uploadPath: uploadPath
  });
});

// Маршрут для загрузки файла
app.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      throw new Error('Файл не был загружен');
    }

    res.json({
      success: true,
      message: 'Файл успешно загружен',
      filename: req.file.filename,
      path: `/uploads/${req.file.filename}`
    });
  } catch (error) {
    console.error('Ошибка загрузки:', error);
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
  console.error('Глобальная ошибка:', err.stack);

  res.status(500).json({
    success: false,
    error: 'Внутренняя ошибка сервера',
    message: err.message
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
  console.log(`Файлы загружаются в: ${uploadPath}`);
  console.log(`Доступ к файлам: http://localhost:${PORT}/uploads/имя_файла`);

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
