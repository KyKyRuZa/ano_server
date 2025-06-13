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

dotenv.config();

const app = express();
const PORT = process.env.PORT;

const logFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level.toUpperCase()}]: ${message}`;
});

const logger = winston.createLogger({
  level: 'info',
  format: combine(
    format.timestamp(),
    logFormat
  ),
  transports: [
    new transports.Console()
  ]
});

const morganMiddleware = morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
});

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morganMiddleware);

app.use('/uploads', express.static('/var/www/uploads/'));

app.use((err, req, res, next) => {
  console.error('❌ Необработанная ошибка:', err.message);
  res.status(500).json({ success: false, error: 'Внутренняя ошибка сервера' });
});

app.use('/api/auth', AuthRoute);
app.use('/api/staff', StaffRoute);
app.use('/api/projects', ProjectRoute);
app.use('/api/programs', ProgramRoute);

const options = {
  key: fs.readFileSync(process.env.SSL_KEY_PATH),
  cert: fs.readFileSync(process.env.SSL_CERT_PATH)
};

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('🔗 Подключение к базе данных установлено');

    await sequelize.sync({ force: false });
    
    https.createServer(options, app).listen(PORT, () => {
      console.log(`🔒 Сервер запущен на порту ${PORT}`);
    });

  } catch (error) {
    console.error('❌ Ошибка при запуске сервера:', error.message);
    process.exit(1);
  }
};

startServer();