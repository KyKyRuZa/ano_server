const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
require('dotenv').config();

// Проверяем наличие переменных окружения при загрузке модуля
console.log('🔍 AuthController загружается...');
console.log('JWT_SECRET доступен:', !!process.env.JWT_SECRET);
console.log('JWT_REFRESH_SECRET доступен:', !!process.env.JWT_REFRESH_SECRET);

// Простые функции для генерации токенов
function createToken(payload) {
    console.log('📝 Создание токена для:', payload);
    
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET не найден в переменных окружения');
    }
    
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '24h'
    });
    
    console.log('✅ Токен создан успешно');
    return token;
}

function createRefreshToken(payload) {
    console.log('📝 Создание refresh токена для:', payload);
    
    if (!process.env.JWT_REFRESH_SECRET) {
        throw new Error('JWT_REFRESH_SECRET не найден в переменных окружения');
    }
    
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
        expiresIn: '7d'
    });
    
    console.log('✅ Refresh токен создан успешно');
    return refreshToken;
}

// Экспортируем объект с методами
module.exports = {
    async login(req, res) {
        console.log('🚀 === НАЧАЛО АВТОРИЗАЦИИ ===');
        
        try {
            const { login, password } = req.body;
            console.log('📥 Получены данные:', { login, password: password ? '***' : 'нет' });

            // Проверка обязательных полей
            if (!login || !password) {
                console.log('❌ Отсутствуют обязательные поля');
                return res.status(400).json({
                    success: false,
                    error: 'Логин и пароль обязательны'
                });
            }

            // Поиск пользователя
            console.log('🔍 Поиск пользователя в БД...');
            const admin = await Admin.findOne({ where: { login } });
            
            if (!admin) {
                console.log('❌ Пользователь не найден');
                return res.status(401).json({
                    success: false,
                    error: 'Неверный логин или пароль'
                });
            }
            
            console.log('✅ Пользователь найден:', admin.login);

            // Проверка пароля
            console.log('🔐 Проверка пароля...');
            const isPasswordValid = await bcrypt.compare(password, admin.password);
            
            if (!isPasswordValid) {
                console.log('❌ Неверный пароль');
                return res.status(401).json({
                    success: false,
                    error: 'Неверный логин или пароль'
                });
            }
            
            console.log('✅ Пароль верный');

            // Создание токенов
            console.log('🎫 Создание токенов...');
            const tokenPayload = {
                id: admin.id,
                login: admin.login
            };

            const token = createToken(tokenPayload);
            const refreshToken = createRefreshToken(tokenPayload);

            // Отправка ответа
            const response = {
                success: true,
                message: 'Успешный вход',
                token,
                refreshToken,
                admin: {
                    id: admin.id,
                    login: admin.login
                }
            };

            console.log('✅ === АВТОРИЗАЦИЯ ЗАВЕРШЕНА УСПЕШНО ===');
            res.json(response);

        } catch (error) {
            console.error('💥 === ОШИБКА АВТОРИЗАЦИИ ===');
            console.error('Тип:', error.constructor.name);
            console.error('Сообщение:', error.message);
            console.error('Стек:', error.stack);
            
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

            // Проверка существующего пользователя
            const existingAdmin = await Admin.findOne({ where: { login } });
            if (existingAdmin) {
                return res.status(400).json({
                    success: false,
                    error: 'Пользователь с таким логином уже существует'
                });
            }

            // Хеширование пароля
            const hashedPassword = await bcrypt.hash(password, 10);

            // Создание пользователя
            const admin = await Admin.create({
                login,
                password: hashedPassword
            });

            // Создание токенов
            const tokenPayload = {
                id: admin.id,
                login: admin.login
            };

            const token = createToken(tokenPayload);
            const refreshToken = createRefreshToken(tokenPayload);

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

            // Проверка refresh токена
            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
            
            const tokenPayload = {
                id: decoded.id,
                login: decoded.login
            };

            // Создание новых токенов
            const newToken = createToken(tokenPayload);
            const newRefreshToken = createRefreshToken(tokenPayload);

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
