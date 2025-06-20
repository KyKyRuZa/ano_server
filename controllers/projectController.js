const fs = require('fs').promises;
const Project = require('../models/Project');

// Функция для проверки существования файла
async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

class ProjectController {
    async getAll(req, res) {
        try {
            const projects = await Project.findAll({
                order: [['createdAt', 'DESC']]
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

            if (!req.body.title || req.body.title.trim() === '') {
                return res.status(400).json({ 
                    error: 'Название проекта обязательно' 
                });
            }

            const projectData = {
                title: req.body.title.trim(),
                description: req.body.description ? req.body.description.trim() : null,
                media: null
            };

            if (req.file) {
                projectData.media = `/uploads/${req.file.filename}`;
            }

            const project = await Project.create(projectData);

            res.status(201).json(project);
        } catch (error) {
            console.error('Полная ошибка создания проекта:', error);
            
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

            const updateData = {
                title: req.body.title ? req.body.title.trim() : project.title,
                description: req.body.description ? req.body.description.trim() : project.description
            };

            if (req.file) {
                // Формируем полный путь к старому файлу
                if (project.media) {
                    const fullPath = path.join('/var/www', project.media); // <-- здесь формируем полный путь
                    try {
                        if (await fileExists(fullPath)) {
                            await fs.unlink(fullPath);
                        }
                    } catch (unlinkError) {
                        console.warn('Не удалось удалить старый файл:', unlinkError);
                    }
                }

                updateData.media = `/uploads/${req.file.filename}`;
            }

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

            if (project.media) {
                const fullPath = path.join('/var/www', project.media); // <-- здесь формируем полный путь
                try {
                    if (await fileExists(fullPath)) {
                        await fs.unlink(fullPath);
                    }
                } catch (unlinkError) {
                    console.warn('Не удалось удалить файл:', unlinkError);
                }
            }

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