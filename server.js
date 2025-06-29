const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const sequelize = require('./database');
const https = require('https');
const fs = require('fs');
const morgan = require('morgan');
const path = require('path');
const winston = require('winston');
const { format, transports } = winston;
const { combine, printf } = format;

const AuthRoute = require('./routes/AuthRoute');
const StaffRoute = require('./routes/StaffRoute');
const ProjectRoute = require('./routes/ProjectRoute');
const ProgramRoute = require('./routes/ProgramRoute');
const ProductRoute = require('./routes/ProductRoute');

dotenv.config();

const app = express();
const PORT = process.env.PORT;

// Формат Winston без timestamp — он будет в morgan
const logFormat = printf(({ level, message }) => {
  return `[${level.toUpperCase()}]: ${message}`;
});

const logger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    new transports.Console()
  ]
});

// Morgan middleware с нужным форматом
const morganMiddleware = morgan((tokens, req, res) => {
  const date = new Date().toISOString().replace('T', ' ').split('.')[0]; // "2025-06-13 14:30:00"
  const method = tokens.method(req, res);
  const url = tokens.url(req, res);
  const status = tokens.status(req, res);
  const responseTime = tokens['response-time'](req, res); // в миллисекундах
  return `[${date}] ${method} ${url} ${status} ${responseTime} ms`;
}, {
  stream: {
    write: (message) => logger.info(message.trim())
  }
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morganMiddleware);

app.use('/uploads', express.static('/var/www/uploads'));

// Централизованная обработка ошибок
app.use((err, req, res, next) => {
  console.error('❌ Необработанная ошибка:', err.message);
  logger.error(`Необработанная ошибка: ${err.message}`);
  res.status(500).json({ success: false, error: 'Внутренняя ошибка сервера' });
});

// Роуты
app.use('/api/auth', AuthRoute);
app.use('/api/staff', StaffRoute);
app.use('/api/projects', ProjectRoute);
app.use('/api/programs', ProgramRoute);
app.use('/api/products', ProductRoute);

// SSL опции
const options = {
  key: fs.readFileSync(process.env.SSL_KEY_PATH),
  cert: fs.readFileSync(process.env.SSL_CERT_PATH)
};

// Запуск сервера
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('🔗 Подключение к базе данных установлено');

    await sequelize.sync({ force: false });

    https.createServer(options, app).listen(PORT, () => {
      console.log(`🔒 Сервер запущен на порту ${PORT}`);
    });

  } catch (error) {
    logger.error(`Ошибка при запуске сервера: ${error.message}`);
    process.exit(1);
  }
};

startServer();