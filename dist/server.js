"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const dotenv_1 = require("dotenv");
const path = __importStar(require("path"));
const fs = __importStar(require("fs/promises"));
const winston_1 = __importDefault(require("winston"));
const rate_limiter_flexible_1 = require("rate-limiter-flexible");
const image_1 = __importDefault(require("./src/routes/image"));
const video_1 = __importDefault(require("./src/routes/video"));
const upload_1 = __importDefault(require("./src/routes/upload"));
(0, dotenv_1.config)();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const PUBLIC_URL = process.env.PUBLIC_URL || `http://localhost:${PORT}`;
const logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json()),
    defaultMeta: { service: 'social-video-generator' },
    transports: [
        new winston_1.default.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            maxsize: 10485760,
            maxFiles: 5
        }),
        new winston_1.default.transports.File({
            filename: 'logs/combined.log',
            maxsize: 10485760,
            maxFiles: 5
        })
    ],
});
if (NODE_ENV !== 'production') {
    logger.add(new winston_1.default.transports.Console({
        format: winston_1.default.format.simple()
    }));
}
const rateLimiter = new rate_limiter_flexible_1.RateLimiterMemory({
    points: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    duration: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000') / 1000,
});
const rateLimiterMiddleware = async (req, res, next) => {
    try {
        await rateLimiter.consume(req.ip || 'unknown');
        next();
    }
    catch (rejRes) {
        const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
        res.set('Retry-After', String(secs));
        res.status(429).json({
            error: 'Too Many Requests',
            retryAfter: secs
        });
    }
};
app.use((0, helmet_1.default)({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));
const corsOptions = {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || [
        'http://localhost:3000',
        'http://localhost:5173',
        PUBLIC_URL
    ],
    credentials: true,
    optionsSuccessStatus: 200
};
if (process.env.ENABLE_CORS !== 'false') {
    app.use((0, cors_1.default)(corsOptions));
}
app.use((0, compression_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
if (process.env.TRUST_PROXY === 'true') {
    app.set('trust proxy', 1);
}
app.use(rateLimiterMiddleware);
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info({
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });
    });
    next();
});
app.use('/output', express_1.default.static('output', {
    maxAge: '1d',
    setHeaders: (res, path) => {
        if (path.endsWith('.mp4')) {
            res.setHeader('Content-Type', 'video/mp4');
        }
        else if (path.endsWith('.png')) {
            res.setHeader('Content-Type', 'image/png');
        }
    }
}));
app.use('/videos', express_1.default.static('videos', { maxAge: '7d' }));
app.use(express_1.default.static('client/dist'));
app.get('/health', async (req, res) => {
    try {
        const systemInfo = {
            status: 'OK',
            timestamp: new Date().toISOString(),
            version: '2.0.0',
            environment: NODE_ENV,
            uptime: process.uptime(),
            memory: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
                external: Math.round(process.memoryUsage().external / 1024 / 1024)
            }
        };
        res.json(systemInfo);
    }
    catch (error) {
        logger.error('Health check failed:', error);
        res.status(500).json({
            status: 'ERROR',
            error: 'Health check failed',
            timestamp: new Date().toISOString()
        });
    }
});
app.get('/', (req, res) => {
    res.json({
        name: 'Social Video Generator API',
        version: '2.0.0',
        description: 'API para generar videos sociales con efectos glassmorphism',
        status: '✅ Backend funcionando correctamente',
        port: PORT,
        timestamp: new Date().toISOString(),
        endpoints: {
            health: '/health',
            debug: '/api/debug',
            avatars: '/api/upload/avatars',
            videos: '/api/video/list',
            documentation: '/docs'
        },
        features: [
            'Generación de videos con glassmorphism',
            'Fondos dinámicos tipo B-roll',
            'Múltiples formatos de salida',
            'Rate limiting',
            'Optimización automática',
            'API RESTful'
        ],
        github: 'https://github.com/psychito/socialimggen',
        author: 'psychito'
    });
});
app.use('/api', (req, res, next) => {
    logger.info(`API Request: ${req.method} ${req.originalUrl}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });
    next();
});
app.use('/api/video', video_1.default);
app.use('/api/image', image_1.default);
app.use('/api/upload', upload_1.default);
app.get('/api/debug', (req, res) => {
    res.json({
        success: true,
        message: 'API funcionando correctamente',
        timestamp: new Date().toISOString(),
        availableRoutes: {
            video: ['/api/video/list', '/api/video/presets', '/api/video/formats'],
            upload: ['/api/upload/avatars', '/api/upload/backgrounds', '/api/upload/stats'],
            image: ['/api/image/generate']
        }
    });
});
app.get('/api/video/list', async (req, res) => {
    try {
        logger.info('🎬 Video list endpoint accessed directly');
        const categories = ['nature', 'urban', 'tech', 'abstract', 'business', 'custom'];
        let videos = [];
        for (const category of categories) {
            const dir = `videos/${category}`;
            await fs.mkdir(dir, { recursive: true });
            const files = await fs.readdir(dir);
            const videoFiles = files.filter(file => file.match(/\.(mp4|mov|avi|mkv|webm)$/i));
            for (const file of videoFiles) {
                const filePath = path.join(dir, file);
                const stats = await fs.stat(filePath);
                videos.push({
                    name: file,
                    url: `/videos/${category}/${file}`,
                    category,
                    size: `${(stats.size / (1024 * 1024)).toFixed(2)}MB`
                });
            }
        }
        res.json({ success: true, videos, total: videos.length });
    }
    catch (error) {
        logger.error('Error en endpoint de videos:', error);
        res.status(500).json({ success: false, error: 'Error listando videos', details: error.message });
    }
});
app.use('/api/*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint no encontrado',
        path: req.path,
        availableEndpoints: [
            'GET /api/video/list',
            'GET /api/video/presets',
            'GET /api/video/formats',
            'POST /api/video/generate',
            'GET /api/upload/avatars',
            'POST /api/image/generate',
            'GET /api/debug'
        ]
    });
});
app.get('*', (req, res) => {
    res.sendFile(path.resolve('client/dist/index.html'));
});
app.use((err, req, res, next) => {
    logger.error({
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip
    });
    res.status(500).json({
        error: 'Error interno del servidor',
        message: NODE_ENV === 'development' ? err.message : 'Algo salió mal'
    });
});
async function initializeDirectories() {
    const directories = [
        'output',
        'temp',
        'uploads',
        'logs',
        'videos/tech',
        'videos/nature',
        'videos/urban',
        'videos/abstract',
        'videos/business',
        'videos/custom'
    ];
    for (const dir of directories) {
        try {
            await fs.mkdir(dir, { recursive: true });
            logger.info(`✅ Directorio creado/verificado: ${dir}`);
        }
        catch (error) {
            logger.error(`❌ Error creando directorio ${dir}:`, error);
        }
    }
}
async function startServer() {
    try {
        await initializeDirectories();
        app.listen(PORT, () => {
            logger.info(`🚀 Social Video Generator API v2.0.0`);
            logger.info(`📡 Servidor ejecutándose en ${PUBLIC_URL}`);
            logger.info(`🌍 Entorno: ${NODE_ENV}`);
            logger.info(`🎬 Generación básica: ✅ Habilitada`);
            if (NODE_ENV === 'development') {
                logger.info(`🔍 Health check: ${PUBLIC_URL}/health`);
            }
        });
    }
    catch (error) {
        logger.error('❌ Error iniciando servidor:', error);
        process.exit(1);
    }
}
startServer();
app.use('/uploads', express_1.default.static(path.join(process.cwd(), 'uploads')));
exports.default = app;
//# sourceMappingURL=server.js.map