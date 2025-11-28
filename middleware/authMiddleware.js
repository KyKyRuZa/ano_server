const jwt = require('jsonwebtoken');
const { logger } = require('../logger');

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
        logger.warn('Попытка доступа без токена', { 
            ip: req.ip, 
            url: req.originalUrl,
            method: req.method 
        });
        return res.status(401).json({ 
            success: false,
            error: 'Требуется аутентификация' 
        });
    }

    const [bearer, token] = authHeader.split(' ');
    
    if (bearer !== 'Bearer' || !token) {
        logger.warn('Неверный формат заголовка Authorization', { 
            ip: req.ip,
            header: authHeader.substring(0, 50) + '...'
        });
        return res.status(401).json({ 
            success: false,
            error: 'Неверный формат токена' 
        });
    }

    if (!process.env.JWT_SECRET) {
        logger.error('JWT_SECRET не настроен в переменных окружения');
        return res.status(500).json({ 
            success: false,
            error: 'Ошибка конфигурации сервера' 
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET, {
            algorithms: ['HS256'],
            clockTolerance: 30
        });
        
        if (!decoded.id || !decoded.login) {
            logger.warn('Неверная структура токена', { 
                ip: req.ip,
                payload: decoded 
            });
            return res.status(401).json({ 
                success: false,
                error: 'Неверный токен' 
            });
        }

        req.user = {
            id: decoded.id,
            login: decoded.login
        };

        logger.debug('Успешная аутентификация', { 
            userId: decoded.id,
            login: decoded.login,
            route: req.originalUrl 
        });

        next();

    } catch (error) {
        let errorMessage = 'Ошибка аутентификации';
        let logLevel = 'warn';

        switch (error.name) {
            case 'TokenExpiredError':
                errorMessage = 'Токен истек';
                logLevel = 'info';
                break;
            case 'JsonWebTokenError':
                if (error.message === 'invalid signature') {
                    errorMessage = 'Неверная подпись токена';
                    logLevel = 'warn';
                } else if (error.message === 'jwt malformed') {
                    errorMessage = 'Неверный формат токена';
                    logLevel = 'warn';
                } else {
                    errorMessage = 'Неверный токен';
                }
                break;
            case 'NotBeforeError':
                errorMessage = 'Токен еще не активен';
                break;
            default:
                logLevel = 'error';
                errorMessage = 'Ошибка проверки токена';
        }

        logger[logLevel]('Ошибка аутентификации', {
            error: error.message,
            name: error.name,
            ip: req.ip,
            url: req.originalUrl
        });

        return res.status(401).json({ 
            success: false,
            error: errorMessage 
        });
    }
};

module.exports = authMiddleware;