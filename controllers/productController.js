const fs = require('fs').promises;
const path = require('path');
const Product = require('../models/Product');
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
            logger.info('Файл удален', { path: filePath });
            return true;
        }
        return false;
    } catch (error) {
        logger.warn('Не удалось удалить файл', { 
            path: filePath, 
            error: error.message 
        });
        return false;
    }
};

class ProductController {
    async getAll(req, res) {
        try {
            logger.info('Запрос списка продуктов', {
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });

            const products = await Product.findAll({
                order: [['createdAt', 'DESC']]
            });

            logger.debug('Список продуктов получен', { 
                count: products.length 
            });

            res.json({
                success: true,
                data: products,
                count: products.length
            });

        } catch (error) {
            logger.error('Ошибка получения продуктов:', {
                error: error.message,
                stack: error.stack,
                ip: req.ip
            });

            res.status(500).json({ 
                success: false,
                error: 'Внутренняя ошибка сервера',
                message: 'Не удалось получить список продуктов'
            });
        }
    }

    async create(req, res) {
        try {
            logger.info('Создание нового продукта', {
                ip: req.ip,
                body: req.body,
                hasFile: !!req.file
            });

            if (!req.body.title || req.body.title.trim() === '') {
                return res.status(400).json({ 
                    success: false,
                    error: 'Название продукта обязательно' 
                });
            }

            const productData = {
                title: req.body.title.trim(),
                description: req.body.description ? req.body.description.trim() : null,
                media: null
            };

            if (req.file) {
                productData.media = `/uploads/${req.file.filename}`;
                
                const fullPath = path.join('/var/www', productData.media);
                if (!await fileExists(fullPath)) {
                    logger.error('Загруженный файл не найден на диске', {
                        expectedPath: fullPath,
                        filename: req.file.filename
                    });
                    return res.status(500).json({
                        success: false,
                        error: 'Ошибка при сохранении файла'
                    });
                }
            }

            const product = await Product.create(productData);

            logger.info('Продукт успешно создан', {
                productId: product.id,
                title: product.title,
                hasMedia: !!product.media
            });

            res.status(201).json({
                success: true,
                data: product,
                message: 'Продукт успешно создан'
            });

        } catch (error) {
            logger.error('Ошибка создания продукта:', {
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
                return res.status(400).json({
                    success: false,
                    error: 'Продукт с таким названием уже существует'
                });
            }

            res.status(500).json({ 
                success: false,
                error: 'Внутренняя ошибка сервера',
                message: 'Не удалось создать продукт'
            });
        }
    }

    async getOne(req, res) {
        try {
            const productId = req.params.id;

            logger.debug('Запрос продукта', {
                productId,
                ip: req.ip
            });

            const product = await Product.findByPk(productId);
            
            if (!product) {
                logger.warn('Продукт не найден', { productId });
                return res.status(404).json({ 
                    success: false,
                    error: 'Продукт не найден' 
                });
            }

            res.json({
                success: true,
                data: product
            });

        } catch (error) {
            logger.error('Ошибка получения продукта:', {
                error: error.message,
                productId: req.params.id,
                ip: req.ip
            });

            res.status(500).json({ 
                success: false,
                error: 'Внутренняя ошибка сервера',
                message: 'Не удалось получить продукт'
            });
        }
    }

    async update(req, res) {
        try {
            const productId = req.params.id;

            logger.info('Обновление продукта', {
                productId,
                ip: req.ip,
                body: req.body,
                hasFile: !!req.file
            });

            const product = await Product.findByPk(productId);
            if (!product) {
                return res.status(404).json({ 
                    success: false,
                    error: 'Продукт не найден' 
                });
            }

            const updateData = {};
            
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

            if (req.file) {
                oldMediaPath = product.media ? path.join('/var/www', product.media) : null;
                updateData.media = `/uploads/${req.file.filename}`;

                const newFullPath = path.join('/var/www', updateData.media);
                if (!await fileExists(newFullPath)) {
                    logger.error('Новый файл не найден на диске', {
                        expectedPath: newFullPath
                    });
                    return res.status(500).json({
                        success: false,
                        error: 'Ошибка при сохранении файла'
                    });
                }
            }

            await product.update(updateData);

            if (oldMediaPath) {
                await safeUnlink(oldMediaPath);
            }

            logger.info('Продукт успешно обновлен', {
                productId: product.id,
                updatedFields: Object.keys(updateData)
            });

            res.json({
                success: true,
                data: product,
                message: 'Продукт успешно обновлен'
            });

        } catch (error) {
            logger.error('Ошибка обновления продукта:', {
                error: error.message,
                productId: req.params.id,
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

            res.status(500).json({ 
                success: false,
                error: 'Внутренняя ошибка сервера',
                message: 'Не удалось обновить продукт'
            });
        }
    }

    async delete(req, res) {
        try {
            const productId = req.params.id;

            logger.info('Удаление продукта', {
                productId,
                ip: req.ip,
                userId: req.user?.id
            });

            const product = await Product.findByPk(productId);
            if (!product) {
                return res.status(404).json({ 
                    success: false,
                    error: 'Продукт не найден' 
                });
            }

            const mediaPath = product.media ? path.join('/var/www', product.media) : null;

            await product.destroy();

            if (mediaPath) {
                await safeUnlink(mediaPath);
            }

            logger.info('Продукт успешно удален', {
                productId,
                hadMedia: !!mediaPath
            });

            res.json({ 
                success: true,
                message: 'Продукт успешно удален',
                deletedId: productId
            });

        } catch (error) {
            logger.error('Ошибка удаления продукта:', {
                error: error.message,
                productId: req.params.id,
                ip: req.ip
            });

            res.status(500).json({ 
                success: false,
                error: 'Внутренняя ошибка сервера',
                message: 'Не удалось удалить продукт'
            });
        }
    }
}

module.exports = new ProductController();