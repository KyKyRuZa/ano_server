const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Папка для загрузки файлов — абсолютный путь
const uploadDir = '/var/www/uploads/';

// Создаем папку, если её нет (важно для первого запуска)
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Настройка хранения
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); // сохраняем в /var/www/uploads/
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const filename = `${Date.now()}-${file.fieldname}${ext}`;
        cb(null, filename);
    }
});

// Фильтр файлов
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Неподдерживаемый тип файла'), false);
    }
};

// Экспортируем готовый upload
const upload = multer({ 
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 МБ
    fileFilter
});

module.exports = { upload };