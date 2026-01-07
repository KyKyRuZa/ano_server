const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { logger } = require('../logger'); 

const uploadDir = '/var/www/uploads/';

const ensureUploadDir = () => {
    try {
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true, mode: 0o755 });
            logger.info(`Создана директория загрузок: ${uploadDir}`);
        }
        
        fs.accessSync(uploadDir, fs.constants.W_OK);
        logger.info(`Директория загрузок доступна для записи: ${uploadDir}`);
    } catch (error) {
        logger.error(`Ошибка доступа к директории загрузок: ${error.message}`);
        throw new Error('Не удалось инициализировать директорию загрузок');
    }
};

ensureUploadDir();

const generateSafeFilename = (originalName, fieldname) => {
    const ext = path.extname(originalName).toLowerCase();
    const name = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    
    return `${timestamp}-${random}-${fieldname}${ext}`;
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        try {
            const safeFilename = generateSafeFilename(file.originalname, file.fieldname);
            cb(null, safeFilename);
        } catch (error) {
            cb(new Error('Ошибка генерации имени файла'));
        }
    }
});

const fileFilter = (req, file, cb) => {
    try {
        const allowedMimes = [
            'image/jpeg', 
            'image/jpg', 
            'image/png', 
            'image/webp',
        ];
        
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
        const fileExtension = path.extname(file.originalname).toLowerCase();
        
        if (!allowedMimes.includes(file.mimetype)) {
            logger.warn('Попытка загрузки файла с запрещенным MIME-типом', {
                mimetype: file.mimetype,
                originalname: file.originalname,
                ip: req.ip
            });
            return cb(new Error('Неподдерживаемый тип файла. Разрешены только изображения.'), false);
        }
        
        if (!allowedExtensions.includes(fileExtension)) {
            logger.warn('Попытка загрузки файла с запрещенным расширением', {
                extension: fileExtension,
                originalname: file.originalname,
                ip: req.ip
            });
            return cb(new Error('Неподдерживаемое расширение файла.'), false);
        }
        
        const mimeToExt = {
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png'],
            'image/webp': ['.webp'],
        };
        
        if (mimeToExt[file.mimetype] && !mimeToExt[file.mimetype].includes(fileExtension)) {
            logger.warn('Несоответствие MIME-типа и расширения файла', {
                mimetype: file.mimetype,
                extension: fileExtension,
                originalname: file.originalname,
                ip: req.ip
            });
            return cb(new Error('Несоответствие типа файла и его расширения.'), false);
        }
        
        logger.debug('Файл прошел проверку', {
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size
        });
        
        cb(null, true);
        
    } catch (error) {
        logger.error('Ошибка при проверке файла', {
            error: error.message,
            originalname: file.originalname
        });
        cb(new Error('Ошибка проверки файла'), false);
    }
};

const upload = multer({ 
    storage,
    limits: { 
        fileSize: 10 * 1024 * 1024,
        files: 5, 
        fields: 10
    },
    fileFilter,
    preservePath: false 
});

const handleMulterErrors = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        logger.warn('Ошибка Multer при загрузке файла', {
            error: error.code,
            message: error.message,
            ip: req.ip,
            field: error.field
        });
        
        switch (error.code) {
            case 'LIMIT_FILE_SIZE':
                return res.status(413).json({ 
                    success: false, 
                    error: 'Размер файла превышает допустимый лимит 10 МБ' 
                });
            case 'LIMIT_FILE_COUNT':
                return res.status(413).json({ 
                    success: false, 
                    error: 'Превышено максимальное количество файлов' 
                });
            case 'LIMIT_UNEXPECTED_FILE':
                return res.status(400).json({ 
                    success: false, 
                    error: 'Непредвиденное поле для загрузки файла' 
                });
            default:
                return res.status(400).json({ 
                    success: false, 
                    error: 'Ошибка при загрузке файла' 
                });
        }
    } else if (error) {
        logger.warn('Ошибка при загрузке файла', {
            error: error.message,
            ip: req.ip
        });
        return res.status(400).json({ 
            success: false, 
            error: error.message 
        });
    }
    next();
};

const validateUploadedFiles = (req, res, next) => {
    if (!req.file && !req.files) {
        return res.status(400).json({ 
            success: false, 
            error: 'Файл не был загружен' 
        });
    }
    
    try {
        const files = req.file ? [req.file] : req.files;
        
        for (const file of files) {
            if (!file || !file.path) {
                throw new Error('Ошибка при сохранении файла');
            }
            
            if (!fs.existsSync(file.path)) {
                logger.error('Загруженный файл не найден на диске', {
                    path: file.path,
                    originalname: file.originalname
                });
                throw new Error('Ошибка при сохранении файла');
            }
            
            logger.info('Файл успешно загружен', {
                filename: file.filename,
                originalname: file.originalname,
                size: file.size,
                mimetype: file.mimetype,
                destination: file.destination
            });
        }
        
        next();
    } catch (error) {
        logger.error('Ошибка валидации загруженных файлов', {
            error: error.message
        });
        return res.status(500).json({ 
            success: false, 
            error: 'Ошибка при обработке загруженного файла' 
        });
    }
};

module.exports = { 
    upload, 
    handleMulterErrors, 
    validateUploadedFiles,
    uploadDir 
};