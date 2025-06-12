const multer = require('multer');
const path = require('path');

const uploadPath = '/var/www/uploads/server/';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const originalName = file.originalname.replace(/\s+/g, '_');
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Неподдерживаемый тип файла'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 30 * 1024 * 1024 
  }
});
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

module.exports = { 
  upload,
  uploadPath,
  handleMulterError
};
