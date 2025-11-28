const rateLimit = require('express-rate-limit');

const createRateLimit = (windowMs, max, message, skipSuccessful = false) => {
    return rateLimit({
        windowMs,
        max,
        message: { success: false, error: message },
        skipSuccessfulRequests: skipSuccessful,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            res.status(429).json({
                success: false,
                error: message
            });
        }
    });
};

const authLimiter = createRateLimit(
    15 * 60 * 1000, 
    5,
    'Слишком много попыток входа. Попробуйте через 15 минут.',
    true
);

const apiLimiter = createRateLimit(
    15 * 60 * 1000, 
    100, 
    'Слишком много запросов'
);

const strictLimiter = createRateLimit(
    15 * 60 * 1000,
    10, 
    'Слишком много запросов на изменение данных'
);

module.exports = { authLimiter, apiLimiter, strictLimiter };