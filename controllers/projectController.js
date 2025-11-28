const fs = require('fs').promises;
const path = require('path');
const Project = require('../models/Project');
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
            logger.info('Файл проекта удален', { path: filePath });
            return true;
        }
        return false;
    } catch (error) {
        logger.warn('Не удалось удалить файл проекта', { 
            path: filePath, 
            error: error.message 
        });
        return false;
    }
};

class ProjectController {
    async getAll(req, res) {
        try {
            logger.info('Запрос списка проектов', {
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });

            const projects = await Project.findAll({
                order: [['createdAt', 'DESC']]
            });

            logger.debug('Список проектов получен', { 
                count: projects.length 
            });

            res.json({
                success: true,
                data: projects,
                count: projects.length
            });

        } catch (error) {
            logger.error('Ошибка получения проектов:', {
                error: error.message,
                stack: error.stack,
                ip: req.ip
            });

            res.status(500).json({ 
                success: false,
                error: 'Внутренняя ошибка сервера',
                message: 'Не удалось получить список проектов'
            });
        }
    }

    async create(req, res) {
        try {
            logger.info('Создание нового проекта', {
                ip: req.ip,
                body: req.body,
                hasFile: !!req.file
            });

            // Валидация
            if (!req.body.title || req.body.title.trim() === '') {
                return res.status(400).json({ 
                    success: false,
                    error: 'Название проекта обязательно' 
                });
            }

            const projectData = {
                title: req.body.title.trim(),
                description: req.body.description ? req.body.description.trim() : null,
                media: null
            };

            // Обработка файла
            if (req.file) {
                projectData.media = `/uploads/${req.file.filename}`;
                
                // Проверяем что файл действительно сохранился
                const fullPath = path.join('/var/www', projectData.media);
                if (!await fileExists(fullPath)) {
                    logger.error('Загруженный файл проекта не найден на диске', {
                        expectedPath: fullPath,
                        filename: req.file.filename
                    });
                    return res.status(500).json({
                        success: false,
                        error: 'Ошибка при сохранении файла'
                    });
                }
            }

            const project = await Project.create(projectData);

            logger.info('Проект успешно создан', {
                projectId: project.id,
                title: project.title,
                hasMedia: !!project.media
            });

            res.status(201).json({
                success: true,
                data: project,
                message: 'Проект успешно создан'
            });

        } catch (error) {
            logger.error('Ошибка создания проекта:', {
                error: error.message,
                stack: error.stack,
                body: req.body,
                ip: req.ip
            });

            // Удаляем загруженный файл если проект не создался
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
                    error: 'Проект с таким названием уже существует'
                });
            }

            res.status(500).json({ 
                success: false,
                error: 'Внутренняя ошибка сервера',
                message: 'Не удалось создать проект'
            });
        }
    }

    async getOne(req, res) {
        try {
            const projectId = req.params.id;

            logger.debug('Запрос проекта', {
                projectId,
                ip: req.ip
            });

            const project = await Project.findByPk(projectId);
            
            if (!project) {
                logger.warn('Проект не найден', { projectId });
                return res.status(404).json({ 
                    success: false,
                    error: 'Проект не найден' 
                });
            }

            res.json({
                success: true,
                data: project
            });

        } catch (error) {
            logger.error('Ошибка получения проекта:', {
                error: error.message,
                projectId: req.params.id,
                ip: req.ip
            });

            res.status(500).json({ 
                success: false,
                error: 'Внутренняя ошибка сервера',
                message: 'Не удалось получить проект'
            });
        }
    }

    async update(req, res) {
        try {
            const projectId = req.params.id;

            logger.info('Обновление проекта', {
                projectId,
                ip: req.ip,
                body: req.body,
                hasFile: !!req.file
            });

            const project = await Project.findByPk(projectId);
            if (!project) {
                return res.status(404).json({ 
                    success: false,
                    error: 'Проект не найдена' 
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

            // Обработка дополнительных полей если они есть в модели
            if (req.body.status !== undefined) {
                updateData.status = req.body.status;
            }

            if (req.body.start_date !== undefined) {
                updateData.start_date = req.body.start_date || null;
            }

            if (req.body.end_date !== undefined) {
                updateData.end_date = req.body.end_date || null;
            }

            let oldMediaPath = null;

            // Обработка нового файла
            if (req.file) {
                oldMediaPath = project.media ? path.join('/var/www', project.media) : null;
                updateData.media = `/uploads/${req.file.filename}`;

                // Проверяем что новый файл сохранился
                const newFullPath = path.join('/var/www', updateData.media);
                if (!await fileExists(newFullPath)) {
                    logger.error('Новый файл проекта не найден на диске', {
                        expectedPath: newFullPath
                    });
                    return res.status(500).json({
                        success: false,
                        error: 'Ошибка при сохранении файла'
                    });
                }
            }

            await project.update(updateData);

            // Удаляем старый файл после успешного обновления
            if (oldMediaPath) {
                await safeUnlink(oldMediaPath);
            }

            logger.info('Проект успешно обновлен', {
                projectId: project.id,
                updatedFields: Object.keys(updateData)
            });

            res.json({
                success: true,
                data: project,
                message: 'Проект успешно обновлен'
            });

        } catch (error) {
            logger.error('Ошибка обновления проекта:', {
                error: error.message,
                projectId: req.params.id,
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
                message: 'Не удалось обновить проект'
            });
        }
    }

    async delete(req, res) {
        try {
            const projectId = req.params.id;

            logger.info('Удаление проекта', {
                projectId,
                ip: req.ip,
                userId: req.user?.id // из authMiddleware
            });

            const project = await Project.findByPk(projectId);
            if (!project) {
                return res.status(404).json({ 
                    success: false,
                    error: 'Проект не найден' 
                });
            }

            const mediaPath = project.media ? path.join('/var/www', project.media) : null;

            await project.destroy();

            // Удаляем файл после успешного удаления записи
            if (mediaPath) {
                await safeUnlink(mediaPath);
            }

            logger.info('Проект успешно удален', {
                projectId,
                hadMedia: !!mediaPath
            });

            res.json({ 
                success: true,
                message: 'Проект успешно удален',
                deletedId: projectId
            });

        } catch (error) {
            logger.error('Ошибка удаления проекта:', {
                error: error.message,
                projectId: req.params.id,
                ip: req.ip
            });

            res.status(500).json({ 
                success: false,
                error: 'Внутренняя ошибка сервера',
                message: 'Не удалось удалить проект'
            });
        }
    }
}

module.exports = new ProjectController();