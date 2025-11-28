const dotenv = require('dotenv');
const sequelize = require('./database');
const https = require('https');
const http = require('http');
const fs = require('fs');
const { app, logger } = require('./app');

dotenv.config();

const PORT = process.env.PORT || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const startServer = async () => {
    try {
        await sequelize.authenticate();
        logger.info(`🔗 Подключение к базе данных установлено (${IS_PRODUCTION ? 'production' : 'development'})`);

        await sequelize.sync({ force: false });

        let server;

        if (IS_PRODUCTION) {
            if (!fs.existsSync(process.env.SSL_KEY_PATH) || !fs.existsSync(process.env.SSL_CERT_PATH)) {
                logger.error('❌ SSL сертификаты не найдены');
                process.exit(1);
            }

            const options = {
                key: fs.readFileSync(process.env.SSL_KEY_PATH),
                cert: fs.readFileSync(process.env.SSL_CERT_PATH)
            };

            server = https.createServer(options, app).listen(PORT, () => {
                logger.info(`🔒 Продакшен HTTPS сервер запущен на порту ${PORT}`);
            });
        } else {
            // Локальная разработка с HTTP
            server = http.createServer(app).listen(PORT, 'localhost', () => {
                logger.info(`🚀 Локальный сервер запущен на http://localhost:${PORT}`);
            });
        }

        // Общий graceful shutdown
        const gracefulShutdown = async (signal) => {
            logger.info(`🛑 Получен ${signal}, завершаем работу...`);
            server.close(async () => {
                await sequelize.close();
                logger.info('✅ Соединения закрыты, сервер остановлен');
                process.exit(0);
            });
        };

        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    } catch (error) {
        logger.error(`❌ Ошибка при запуске сервера: ${error.message}`);
        process.exit(1);
    }
};

startServer();