const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const sequelize = require('./database');
const https = require('https');
const fs = require('fs');
const morgan = require('morgan');
const path = require('path');

const AuthRoute = require('./routes/AuthRoute');
const StaffRoute = require('./routes/StaffRoute');
const ProjectRoute = require('./routes/ProjectRoute');
const ProgramRoute = require('./routes/ProgramRoute');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('winston')); 

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
    const PORT = process.env.PORT ;
    https.createServer(options, app).listen(PORT, () => {
      console.log(`🔒 Сервер запущен на ${PORT}`); 
    });

  } catch (error) {
    console.error('❌ Ошибка при запуске сервера:', error.message);
    process.exit(1);
  }
};

startServer();
