const fs = require('fs').promises;
const path = require('path');
const Program = require('../models/Program');

// Функция для проверки существования файла
async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

class ProgramController {
    async getAll(req, res) {
        try {
            const programs = await Program.findAll({
                order: [['createdAt', 'DESC']]
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

            if (!req.body.title || req.body.title.trim() === '') {
                return res.status(400).json({ 
                    error: 'Название программы обязательно' 
                });
            }

            const programData = {
                title: req.body.title.trim(),
                description: req.body.description ? req.body.description.trim() : null,
                media: null
            };

            if (req.file) {
                programData.media = `/uploads/${req.file.filename}`;
            }

            const program = await Program.create(programData);

            res.status(201).json(program);
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

            const updateData = {
                title: req.body.title ? req.body.title.trim() : program.title,
                description: req.body.description ? req.body.description.trim() : program.description
            };

            if (req.file) {
                // Удаление старого файла, если существует
                if (program.media) {
                    const fullPath = path.join('/var/www', program.media); // <-- здесь формируем полный путь
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

            if (program.media) {
                const fullPath = path.join('/var/www', program.media); // <-- здесь формируем полный путь
                try {
                    if (await fileExists(fullPath)) {
                        await fs.unlink(fullPath);
                    }
                } catch (unlinkError) {
                    console.warn('Не удалось удалить файл:', unlinkError);
                }
            }

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