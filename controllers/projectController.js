const fs = require('fs').promises;
const Project = require('../models/Project');

class ProjectController {
    async getAll(req, res) {
        try {
            const projects = await Project.findAll({
                order: [['createdAt', 'DESC']] // Сортировка по дате создания
            });
            res.json(projects);
        } catch (error) {
            console.error('Ошибка получения проектов:', error);
            res.status(500).json({ 
                error: 'Ошибка при получении списка проектов',
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

            // Проверка обязательных полей
            if (!req.body.title || req.body.title.trim() === '') {
                return res.status(400).json({ 
                    error: 'Название проекта обязательно' 
                });
            }

            // Подготовка данных для создания
            const projectData = {
                title: req.body.title.trim(),
                description: req.body.description ? req.body.description.trim() : null,
                media: null
            };

            // Обработка медиафайла
            if (req.file) {
                projectData.media = req.file.path.replace(/\\/g, '/');
            }

            // Создание проекта
            const project = await Project.create(projectData);

            res.status(201).json(project);
        } catch (error) {
            console.error('Полная ошибка создания проекта:', error);
            
            // Обработка ошибок Sequelize
            if (error.name === 'SequelizeValidationError') {
                return res.status(400).json({ 
                    error: 'Ошибка валидации',
                    details: error.errors.map(e => e.message)
                });
            }

            res.status(500).json({ 
                error: 'Ошибка при создании проекта',
                details: error.message 
            });
        }
    }

    async getOne(req, res) {
        try {
            const project = await Project.findByPk(req.params.id);
            if (!project) {
                return res.status(404).json({ error: 'Проект не найден' });
            }
            res.json(project);
        } catch (error) {
            console.error('Ошибка получения проекта:', error);
            res.status(500).json({ 
                error: 'Ошибка при получении проекта',
                details: error.message 
            });
        }
    }

    async update(req, res) {
        try {
            const project = await Project.findByPk(req.params.id);
            if (!project) {
                return res.status(404).json({ error: 'Проект не найден' });
            }

            // Подготовка данных для обновления
            const updateData = {
                title: req.body.title ? req.body.title.trim() : project.title,
                description: req.body.description ? req.body.description.trim() : project.description
            };

            // Обработка медиафайла
            if (req.file) {
                // Удаление старого файла, если существует
                if (project.media) {
                    try {
                        await fs.unlink(project.media);
                    } catch (unlinkError) {
                        console.warn('Не удалось удалить старый файл:', unlinkError);
                    }
                }
                updateData.media = req.file.path.replace(/\\/g, '/');
            }

            // Обновление проекта
            await project.update(updateData);

            res.json(project);
        } catch (error) {
            console.error('Ошибка обновления проекта:', error);
            res.status(500).json({ 
                error: 'Ошибка при обновлении проекта',
                details: error.message 
            });
        }
    }

    async delete(req, res) {
        try {
            const project = await Project.findByPk(req.params.id);
            if (!project) {
                return res.status(404).json({ error: 'Проект не найден' });
            }

            // Удаление медиафайла
            if (project.media) {
                try {
                    await fs.unlink(project.media);
                } catch (unlinkError) {
                    console.warn('Не удалось удалить файл:', unlinkError);
                }
            }

            // Удаление проекта
            await project.destroy();

            res.json({ message: 'Проект успешно удален' });
        } catch (error) {
            console.error('Ошибка удаления проекта:', error);
            res.status(500).json({ 
                error: 'Ошибка при удалении проекта',
                details: error.message 
            });
        }
    }
}

module.exports = new ProjectController();
