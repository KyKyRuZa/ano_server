const fs = require('fs').promises;
const path = require('path');
const Program = require('../models/Program');
const { logger } = require('../logger');

// Вспомогательная функция для проверки существования файла
const fileExists = async (filePath) => {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
};

// Безопасное удаление файла
const safeUnlink = async (filePath) => {
    try {
        if (await fileExists(filePath)) {
            await fs.unlink(filePath);
            logger.info('Файл программы удален', { path: filePath });
            return true;
        }
        return false;
    } catch (error) {
        logger.warn('Не удалось удалить файл программы', { 
            path: filePath, 
            error: error.message 
        });
        return false;
    }
};

class ProgramController {
    async getAll(req, res) {
        try {
            logger.info('Запрос списка программ', {
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });

            const programs = await Program.findAll({
                order: [['createdAt', 'DESC']]
            });

            logger.debug('Список программ получен', { 
                count: programs.length 
            });

            res.json({
                success: true,
                data: programs,
                count: programs.length
            });

        } catch (error) {
            logger.error('Ошибка получения программ:', {
                error: error.message,
                stack: error.stack,
                ip: req.ip
            });

            res.status(500).json({ 
                success: false,
                error: 'Внутренняя ошибка сервера',
                message: 'Не удалось получить список программ'
            });
        }
    }

    async create(req, res) {
        try {
            logger.info('Создание новой программы', {
                ip: req.ip,
                body: req.body,
                hasFile: !!req.file
            });

            // Валидация
            if (!req.body.title || req.body.title.trim() === '') {
                return res.status(400).json({ 
                    success: false,
                    error: 'Название программы обязательно' 
                });
            }

            const programData = {
                title: req.body.title.trim(),
                description: req.body.description ? req.body.description.trim() : null,
                media: null
            };

            // Обработка файла
            if (req.file) {
                programData.media = `/uploads/${req.file.filename}`;
                
                // Проверяем что файл действительно сохранился
                const fullPath = path.join('/var/www', programData.media);
                if (!await fileExists(fullPath)) {
                    logger.error('Загруженный файл программы не найден на диске', {
                        expectedPath: fullPath,
                        filename: req.file.filename
                    });
                    return res.status(500).json({
                        success: false,
                        error: 'Ошибка при сохранении файла'
                    });
                }
            }

            const program = await Program.create(programData);

            logger.info('Программа успешно создана', {
                programId: program.id,
                title: program.title,
                hasMedia: !!program.media
            });

            res.status(201).json({
                success: true,
                data: program,
                message: 'Программа успешно создана'
            });

        } catch (error) {
            logger.error('Ошибка создания программы:', {
                error: error.message,
                stack: error.stack,
                body: req.body,
                ip: req.ip
            });

            // Удаляем загруженный файл если программа не создалась
            if (req.file) {
                const filePath = path.join('/var/www/uploads', req.file.filename);
                await safeUnlink(filePath);
            }

            if (error.name === 'SequelizeValidationError') {
                return res.status(400).json({ 
                    success: false,
                    error: 'Ошибка валидации',
                    details: error.errors.map(e => e.message)
                });
            }

            if (error.name === 'SequelizeUniqueConstraintError') {
                return res.status(400).json({
                    success: false,
                    error: 'Программа с таким названием уже существует'
                });
            }

            res.status(500).json({ 
                success: false,
                error: 'Внутренняя ошибка сервера',
                message: 'Не удалось создать программу'
            });
        }
    }

    async getOne(req, res) {
        try {
            const programId = req.params.id;

            logger.debug('Запрос программы', {
                programId,
                ip: req.ip
            });

            const program = await Program.findByPk(programId);
            
            if (!program) {
                logger.warn('Программа не найдена', { programId });
                return res.status(404).json({ 
                    success: false,
                    error: 'Программа не найден' 
                });
            }

            res.json({
                success: true,
                data: program
            });

        } catch (error) {
            logger.error('Ошибка получения программы:', {
                error: error.message,
                programId: req.params.id,
                ip: req.ip
            });

            res.status(500).json({ 
                success: false,
                error: 'Внутренняя ошибка сервера',
                message: 'Не удалось получить программу'
            });
        }
    }

