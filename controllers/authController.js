const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const { logger } = require('../logger');

require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '24h';

const generateToken = (admin) => {
  return jwt.sign({ 
    id: admin.id, 
    login: admin.login 
  }, JWT_SECRET, { 
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'your-app-name',
    subject: admin.id.toString()
  });
};

const login = async (req, res) => {
  try {
    const { login: username, password } = req.body;
    
    if (!username || !password) {
      logger.warn('Попытка входа без логина или пароля', { 
        ip: req.ip,
        hasLogin: !!username,
        hasPassword: !!password 
      });
      return res.status(400).json({ 
        success: false,
        error: 'Логин и пароль обязательны' 
      });
    }

    logger.info('Попытка входа', { login: username, ip: req.ip });

    const admin = await Admin.findOne({ where: { login: username } }); 
    
    if (!admin) {
      logger.warn('Администратор не найден', { login: username, ip: req.ip });
      return res.status(401).json({ 
        success: false,
        error: 'Неверный логин или пароль' 
      });
    }

    const isMatch = await bcrypt.compare(password.trim(), admin.password);

    if (!isMatch) {
      logger.warn('Неверный пароль', { login: username, ip: req.ip });
      return res.status(401).json({ 
        success: false,
        error: 'Неверный логин или пароль' 
      });
    }

    const token = generateToken(admin);
    
    logger.info('Успешная авторизация', { 
      adminId: admin.id, 
      login: admin.login,
      ip: req.ip 
    });
    
    res.json({
      success: true,
      token,
      admin: { 
        id: admin.id, 
        login: admin.login 
      }
    });

  } catch (error) {
    logger.error('Ошибка в login', {
      error: error.message,
      stack: error.stack,
      ip: req.ip
    });
    
    res.status(500).json({ 
      success: false,
      error: 'Внутренняя ошибка сервера' 
    });
  }
};

const verify = async (req, res) => {
  try {
    res.json({
      success: true,
      admin: {
        id: req.user.id,
        login: req.user.login
      }
    });
  } catch (error) {
    logger.error('Ошибка в verify', {
      error: error.message,
      userId: req.user?.id
    });
    
    res.status(500).json({ 
      success: false,
      error: 'Ошибка проверки токена' 
    });
  }
};

const logout = async (req, res) => {
  try {
    logger.info('Выход из системы', { 
      adminId: req.user.id,
      login: req.user.login,
      ip: req.ip 
    });
    
    res.json({
      success: true,
      message: 'Успешный выход из системы'
    });
  } catch (error) {
    logger.error('Ошибка в logout', {
      error: error.message,
      userId: req.user?.id
    });
    
    res.status(500).json({ 
      success: false,
      error: 'Ошибка при выходе из системы' 
    });
  }
};

module.exports = {
  login,
  verify,
  logout
};