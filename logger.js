const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Создаем папку для логов если её нет
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Форматы для логов
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    
    // Добавляем метаданные если они есть
    if (Object.keys(meta).length > 0) {
      log += ` | ${JSON.stringify(meta)}`;
    }
    
    return log;
  })
);

const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.json()
);

// Создаем логгер
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: {
    service: 'api-server'
  },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: consoleFormat
    }),

    // File transports
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),

    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 10
    })
  ],

  // Обработка исключений
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'exceptions.log')
    })
  ],

  // Обработка rejections
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'rejections.log')
    })
  ]
});

// Morgan middleware с использованием логгера
const morganMiddleware = winston.format((info, opts) => {
  const { timestamp, level, message, ...meta } = info;
  return info;
});

// Создаем stream для morgan
const morganStream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

// Утилиты для логирования
const requestLogger = (req, res, next) => {
  logger.info('Входящий запрос', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
};

const errorLogger = (error, req, res, next) => {
  logger.error('Ошибка запроса', {
    error: error.message,
    stack: error.stack,
    method: req.method,
    url: req.url,
    ip: req.ip
  });
  next(error);
};

const databaseLogger = {
  info: (message, query = {}) => {
    logger.info(`База данных: ${message}`, { ...query });
  },
  error: (message, error = {}) => {
    logger.error(`Ошибка базы данных: ${message}`, {
      error: error.message,
      stack: error.stack
    });
  },
  query: (query, time) => {
    if (process.env.LOG_LEVEL === 'debug') {
      logger.debug('SQL запрос', { 
        query: query.sql, 
        parameters: query.bind,
        duration: `${time}ms`
      });
    }
  }
};

module.exports = {
  logger,
  morganStream,
  requestLogger,
  errorLogger,
  databaseLogger
};