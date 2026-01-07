const winston = require('winston');
const path = require('path');
const fs = require('fs');

const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    
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

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: {
    service: 'api-server'
  },
  transports: [
    new winston.transports.Console({
      format: consoleFormat
    }),

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

  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'exceptions.log')
    })
  ],

  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'rejections.log')
    })
  ]
});

const morganMiddleware = winston.format((info, opts) => {
  const { timestamp, level, message, ...meta } = info;
  return info;
});

const morganStream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

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