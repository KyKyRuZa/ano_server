const path = require('path');
const Letter = require('../models/Letter');
const { logger } = require('../logger');

// Вспомогательные функции для работы с файлами
const fileExists = async (filePath) => {
    try {
        await require('fs').promises.access(filePath);
        return true;
    } catch {
        return false;
    }
};

const safeUnlink = async (filePath) => {
    try {
        if (await fileExists(filePath)) {
            await require('fs').promises.unlink(filePath);
            logger.debug('Файл письма удален', { path: filePath });
            return true;
        }
        return false;
    } catch (error) {
        logger.warn('Не удалось удалить файл письма', { 
            path: filePath, 
            error: error.message 
        });
        return false;
    }
};

class LetterController {
    async getAll(req, res) {
        try {
            logger.info('Запрос списка благодарственных писем', {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                query: req.query
            });

            const { 
                page = 1, 
                limit = 12, 
                sortBy = 'created_at', 
                order = 'DESC',
                search = ''
            } = req.query;

            const offset = (page - 1) * limit;
            
            // Создаем условия для поиска
            const whereConditions = {};
            if (search && search.trim() !== '') {
                whereConditions.title = {
                    [Letter.sequelize.Op.iLike]: `%${search.trim()}%`
                };
            }

            const letters = await Letter.findAndCountAll({
                where: whereConditions,
                order: [[sortBy, order.toUpperCase()]],
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            logger.debug('Список писем получен', { 
                count: letters.count,
                returned: letters.rows.length,
                page: parseInt(page),
                limit: parseInt(limit)
            });

            res.json({
                success: true,
                data: letters.rows,
                pagination: {
                    current: parseInt(page),
                    total: Math.ceil(letters.count / limit),
                    totalItems: letters.count,
                    hasNext: page * limit < letters.count,
                    hasPrev: page > 1
                }
            });

        } catch (error) {
            logger.error('Ошибка получения списка писем:', {
                error: error.message,
                stack: error.stack,
                ip: req.ip
            });

            res.status(500).json({ 
                success: false,
                error: 'Внутренняя ошибка сервера',
                message: 'Не удалось получить список писем'
            });
        }
    }

    async create(req, res) {
        try {
            logger.info('Создание нового благодарственного письма', {
                ip: req.ip,
                body: req.body,
                file: req.file ? {
                    filename: req.file.filename,
                    originalname: req.file.originalname,
                    size: req.file.size
                } : null
            });

            // Валидация обязательных полей
            if (!req.body.title || req.body.title.trim() === '') {
                // Удаляем загруженный файл, если валидация не прошла
                if (req.file) {
                    const filePath = path.join('/var/www/uploads/', req.file.filename);
                    await safeUnlink(filePath);
                }
                return res.status(400).json({ 
                    success: false,
                    error: 'Заголовок письма обязателен' 
                });
            }

            if (!req.file) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Изображение письма обязательно' 
                });
            }

            // Проверяем что файл действительно сохранился
            const fullPath = path.join('/var/www/uploads/', req.file.filename);
            if (!await fileExists(fullPath)) {
                logger.error('Загруженный файл письма не найден на диске', {
                    expectedPath: fullPath,
                    filename: req.file.filename
                });
                return res.status(500).json({
                    success: false,
                    error: 'Ошибка при сохранении файла'
                });
            }

            const letterData = {
                title: req.body.title.trim(),
                description: req.body.description ? req.body.description.trim() : null,
                image_url: `/uploads/${req.file.filename}` // Используем относительный путь как в StaffController
            };

            const letter = await Letter.create(letterData);

            logger.info('Письмо успешно создано', {
                letterId: letter.id,
                title: letter.title,
                imageUrl: letter.image_url
            });

            res.status(201).json({
                success: true,
                data: letter,
                message: 'Благодарственное письмо успешно создано'
            });

        } catch (error) {
            // Удаляем загруженный файл если письмо не создалось
            if (req.file) {
                const filePath = path.join('/var/www/uploads/', req.file.filename);
                await safeUnlink(filePath);
            }

            logger.error('Ошибка создания письма:', {
                error: error.message,
                stack: error.stack,
                body: req.body,
                file: req.file ? req.file.filename : null,
                ip: req.ip
            });

            if (error.name === 'SequelizeValidationError') {
                const errors = error.errors.map(e => {
                    if (e.path === 'title') return 'Заголовок не может быть пустым';
                    if (e.path === 'image_url') return 'URL изображения должен быть корректным';
                    return e.message;
                });

                return res.status(400).json({ 
                    success: false,
                    error: 'Ошибка валидации',
                    details: errors
                });
            }

            if (error.name === 'SequelizeUniqueConstraintError') {
                return res.status(400).json({
                    success: false,
                    error: 'Письмо с таким заголовком уже существует'
                });
            }

            res.status(500).json({ 
                success: false,
                error: 'Внутренняя ошибка сервера',
                message: 'Не удалось создать письмо'
            });
        }
    }

    async getOne(req, res) {
        try {
            const letterId = req.params.id;

            logger.debug('Запрос благодарственного письма', {
                letterId,
                ip: req.ip
            });

            const letter = await Letter.findByPk(letterId);
            
            if (!letter) {
                logger.warn('Письмо не найдено', { letterId });
                return res.status(404).json({ 
                    success: false,
                    error: 'Письмо не найдено' 
                });
            }

            res.json({
                success: true,
                data: letter
            });

        } catch (error) {
            logger.error('Ошибка получения письма:', {
                error: error.message,
                letterId: req.params.id,
                ip: req.ip
            });

            res.status(500).json({ 
                success: false,
                error: 'Внутренняя ошибка сервера',
                message: 'Не удалось получить письмо'
            });
        }
    }

    async update(req, res) {
        try {
            const letterId = req.params.id;

            logger.info('Обновление благодарственного письма', {
                letterId,
                ip: req.ip,
                body: req.body,
                hasNewFile: !!req.file
            });

            const letter = await Letter.findByPk(letterId);
            if (!letter) {
                // Удаляем загруженный файл, если письмо не найдено
                if (req.file) {
                    const filePath = path.join('/var/www/uploads/', req.file.filename);
                    await safeUnlink(filePath);
                }
                return res.status(404).json({ 
                    success: false,
                    error: 'Письмо не найдено' 
                });
            }

            const oldImageUrl = letter.image_url;
            let oldFilePath = null;
            
            // Получаем путь к старому файлу
            if (oldImageUrl) {
                const filename = path.basename(oldImageUrl);
                oldFilePath = path.join('/var/www/uploads/', filename);
            }

            const updateData = {};
            
            if (req.body.title !== undefined) {
                if (req.body.title.trim() === '') {
                    if (req.file) {
                        const filePath = path.join('/var/www/uploads/', req.file.filename);
                        await safeUnlink(filePath);
                    }
                    return res.status(400).json({
                        success: false,
                        error: 'Заголовок не может быть пустым'
                    });
                }
                updateData.title = req.body.title.trim();
            }

            if (req.body.description !== undefined) {
                updateData.description = req.body.description.trim();
            }

            // Если загружено новое изображение
            if (req.file) {
                // Проверяем что новый файл сохранился
                const newFullPath = path.join('/var/www/uploads/', req.file.filename);
                if (!await fileExists(newFullPath)) {
                    logger.error('Новый файл письма не найден на диске', {
                        expectedPath: newFullPath
                    });
                    return res.status(500).json({
                        success: false,
                        error: 'Ошибка при сохранении файла'
                    });
                }
                updateData.image_url = `/uploads/${req.file.filename}`;
            }

            await letter.update(updateData);

            // Удаляем старый файл, если было загружено новое изображение
            if (req.file && oldFilePath) {
                await safeUnlink(oldFilePath);
            }

            logger.info('Письмо успешно обновлено', {
                letterId: letter.id,
                updatedFields: Object.keys(updateData),
                newFile: !!req.file
            });

            res.json({
                success: true,
                data: letter,
                message: 'Письмо успешно обновлено'
            });

        } catch (error) {
            // Удаляем загруженный файл если обновление не удалось
            if (req.file) {
                const filePath = path.join('/var/www/uploads/', req.file.filename);
                await safeUnlink(filePath);
            }

            logger.error('Ошибка обновления письма:', {
                error: error.message,
                letterId: req.params.id,
                ip: req.ip
            });

            if (error.name === 'SequelizeValidationError') {
                const errors = error.errors.map(e => {
                    if (e.path === 'title') return 'Заголовок не может быть пустым';
                    if (e.path === 'image_url') return 'URL изображения должен быть корректным';
                    return e.message;
                });

                return res.status(400).json({ 
                    success: false,
                    error: 'Ошибка валидации',
                    details: errors
                });
            }

            if (error.name === 'SequelizeUniqueConstraintError') {
                return res.status(400).json({
                    success: false,
                    error: 'Письмо с таким заголовком уже существует'
                });
            }

            res.status(500).json({ 
                success: false,
                error: 'Внутренняя ошибка сервера',
                message: 'Не удалось обновить письмо'
            });
        }
    }

    async delete(req, res) {
        try {
            const letterId = req.params.id;

            logger.info('Удаление благодарственного письма', {
                letterId,
                ip: req.ip
            });

            const letter = await Letter.findByPk(letterId);
            if (!letter) {
                return res.status(404).json({ 
                    success: false,
                    error: 'Письмо не найдено' 
                });
            }

            // Удаляем файл изображения
            if (letter.image_url) {
                const filename = path.basename(letter.image_url);
                const filePath = path.join('/var/www/uploads/', filename);
                await safeUnlink(filePath);
            }

            await letter.destroy();

            logger.info('Письмо успешно удалено', {
                letterId,
                title: letter.title
            });

            res.json({ 
                success: true,
                message: 'Письмо успешно удалено',
                deletedId: letterId
            });

        } catch (error) {
            logger.error('Ошибка удаления письма:', {
                error: error.message,
                letterId: req.params.id,
                ip: req.ip
            });

            res.status(500).json({ 
                success: false,
                error: 'Внутренняя ошибка сервера',
                message: 'Не удалось удалить письмо'
            });
        }
    }

    async getStats(req, res) {
        try {
            logger.info('Запрос статистики по письмам', {
                ip: req.ip
            });

            const totalLetters = await Letter.count();
            const recentLetters = await Letter.count({
                where: {
                    created_at: {
                        [Letter.sequelize.Op.gte]: new Date(new Date() - 30 * 24 * 60 * 60 * 1000) // Последние 30 дней
                    }
                }
            });

            const stats = {
                total: totalLetters,
                recent: recentLetters,
                lastCreated: await Letter.findOne({
                    order: [['created_at', 'DESC']],
                    attributes: ['title', 'created_at']
                })
            };

            res.json({
                success: true,
                data: stats
            });

        } catch (error) {
            logger.error('Ошибка получения статистики:', {
                error: error.message,
                ip: req.ip
            });

            res.status(500).json({ 
                success: false,
                error: 'Внутренняя ошибка сервера',
                message: 'Не удалось получить статистику'
            });
        }
    }
}

module.exports = new LetterController();