    async update(req, res) {
        try {
            const programId = req.params.id;

            logger.info('Обновление программы', {
                programId,
                ip: req.ip,
                body: req.body,
                hasFile: !!req.file
            });

            const program = await Program.findByPk(programId);
            if (!program) {
                return res.status(404).json({ 
                    success: false,
                    error: 'Программа не найдена' 
                });
            }

            const updateData = {};
            
            // Обновляем только переданные поля
            if (req.body.title !== undefined) {
                if (req.body.title.trim() === '') {
                    return res.status(400).json({
                        success: false,
                        error: 'Название не может быть пустым'
                    });
                }
                updateData.title = req.body.title.trim();
            }

            if (req.body.description !== undefined) {
                updateData.description = req.body.description ? req.body.description.trim() : null;
            }

            let oldMediaPath = null;

            // Обработка нового файла
            if (req.file) {
                oldMediaPath = program.media ? path.join('/var/www', program.media) : null;
                updateData.media = `/uploads/${req.file.filename}`;

                // Проверяем что новый файл сохранился
                const newFullPath = path.join('/var/www', updateData.media);
                if (!await fileExists(newFullPath)) {
                    logger.error('Новый файл программы не найден на диске', {
                        expectedPath: newFullPath
                    });
                    return res.status(500).json({
                        success: false,
                        error: 'Ошибка при сохранении файла'
                    });
                }
            }

            await program.update(updateData);

            // Удаляем старый файл после успешного обновления
            if (oldMediaPath) {
                await safeUnlink(oldMediaPath);
            }

            logger.info('Программа успешно обновлена', {
                programId: program.id,
                updatedFields: Object.keys(updateData)
            });

            res.json({
                success: true,
                data: program,
                message: 'Программа успешно обновлена'
            });

        } catch (error) {
            logger.error('Ошибка обновления программы:', {
                error: error.message,
                programId: req.params.id,
                ip: req.ip
            });

            // Удаляем загруженный файл если обновление не удалось
            if (req.file) {
                const filePath = path.join('/var/www/uploads', req.file.filename);
                await safeUnlink(filePath);
            }

            if (error.name === 'SequelizeValidationError') {
                return res.status(400).json({ 
                    success: false,
                    error: 'Ошибка валидации',
                    details: error.errors.map(e => e.message)
                });
            }

            res.status(500).json({ 
                success: false,
                error: 'Внутренняя ошибка сервера',
                message: 'Не удалось обновить программу'
            });
        }
    }

    async delete(req, res) {
        try {
            const programId = req.params.id;

            logger.info('Удаление программы', {
                programId,
                ip: req.ip,
                userId: req.user?.id // из authMiddleware
            });

            const program = await Program.findByPk(programId);
            if (!program) {
                return res.status(404).json({ 
                    success: false,
                    error: 'Программа не найдена' 
                });
            }

            const mediaPath = program.media ? path.join('/var/www', program.media) : null;

            await program.destroy();

            // Удаляем файл после успешного удаления записи
            if (mediaPath) {
                await safeUnlink(mediaPath);
            }

            logger.info('Программа успешно удалена', {
                programId,
                hadMedia: !!mediaPath
            });

            res.json({ 
                success: true,
                message: 'Программа успешно удалена',
                deletedId: programId
            });

        } catch (error) {
            logger.error('Ошибка удаления программы:', {
                error: error.message,
                programId: req.params.id,
                ip: req.ip
            });

            res.status(500).json({ 
                success: false,
                error: 'Внутренняя ошибка сервера',
                message: 'Не удалось удалить программу'
            });
        }
    }
}

module.exports = new ProgramController();