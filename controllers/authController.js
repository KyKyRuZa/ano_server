const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

function generateToken(payload) {
    try {
        console.log('Генерация токена для:', payload);
        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: '24h'
        });
        console.log('Токен успешно сгенерирован');
        return token;
    } catch (error) {
        console.error('Ошибка генерации токена:', error);
        throw error;
    }
}

function generateRefreshToken(payload) {
    try {
        console.log('Генерация refresh токена для:', payload);
        const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET , {
            expiresIn: '7d'
        });
        console.log('Refresh токен успешно сгенерирован');
        return refreshToken;
    } catch (error) {
        console.error('Ошибка генерации refresh токена:', error);
        throw error;
    }
}

const AuthController = {
    async login(req, res) {
        try {
            console.log('=== НАЧАЛО ПРОЦЕССА АВТОРИЗАЦИИ ===');
            const { login, password } = req.body;
            console.log('Данные запроса:', { login, password: password ? '***' : 'отсутствует' });

            if (!login || !password) {
                console.log('Отсутствуют обязательные поля');
                return res.status(400).json({
                    success: false,
                    error: 'Логин и пароль обязательны'
                });
            }

            console.log('Поиск пользователя в базе данных...');
            const admin = await Admin.findOne({ where: { login } });
            console.log('Результат поиска пользователя:', admin ? 'найден' : 'не найден');

            if (!admin) {
                console.log('Пользователь не найден');
                return res.status(401).json({
                    success: false,
                    error: 'Неверный логин или пароль'
                });
            }

            console.log('Проверка пароля...');
            const isPasswordValid = await bcrypt.compare(password, admin.password);
            console.log('Результат проверки пароля:', isPasswordValid);

            if (!isPasswordValid) {
                console.log('Неверный пароль');
                return res.status(401).json({
                    success: false,
                    error: 'Неверный логин или пароль'
                });
            }

            console.log('Подготовка данных для токена...');
            const tokenPayload = {
                id: admin.id,
                login: admin.login
            };
            console.log('Payload для токена:', tokenPayload);

            console.log('Генерация токенов...');
            const token = generateToken(tokenPayload);
            const refreshToken = generateRefreshToken(tokenPayload);

            console.log('Подготовка ответа...');
            const responseData = {
                success: true,
                message: 'Успешный вход',
                token,
                refreshToken,
                admin: {
                    id: admin.id,
                    login: admin.login
                }
            };

            console.log('Отправка успешного ответа');
            console.log('=== КОНЕЦ ПРОЦЕССА АВТОРИЗАЦИИ ===');
            
            res.json(responseData);

        } catch (error) {
            console.error('=== ОШИБКА В ПРОЦЕССЕ АВТОРИЗАЦИИ ===');
            console.error('Тип ошибки:', error.constructor.name);
            console.error('Сообщение ошибки:', error.message);
            console.error('Стек ошибки:', error.stack);
            console.error('=== КОНЕЦ ОШИБКИ ===');
            
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

            const existingAdmin = await Admin.findOne({ where: { login } });

            if (existingAdmin) {
                return res.status(400).json({
                    success: false,
                    error: 'Пользователь с таким логином уже существует'
                });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

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
