const fs = require('fs').promises;
const Program = require('../models/Program');

class ProgramController {
    async getAll(req, res) {
        try {
            const programs = await Program.findAll({
                order: [['createdAt', 'DESC']] // Сортировка по дате создания
            });
            res.json(programs);
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

            // Проверка обязательных полей
            if (!req.body.title || req.body.title.trim() === '') {
                return res.status(400).json({ 
                    error: 'Название программы обязательно' 
                });
            }

            // Подготовка данных для создания
            const programData = {
                title: req.body.title.trim(),
                description: req.body.description ? req.body.description.trim() : null,
                media: null
            };

            // Обработка медиафайла
            if (req.file) {
                programData.media = req.file.path.replace(/\\/g, '/');
            }

            // Создание программы
            const program = await Program.create(programData);

            res.status(201).json(program);
        } catch (error) {
            console.error('Полная ошибка создания программы:', error);
            
            // Обработка ошибок Sequelize
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
            const program = await Program.findByPk(req.params.id);
            if (!program) {
                return res.status(404).json({ error: 'Программа не найдена' });
            }
            res.json(program);
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
            const program = await Program.findByPk(req.params.id);
            if (!program) {
                return res.status(404).json({ error: 'Программа не найдена' });
            }

            // Подготовка данных для обновления
            const updateData = {
                title: req.body.title ? req.body.title.trim() : program.title,
                description: req.body.description ? req.body.description.trim() : program.description
            };

            // Обработка медиафайла
            if (req.file) {
                // Удаление старого файла, если существует
                if (program.media) {
                    try {
                        await fs.unlink(program.media);
                    } catch (unlinkError) {
                        console.warn('Не удалось удалить старый файл:', unlinkError);
                    }
                }
                updateData.media = req.file.path.replace(/\\/g, '/');
            }

            // Обновление программы
            await program.update(updateData);

            res.json(program);
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
            const program = await Program.findByPk(req.params.id);
            if (!program) {
                return res.status(404).json({ error: 'Программа не найдена' });
            }

            // Удаление медиафайла
            if (program.media) {
                try {
                    await fs.unlink(program.media);
                } catch (unlinkError) {
                    console.warn('Не удалось удалить файл:', unlinkError);
                }
            }

            // Удаление программы
            await program.destroy();

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

module.exports = new ProgramController();