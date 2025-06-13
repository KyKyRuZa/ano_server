const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    // Получаем токен из заголовка
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
        return res.status(401).json({ error: 'Токен не предоставлен' });
    }

    // Извлекаем токен (удаляем префикс "Bearer ")
    const token = authHeader.split(' ')[1];

    try {
        // Проверяем токен
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        
        // Добавляем информацию о пользователе в объект запроса
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Токен истек' });
        }
        return res.status(401).json({ error: 'Неверный токен' });
    }
};

module.exports = authMiddleware;
