const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '24h';

const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

const login = async (req, res) => {
  try {
    const { login, password } = req.body;
    console.log('Запрос на вход:', { login });

    // 1. Находим администратора
    const admin = await Admin.findOne({ where: { login } });
    console.log('Найденный администратор:', admin ? { 
      id: admin.id, 
      login: admin.login,
      hashPrefix: admin.password?.slice(0, 20) 
    } : null);

    if (!admin) {
      console.log('Администратор не найден');
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    // 2. Проверяем пароль
    console.log('Сравнение пароля:', {
      inputPassword: password,
      dbHash: admin.password,
      hashStartsWith: admin.password?.slice(0, 6)
    });

    const trimmedPassword = password.trim();
    const adminPassword = admin.password;
    const isMatch = await bcrypt.compare(trimmedPassword, adminPassword);

    if (!isMatch) {
      console.log('Пароль не совпал');
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    // 3. Генерируем токен
    const token = generateToken(admin.id);
    console.log('Успешная авторизация. Сгенерирован токен');
    
    const responseData = { 
      token,
      admin: { 
        id: admin.id, 
        login: admin.login 
      }
    };

    res.json(responseData);

  } catch (error) {
    console.error('Ошибка в login:', error);
    
    const errorResponse = { 
      error: 'Ошибка сервера'
    };
    
    res.status(500).json(errorResponse);
  }
};

module.exports = {
  login
};
