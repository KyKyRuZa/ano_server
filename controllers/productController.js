const fs = require('fs').promises;
const path = require('path'); // не забудь подключить модуль path
const Product = require('../models/Product'); // правильно импортированная модель

class ProductController {
    async getAll(req, res) {
        try {
            const products = await Product.findAll({
                order: [['createdAt', 'DESC']]
            });
            res.json(products);
        } catch (error) {
            console.error('Ошибка получения программ:', error);
            res.status(500).json({ 
                error: 'Ошибка при получении списка программ',
                details: error.message 
            });
        }
    }

    async create(req, res) {
        try {
            console.log('Incoming create request:', {
                body: req.body,
                file: req.file
            });

            if (!req.body.title || req.body.title.trim() === '') {
                return res.status(400).json({ 
                    error: 'Название программы обязательно' 
                });
            }

            const productData = {
                title: req.body.title.trim(),
                description: req.body.description ? req.body.description.trim() : null,
                media: null
            };

            if (req.file) {
                productData.media = `uploads/${req.file.filename}`;
            }

            const product = await Product.create(productData); // здесь исправлено

            res.status(201).json(product);
        } catch (error) {
            console.error('Полная ошибка создания программы:', error);
            
            if (error.name === 'SequelizeValidationError') {
                return res.status(400).json({ 
                    error: 'Ошибка валидации',
                    details: error.errors.map(e => e.message)
                });
            }

            res.status(500).json({ 
                error: 'Ошибка при создании программы',
                details: error.message 
            });
        }
    }

    async getOne(req, res) {
        try {
            const product = await Product.findByPk(req.params.id); // здесь исправлено
            if (!product) {
                return res.status(404).json({ error: 'Программа не найдена' });
            }
            res.json(product);
        } catch (error) {
            console.error('Ошибка получения программы:', error);
            res.status(500).json({ 
                error: 'Ошибка при получении программы',
                details: error.message 
            });
        }
    }

    async update(req, res) {
        try {
            const product = await Product.findByPk(req.params.id); // здесь исправлено
            if (!product) {
                return res.status(404).json({ error: 'Программа не найдена' });
            }

            const updateData = {
                title: req.body.title ? req.body.title.trim() : product.title,
                description: req.body.description ? req.body.description.trim() : product.description
            };

            if (req.file) {
                if (product.media) {
                    try {
                        const oldFilePath = path.join(__dirname, '../uploads', path.basename(product.media));
                        await fs.access(oldFilePath);
                        await fs.unlink(oldFilePath);
                    } catch (err) {
                        console.warn('Не удалось удалить старый файл:', err);
                    }
                }
                updateData.media = `uploads/${req.file.filename}`;
            }

            await product.update(updateData);

            res.json(product);
        } catch (error) {
            console.error('Ошибка обновления программы:', error);
            res.status(500).json({ 
                error: 'Ошибка при обновлении программы',
                details: error.message 
            });
        }
    }

    async delete(req, res) {
        try {
            const product = await Product.findByPk(req.params.id); // здесь исправлено
            if (!product) {
                return res.status(404).json({ error: 'Программа не найдена' });
            }

            if (product.media) {
                try {
                    await fs.unlink(product.media);
                } catch (unlinkError) {
                    console.warn('Не удалось удалить файл:', unlinkError);
                }
            }

            await product.destroy();

            res.json({ message: 'Программа успешно удалена' });
        } catch (error) {
            console.error('Ошибка удаления программы:', error);
            res.status(500).json({ 
                error: 'Ошибка при удалении программы',
                details: error.message 
            });
        }
    }
}

module.exports = new ProductController();