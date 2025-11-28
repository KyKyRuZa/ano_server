const Article = require('../models/Article');
const { logger } = require('../logger');

class ArticleController {
    async getAll(req, res) {
        try {
            logger.info('Запрос списка статей', {
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });

            const { page = 1, limit = 10, sortBy = 'date', order = 'DESC' } = req.query;
            const offset = (page - 1) * limit;

            const articles = await Article.findAndCountAll({
                order: [[sortBy, order.toUpperCase()]],
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            logger.debug('Список статей получен', { 
                count: articles.count,
                returned: articles.rows.length,
                page: parseInt(page),
                limit: parseInt(limit)
            });

            res.json({
                success: true,
                data: articles.rows,
                pagination: {
                    current: parseInt(page),
                    total: Math.ceil(articles.count / limit),
                    totalItems: articles.count,
                    hasNext: page * limit < articles.count,
                    hasPrev: page > 1
                }
            });

        } catch (error) {
            logger.error('Ошибка получения статей:', {
                error: error.message,
                stack: error.stack,
                ip: req.ip
            });

            res.status(500).json({ 
                success: false,
                error: 'Внутренняя ошибка сервера',
                message: 'Не удалось получить список статей'
            });
        }
    }

    async create(req, res) {
        try {
            logger.info('Создание новой статьи', {
                ip: req.ip,
                body: req.body
            });

            // Валидация обязательных полей
            if (!req.body.title || req.body.title.trim() === '') {
                return res.status(400).json({ 
                    success: false,
                    error: 'Заголовок статьи обязателен' 
                });
            }

            if (!req.body.url || req.body.url.trim() === '') {
                return res.status(400).json({ 
                    success: false,
                    error: 'URL статьи обязателен' 
                });
            }

            if (!req.body.date) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Дата статьи обязательна' 
                });
            }

            const articleData = {
                title: req.body.title.trim(),
                url: req.body.url.trim(),
                date: req.body.date
            };

            const article = await Article.create(articleData);

            logger.info('Статья успешно создана', {
                articleId: article.id,
                title: article.title,
                date: article.date
            });

            res.status(201).json({
                success: true,
                data: article,
                message: 'Статья успешно создана'
            });

        } catch (error) {
            logger.error('Ошибка создания статьи:', {
                error: error.message,
                stack: error.stack,
                body: req.body,
                ip: req.ip
            });

            if (error.name === 'SequelizeValidationError') {
                const errors = error.errors.map(e => {
                    if (e.path === 'title') return 'Заголовок не может быть пустым';
                    if (e.path === 'url') return 'URL должен быть корректным';
                    if (e.path === 'date') return 'Дата должна быть корректной';
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
                    error: 'Статья с таким URL уже существует'
                });
            }

            res.status(500).json({ 
                success: false,
                error: 'Внутренняя ошибка сервера',
                message: 'Не удалось создать статью'
            });
        }
    }

    async getOne(req, res) {
        try {
            const articleId = req.params.id;

            logger.debug('Запрос статьи', {
                articleId,
                ip: req.ip
            });

            const article = await Article.findByPk(articleId);
            
            if (!article) {
                logger.warn('Статья не найдена', { articleId });
                return res.status(404).json({ 
                    success: false,
                    error: 'Статья не найдена' 
                });
            }

            res.json({
                success: true,
                data: article
            });

        } catch (error) {
            logger.error('Ошибка получения статьи:', {
                error: error.message,
                articleId: req.params.id,
                ip: req.ip
            });

            res.status(500).json({ 
                success: false,
                error: 'Внутренняя ошибка сервера',
                message: 'Не удалось получить статью'
            });
        }
    }

    async update(req, res) {
        try {
            const articleId = req.params.id;

            logger.info('Обновление статьи', {
                articleId,
                ip: req.ip,
                body: req.body
            });

            const article = await Article.findByPk(articleId);
            if (!article) {
                return res.status(404).json({ 
                    success: false,
                    error: 'Статья не найдена' 
                });
            }

            const updateData = {};
            
            if (req.body.title !== undefined) {
                if (req.body.title.trim() === '') {
                    return res.status(400).json({
                        success: false,
                        error: 'Заголовок не может быть пустым'
                    });
                }
                updateData.title = req.body.title.trim();
            }

            if (req.body.url !== undefined) {
                if (req.body.url.trim() === '') {
                    return res.status(400).json({
                        success: false,
                        error: 'URL не может быть пустым'
                    });
                }
                updateData.url = req.body.url.trim();
            }

            if (req.body.date !== undefined) {
                updateData.date = req.body.date;
            }

            await article.update(updateData);

            logger.info('Статья успешно обновлена', {
                articleId: article.id,
                updatedFields: Object.keys(updateData)
            });

            res.json({
                success: true,
                data: article,
                message: 'Статья успешно обновлена'
            });

        } catch (error) {
            logger.error('Ошибка обновления статьи:', {
                error: error.message,
                articleId: req.params.id,
                ip: req.ip
            });

            if (error.name === 'SequelizeValidationError') {
                const errors = error.errors.map(e => {
                    if (e.path === 'title') return 'Заголовок не может быть пустым';
                    if (e.path === 'url') return 'URL должен быть корректным';
                    if (e.path === 'date') return 'Дата должна быть корректной';
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
                    error: 'Статья с таким URL уже существует'
                });
            }

            res.status(500).json({ 
                success: false,
                error: 'Внутренняя ошибка сервера',
                message: 'Не удалось обновить статью'
            });
        }
    }

    async delete(req, res) {
        try {
            const articleId = req.params.id;

            logger.info('Удаление статьи', {
                articleId,
                ip: req.ip,
                userId: req.user?.id
            });

            const article = await Article.findByPk(articleId);
            if (!article) {
                return res.status(404).json({ 
                    success: false,
                    error: 'Статья не найдена' 
                });
            }

            await article.destroy();

            logger.info('Статья успешно удалена', {
                articleId,
                title: article.title
            });

            res.json({ 
                success: true,
                message: 'Статья успешно удалена',
                deletedId: articleId
            });

        } catch (error) {
            logger.error('Ошибка удаления статьи:', {
                error: error.message,
                articleId: req.params.id,
                ip: req.ip
            });

            res.status(500).json({ 
                success: false,
                error: 'Внутренняя ошибка сервера',
                message: 'Не удалось удалить статью'
            });
        }
    }
}

module.exports = new ArticleController();