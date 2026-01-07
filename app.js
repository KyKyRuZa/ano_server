const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
dotenv.config();

const AuthRoute = require('./routes/AuthRoute');
const StaffRoute = require('./routes/StaffRoute');
const ProjectRoute = require('./routes/ProjectRoute');
const ProgramRoute = require('./routes/ProgramRoute');
const ProductRoute = require('./routes/ProductRoute');
const articleRoutes = require('./routes/ArticleRoutes');
const letterRoutes = require('./routes/LettersRoute');

const { logger, morganStream } = require('./logger');

const app = express();

const morganMiddleware = morgan((tokens, req, res) => {
    const date = new Date().toISOString().replace('T', ' ').split('.')[0];
    return `[${date}] ${tokens.method(req, res)} ${tokens.url(req, res)} ${tokens.status(req, res)} ${tokens['response-time'](req, res)} ms`;
}, { stream: morganStream });

app.use(cors({
    origin: process.env.CORS_ORIGINS.split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morganMiddleware);

app.use('/uploads', express.static('/var/www/uploads'));

app.use('/api/auth', AuthRoute);
app.use('/api/staff', StaffRoute);
app.use('/api/projects', ProjectRoute);
app.use('/api/programs', ProgramRoute);
app.use('/api/products', ProductRoute);
app.use('/api/articles', articleRoutes);
app.use('/api/letters', letterRoutes);

app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString() 
    });
});

app.use((err, req, res, next) => {
    logger.error(`Необработанная ошибка: ${err.message}`);
    res.status(500).json({ 
        success: false, 
        error: process.env.NODE_ENV === 'production' 
            ? 'Внутренняя ошибка сервера' 
            : err.message,
        timestamp: new Date().toISOString()
    });
});

app.use((req, res) => {
    logger.warn('Маршрут не найден', { 
        path: req.originalUrl, 
        method: req.method 
    });
    
    res.status(404).json({
        success: false,
        error: 'Маршрут не найден',
        path: req.originalUrl,
        timestamp: new Date().toISOString()
    });
});

module.exports = { app, logger };