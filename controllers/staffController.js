const fs = require('fs').promises;
const path = require('path');
const Staff = require('../models/Staff');
const { logger } = require('../logger');

const fileExists = async (filePath) => {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
};

const safeUnlink = async (filePath) => {
    try {
        if (await fileExists(filePath)) {
            await fs.unlink(filePath);
            logger.info('Файл сотрудника удален', { path: filePath });
            return true;
        }
        return false;
    } catch (error) {
        logger.warn('Не удалось удалить файл сотрудника', { 
            path: filePath, 
            error: error.message 
        });
        return false;
    }
};

class StaffController {
    async getAll(req, res) {
        try {
            logger.info('Запрос списка сотрудников', {
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });

            const staff = await Staff.findAll({
                order: [['createdAt', 'DESC']]
            });

            logger.debug('Список сотрудников получен', { 
                count: staff.length 
            });

            res.json({
                success: true,
                data: staff,
                count: staff.length
            });

        } catch (error) {
            logger.error('Ошибка получения сотрудников:', {
                error: error.message,
                stack: error.stack,
                ip: req.ip
            });

            res.status(500).json({ 
                success: false,
                error: 'Внутренняя ошибка сервера',
                message: 'Не удалось получить список сотрудников'
            });
        }
    }

    async create(req, res) {
        try {
            logger.info('Создание нового сотрудника', {
                ip: req.ip,
                body: req.body,
                hasFile: !!req.file
            });

            if (!req.body.fullname || req.body.fullname.trim() === '') {
                return res.status(400).json({ 
                    success: false,
                    error: 'ФИО сотрудника обязательно' 
                });
            }

            if (!req.body.position || req.body.position.trim() === '') {
                return res.status(400).json({ 
                    success: false,
                    error: 'Должность сотрудника обязательна' 
                });
            }

            if (!req.body.callsign || req.body.callsign.trim() === '') {
                return res.status(400).json({ 
                    success: false,
                    error: 'Позывной сотрудника обязателен' 
                });
            }

            const staffData = {
                fullname: req.body.fullname.trim(),
                position: req.body.position.trim(),
                callsign: req.body.callsign.trim(),
                description: req.body.description ? req.body.description.trim() : null,
                media: null
            };

            if (req.file) {
                staffData.media = `/uploads/${req.file.filename}`;
                
                const fullPath = path.join('/var/www', staffData.media);
                if (!await fileExists(fullPath)) {
                    logger.error('Загруженный файл сотрудника не найден на диске', {
                        expectedPath: fullPath,
                        filename: req.file.filename
                    });
                    return res.status(500).json({
                        success: false,
                        error: 'Ошибка при сохранении файла'
                    });
                }
            }

            const staff = await Staff.create(staffData);

            logger.info('Сотрудник успешно создан', {
                staffId: staff.id,
                fullname: staff.fullname,
                callsign: staff.callsign,
                hasMedia: !!staff.media
            });

            res.status(201).json({
                success: true,
                data: staff,
                message: 'Сотрудник успешно создан'
            });

        } catch (error) {
            logger.error('Ошибка создания сотрудника:', {
                error: error.message,
                stack: error.stack,
                body: req.body,
                ip: req.ip
            });

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
                const field = error.errors[0]?.path;
                if (field === 'callsign') {
                    return res.status(400).json({
                        success: false,
                        error: 'Сотрудник с таким позывным уже существует'
                    });
                }
                return res.status(400).json({
                    success: false,
                    error: 'Нарушение уникальности данных'
                });
            }

            res.status(500).json({ 
                success: false,
                error: 'Внутренняя ошибка сервера',
                message: 'Не удалось создать сотрудника'
            });
        }
    }

    async getOne(req, res) {
        try {
            const staffId = req.params.id;

            logger.debug('Запрос сотрудника', {
                staffId,
                ip: req.ip
            });

            const staff = await Staff.findByPk(staffId);
            
            if (!staff) {
                logger.warn('Сотрудник не найден', { staffId });
                return res.status(404).json({ 
                    success: false,
                    error: 'Сотрудник не найден' 
                });
            }

            res.json({
                success: true,
                data: staff
            });

        } catch (error) {
            logger.error('Ошибка получения сотрудника:', {
                error: error.message,
                staffId: req.params.id,
                ip: req.ip
            });

            res.status(500).json({ 
                success: false,
                error: 'Внутренняя ошибка сервера',
                message: 'Не удалось получить сотрудника'
            });
        }
    }

    async update(req, res) {
        try {
            const staffId = req.params.id;

            logger.info('Обновление сотрудника', {
                staffId,
                ip: req.ip,
                body: req.body,
                hasFile: !!req.file
            });

            const staff = await Staff.findByPk(staffId);
            if (!staff) {
                return res.status(404).json({ 
                    success: false,
                    error: 'Сотрудник не найден' 
                });
            }

            const updateData = {};
            
            if (req.body.fullname !== undefined) {
                if (req.body.fullname.trim() === '') {
                    return res.status(400).json({
                        success: false,
                        error: 'ФИО не может быть пустым'
                    });
                }
                updateData.fullname = req.body.fullname.trim();
            }

            if (req.body.position !== undefined) {
                if (req.body.position.trim() === '') {
                    return res.status(400).json({
                        success: false,
                        error: 'Должность не может быть пустой'
                    });
                }
                updateData.position = req.body.position.trim();
            }

            if (req.body.callsign !== undefined) {
                if (req.body.callsign.trim() === '') {
                    return res.status(400).json({
                        success: false,
                        error: 'Позывной не может быть пустым'
                    });
                }
                updateData.callsign = req.body.callsign.trim();
            }

            if (req.body.description !== undefined) {
                updateData.description = req.body.description ? req.body.description.trim() : null;
            }

            if (req.body.email !== undefined) {
                updateData.email = req.body.email || null;
            }

            if (req.body.phone !== undefined) {
                updateData.phone = req.body.phone || null;
            }

            if (req.body.is_active !== undefined) {
                updateData.is_active = Boolean(req.body.is_active);
            }

            let oldMediaPath = null;

            if (req.file) {
                oldMediaPath = staff.media ? path.join('/var/www', staff.media) : null;
                updateData.media = `/uploads/${req.file.filename}`;

                const newFullPath = path.join('/var/www', updateData.media);
                if (!await fileExists(newFullPath)) {
                    logger.error('Новый файл сотрудника не найден на диске', {
                        expectedPath: newFullPath
                    });
                    return res.status(500).json({
                        success: false,
                        error: 'Ошибка при сохранении файла'
                    });
                }
            }

            await staff.update(updateData);

            if (oldMediaPath) {
                await safeUnlink(oldMediaPath);
            }

            logger.info('Сотрудник успешно обновлен', {
                staffId: staff.id,
                updatedFields: Object.keys(updateData)
            });

            res.json({
                success: true,
                data: staff,
                message: 'Сотрудник успешно обновлен'
            });

        } catch (error) {
            logger.error('Ошибка обновления сотрудника:', {
                error: error.message,
                staffId: req.params.id,
                ip: req.ip
            });

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
                const field = error.errors[0]?.path;
                if (field === 'callsign') {
                    return res.status(400).json({
                        success: false,
                        error: 'Сотрудник с таким позывным уже существует'
                    });
                }
                return res.status(400).json({
                    success: false,
                    error: 'Нарушение уникальности данных'
                });
            }

            res.status(500).json({ 
                success: false,
                error: 'Внутренняя ошибка сервера',
                message: 'Не удалось обновить сотрудника'
            });
        }
    }

    async delete(req, res) {
        try {
            const staffId = req.params.id;

            logger.info('Удаление сотрудника', {
                staffId,
                ip: req.ip,
                userId: req.user?.id
            });

            const staff = await Staff.findByPk(staffId);
            if (!staff) {
                return res.status(404).json({ 
                    success: false,
                    error: 'Сотрудник не найден' 
                });
            }

            const mediaPath = staff.media ? path.join('/var/www', staff.media) : null;

            await staff.destroy();

            if (mediaPath) {
                await safeUnlink(mediaPath);
            }

            logger.info('Сотрудник успешно удален', {
                staffId,
                fullname: staff.fullname,
                callsign: staff.callsign,
                hadMedia: !!mediaPath
            });

            res.json({ 
                success: true,
                message: 'Сотрудник успешно удален',
                deletedId: staffId
            });

        } catch (error) {
            logger.error('Ошибка удаления сотрудника:', {
                error: error.message,
                staffId: req.params.id,
                ip: req.ip
            });

            res.status(500).json({ 
                success: false,
                error: 'Внутренняя ошибка сервера',
                message: 'Не удалось удалить сотрудника'
            });
        }
    }
}

module.exports = new StaffController();