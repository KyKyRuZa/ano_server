const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
require('dotenv').config();


const generateToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '24h'
    });
};

const generateRefreshToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
        expiresIn: '7d'
    });
};

const AuthController = {
    async login(req, res) {
        try {
            const { login, password } = req.body;

            console.log('Попытка входа:', login);

            if (!login || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'Логин и пароль обязательны'
                });
            }

            // Найти пользователя в базе данных
            const admin = await Admin.findOne({ where: { login } });

            if (!admin) {
                return res.status(401).json({
                    success: false,
                    error: 'Неверный логин или пароль'
                });
            }

            // Проверить пароль
            const isPasswordValid = await bcrypt.compare(password, admin.password);

            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    error: 'Неверный логин или пароль'
                });
            }

            // Генерировать токены
            const tokenPayload = {
                id: admin.id,
                login: admin.login
            };

            const token = generateToken(tokenPayload);
            const refreshToken = generateRefreshToken(tokenPayload);

            console.log('Успешный вход для:', login);

            res.json({
                success: true,
                message: 'Успешный вход',
                token,
                refreshToken,
                admin: {
                    id: admin.id,
                    login: admin.login
                }
            });

        } catch (error) {
            console.error('Ошибка при авторизации:', error);
            res.status(500).json({
                success: false,
                error: 'Ошибка при авторизации',
                details: error.message
            });
        }
    },

    async register(req, res) {
        try {
            const { login, password } = req.body;

            if (!login || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'Логин и пароль обязательны'
                });
            }

            // Проверить, существует ли пользователь
            const existingAdmin = await Admin.findOne({ where: { login } });

            if (existingAdmin) {
                return res.status(400).json({
                    success: false,
                    error: 'Пользователь с таким логином уже существует'
                });
            }

            // Хешировать пароль
            const hashedPassword = await bcrypt.hash(password, 10);

            // Создать нового пользователя
            const admin = await Admin.create({
                login,
                password: hashedPassword
            });

            const tokenPayload = {
                id: admin.id,
                login: admin.login
            };

            const token = generateToken(tokenPayload);
            const refreshToken = generateRefreshToken(tokenPayload);

            res.status(201).json({
                success: true,
                message: 'Пользователь успешно создан',
                token,
                refreshToken,
                admin: {
                    id: admin.id,
                    login: admin.login
                }
            });

        } catch (error) {
            console.error('Ошибка при регистрации:', error);
            res.status(500).json({
                success: false,
                error: 'Ошибка при регистрации',
                details: error.message
            });
        }
    },

    async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                return res.status(400).json({
                    success: false,
                    error: 'Refresh token обязателен'
                });
            }

            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key');
            
            const tokenPayload = {
                id: decoded.id,
                login: decoded.login
            };

            const newToken = generateToken(tokenPayload);
            const newRefreshToken = generateRefreshToken(tokenPayload);

            res.json({
                success: true,
                token: newToken,
                refreshToken: newRefreshToken
            });

        } catch (error) {
            console.error('Ошибка обновления токена:', error);
            res.status(401).json({
                success: false,
                error: 'Недействительный refresh token'
            });
        }
    }
};

module.exports = AuthController;
