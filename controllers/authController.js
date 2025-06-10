const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '24h' });
};

const login = async (req, res) => {
  try {
    const { login, password } = req.body;
    console.log('Запрос на вход:', { login });

    const user = await User.findByLogin(login);
    console.log('Найденный пользователь:', user ? { 
      id: user.id, 
      login: user.login,
      hashPrefix: user.password_hash?.slice(0, 20) 
    } : null);

    if (!user) {
      console.log('Пользователь не найден');
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    console.log('Сравнение пароля:', {
      inputPassword: password,
      dbHash: user.password_hash,
      hashStartsWith: user.password_hash?.slice(0, 6)
    });

    const isMatch = await bcrypt.compare(
      password.trim(),
      user.password_hash
    );

    if (!isMatch) {
      console.log('Пароль не совпал');
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    const token = generateToken(user.id);
    console.log('Успешная авторизация. Сгенерирован токен');
    
    res.json({ 
      token,
      user: { id: user.id, login: user.login }
    });

  } catch (error) {
    console.error('Ошибка в login:', error);
    res.status(500).json({ 
      error: 'Ошибка сервера',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  login
};
