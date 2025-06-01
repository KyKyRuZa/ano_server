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
