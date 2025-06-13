const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
require('dotenv').config();

class AuthController {
    static generateToken(admin) {
        const JWT_SECRET = process.env.JWT_SECRET;
        return jwt.sign(
            { 
                id: admin.id, 
                login: admin.login, 
                role: admin.role 
            }, 
            JWT_SECRET, 
            { expiresIn: '1h' }
        );
    }

    static generateRefreshToken(admin) {
        const JWT_SECRET = process.env.JWT_SECRET;
        return jwt.sign(
            { 
                id: admin.id, 
                login: admin.login 
            }, 
            JWT_SECRET, 
            { expiresIn: '7d' }
        );
    }
    async register(req, res) {
        try {
            const { login, password, role = 'admin' } = req.body;
            console.log('Register Request:', req.body);
            // Проверка существования администратора с таким логином
            const existingAdmin = await Admin.findOne({ where: { login } });
            if (existingAdmin) {
                return res.status(400).json({ error: 'Администратор с таким логином уже существует' });
            }

            // Хеширование пароля
            const hashedPassword = await bcrypt.hash(password, 10);

            // Создание нового администратора
            const admin = await Admin.create({
                login,
                password: hashedPassword,
                role
            });

            // Создание JWT токена
            const token = jwt.sign(
                { 
                    id: admin.id, 
                    login: admin.login, 
                    role: admin.role 
                }, 
                process.env.JWT_SECRET, 
                { expiresIn: '24h' }
            );

            res.status(201).json({ 
                message: 'Администратор успешно зарегистрирован', 
                admin: { 
                    id: admin.id, 
                    login: admin.login, 
                    role: admin.role 
                },
                token 
            });
        } catch (error) {
            console.error('Ошибка при регистрации:', error);
            res.status(500).json({ error: 'Ошибка при регистрации', details: error.message });
        }
    }

    async login(req, res) {
        try {
            const { login, password } = req.body;

            // Поиск администратора по логину
            const admin = await Admin.findOne({ where: { login } });

            if (!admin) {
                return res.status(401).json({ error: 'Неверный логин или пароль' });
            }

            // Проверка пароля
            const isMatch = await bcrypt.compare(password, admin.password);
            if (!isMatch) {
                return res.status(401).json({ error: 'Неверный логин или пароль' });
            }

            // Генерация токенов
            const token = this.generateToken(admin);
            const refreshToken = this.generateRefreshToken(admin);

            res.json({ 
                token, 
                refreshToken,
                admin: { 
                    id: admin.id, 
                    login: admin.login, 
                    role: admin.role 
                } 
            });
        } catch (error) {
            console.error('Ошибка при авторизации:', error);
            res.status(500).json({ error: 'Ошибка при авторизации', details: error.message });
        }
    }

    async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                return res.status(401).json({ error: 'Refresh токен не предоставлен' });
            }

            const JWT_SECRET = process.env.JWT_SECRET || 'fallback_very_secret_key_123';

            try {
                // Проверяем refresh токен
                const decoded = jwt.verify(refreshToken, JWT_SECRET);

                // Находим администратора
                const admin = await Admin.findByPk(decoded.id);

                if (!admin) {
                    return res.status(401).json({ error: 'Пользователь не найден' });
                }

                // Генерируем новые токены
                const newToken = this.generateToken(admin);
                const newRefreshToken = this.generateRefreshToken(admin);

                res.json({ 
                    token: newToken, 
                    refreshToken: newRefreshToken 
                });
            } catch (error) {
                return res.status(401).json({ error: 'Неверный refresh токен' });
            }
        } catch (error) {
            console.error('Ошибка обновления токена:', error);
            res.status(500).json({ error: 'Ошибка обновления токена', details: error.message });
        }
    }
}

module.exports = new AuthController();