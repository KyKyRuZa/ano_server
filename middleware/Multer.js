const multer = require('multer');
const path = require('path');

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Определяем папку в зависимости от типа файла
        let uploadPath = 'uploads/';
        if (file.fieldname === 'media') {
            if (req.baseUrl.includes('staff')) {
                uploadPath += 'staff/';
            } else if (req.baseUrl.includes('programs')) {
                uploadPath += 'programs/';
            } else if (req.baseUrl.includes('projects')) {
                uploadPath += 'projects/';
            }
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Неподдерживаемый тип файла'), false);
    }
};

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: fileFilter
});

module.exports = { upload };