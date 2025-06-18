const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// Функции для работы с токенами
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
    // POST /api/auth/login
    async login(req, res) {
        try {
            const { login, password } = req.body;

            // Валидация входных данных
            if (!login || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'Логин и пароль обязательны'
                });
            }

            // Поиск администратора по логину
            const admin = await Admin.findOne({ 
                where: { login } 
            });

            if (!admin) {
                return res.status(401).json({
                    success: false,
                    error: 'Неверный логин или пароль'
                });
            }

            // Проверка пароля
            const isPasswordValid = await bcrypt.compare(password, admin.password);

            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    error: 'Неверный логин или пароль'
                });
            }

            // Создание токенов
            const tokenPayload = {
                id: admin.id,
                login: admin.login
            };

            const token = generateToken(tokenPayload);
            const refreshToken = generateRefreshToken(tokenPayload);

            // Успешный ответ
            res.json({
                success: true,
                message: 'Успешный вход',
                token,
                refreshToken,
                admin: {
                    id: admin.id,
                    login: admin.login,
                    createdAt: admin.createdAt,
                    updatedAt: admin.updatedAt
                }
            });

        } catch (error) {
            console.error('Ошибка при авторизации:', error);
            res.status(500).json({
                success: false,
                error: 'Внутренняя ошибка сервера'
            });
        }
    },

    // POST /api/auth/register
    async register(req, res) {
        try {
            const { login, password } = req.body;

            // Валидация входных данных
            if (!login || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'Логин и пароль обязательны'
                });
            }

            // Проверка минимальной длины пароля
            if (password.length < 6) {
                return res.status(400).json({
                    success: false,
                    error: 'Пароль должен содержать минимум 6 символов'
                });
            }

            // Проверка существования пользователя
            const existingAdmin = await Admin.findOne({ 
                where: { login } 
            });

            if (existingAdmin) {
                return res.status(409).json({
                    success: false,
                    error: 'Пользователь с таким логином уже существует'
                });
            }

            // Хеширование пароля
            const saltRounds = 12;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // Создание нового администратора
            const admin = await Admin.create({
                login,
                password: hashedPassword
            });

            // Создание токенов
            const tokenPayload = {
                id: admin.id,
                login: admin.login
            };

            const token = generateToken(tokenPayload);
            const refreshToken = generateRefreshToken(tokenPayload);

            // Успешный ответ (без пароля)
            res.status(201).json({
                success: true,
                message: 'Администратор успешно создан',
                token,
                refreshToken,
                admin: {
                    id: admin.id,
                    login: admin.login,
                    createdAt: admin.createdAt,
                    updatedAt: admin.updatedAt
                }
            });

        } catch (error) {
            console.error('Ошибка при регистрации:', error);
            
            // Обработка ошибок Sequelize
            if (error.name === 'SequelizeUniqueConstraintError') {
                return res.status(409).json({
                    success: false,
                    error: 'Пользователь с таким логином уже существует'
                });
            }

            res.status(500).json({
                success: false,
                error: 'Внутренняя ошибка сервера'
            });
        }
    },

    // POST /api/auth/refresh-token
    async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;

            // Проверка наличия refresh token
            if (!refreshToken) {
                return res.status(400).json({
                    success: false,
                    error: 'Refresh token обязателен'
                });
            }

            // Верификация refresh token
            let decoded;
            try {
                decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
            } catch (jwtError) {
                return res.status(401).json({
                    success: false,
                    error: 'Недействительный refresh token'
                });
            }

            // Проверка существования пользователя
            const admin = await Admin.findByPk(decoded.id);
            
            if (!admin) {
                return res.status(401).json({
                    success: false,
                    error: 'Пользователь не найден'
                });
            }

            // Создание новых токенов
            const tokenPayload = {
                id: admin.id,
                login: admin.login
            };

            const newToken = generateToken(tokenPayload);
            const newRefreshToken = generateRefreshToken(tokenPayload);

            // Успешный ответ
            res.json({
                success: true,
                message: 'Токены обновлены',
                token: newToken,
                refreshToken: newRefreshToken
            });

        } catch (error) {
            console.error('Ошибка обновления токена:', error);
            res.status(500).json({
                success: false,
                error: 'Внутренняя ошибка сервера'
            });
        }
    }
};

module.exports = AuthController;
