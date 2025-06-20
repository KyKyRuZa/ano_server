const fs = require('fs').promises;
const Staff = require('../models/Staff');
const path = require('path');

// Функция для проверки существования файла
async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

class StaffController {
    async getAll(req, res) {
        try {
            const staff = await Staff.findAll();
            res.json(staff);
        } catch (error) {
            res.status(500).json({ error: 'Ошибка при получении списка сотрудников' });
        }
    }

    async create(req, res) {
        try {
            let mediaPath = null;
            if (req.file) {
                mediaPath = `/uploads/${req.file.filename}`;
            }

            const staff = await Staff.create({
                fullname: req.body.fullname || req.body.name,
                position: req.body.position,
                callsign: req.body.callsign || null,
                description: req.body.description || req.body.about || null,
                media: mediaPath
            });

            res.status(201).json(staff);
        } catch (error) {
            console.error('Ошибка создания сотрудника:', error);
            res.status(500).json({ 
                error: 'Ошибка при создании сотрудника',
                details: error.message 
            });
        }
    }

    async getOne(req, res) {
        try {
            const staff = await Staff.findByPk(req.params.id);
            if (!staff) {
                return res.status(404).json({ error: 'Сотрудник не найден' });
            }
            res.json(staff);
        } catch (error) {
            res.status(500).json({ error: 'Ошибка при получении сотрудника' });
        }
    }

    async update(req, res) {
        try {
            const staff = await Staff.findByPk(req.params.id);
            if (!staff) {
                return res.status(404).json({ error: 'Сотрудник не найден' });
            }

            let mediaPath = staff.media;

            if (req.file) {
                // Удаляем старый файл, если существует
                if (staff.media) {
                    try {
                        const fullPath = `/var/www${staff.media}`;
                        if (await fileExists(fullPath)) {
                            await fs.unlink(fullPath);
                        }
                    } catch (err) {
                        console.warn('Не удалось удалить старый файл:', err);
                    }
                }

                mediaPath = `/uploads/${req.file.filename}`;
            }

            await staff.update({
                fullname: req.body.fullname || req.body.name,
                position: req.body.position,
                callsign: req.body.callsign || null,
                description: req.body.description || req.body.about || null,
                media: mediaPath
            });

            res.json(staff);
        } catch (error) {
            console.error('Ошибка обновления сотрудника:', error);
            res.status(500).json({ 
                error: 'Ошибка при обновлении сотрудника',
                details: error.message 
            });
        }
    }

    async delete(req, res) {
        try {
            const staff = await Staff.findByPk(req.params.id);
            if (!staff) {
                return res.status(404).json({ error: 'Сотрудник не найден' });
            }

            if (staff.media) {
                try {
                    const fullPath = `/var/www${staff.media}`;
                    if (await fileExists(fullPath)) {
                        await fs.unlink(fullPath);
                    }
                } catch (unlinkError) {
                    console.warn('Не удалось удалить файл:', unlinkError);
                }
            }

            await staff.destroy();
            res.json({ message: 'Сотрудник успешно удален' });
        } catch (error) {
            res.status(500).json({ 
                error: 'Ошибка при удалении сотрудника',
                details: error.message 
            });
        }
    }
}

module.exports = new StaffController();