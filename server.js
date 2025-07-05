"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
// server.ts - Servidor principal mejorado
var express_1 = require("express");
var cors_1 = require("cors");
var helmet_1 = require("helmet");
var compression_1 = require("compression");
var dotenv_1 = require("dotenv");
var path_1 = require("path");
var promises_1 = require("fs/promises");
const winston = require('winston');
var rate_limiter_flexible_1 = require("rate-limiter-flexible");
// Cargar variables de entorno
(0, dotenv_1.config)();
// Importar rutas y servicios
var video_1 = require("./src/routes/video");
var image_1 = require("./src/routes/image");
var upload_1 = require("./src/routes/upload");
// Configuración
var app = (0, express_1.default)();
var PORT = process.env.PORT || 3000;
var NODE_ENV = process.env.NODE_ENV || 'development';
var PUBLIC_URL = process.env.PUBLIC_URL || "http://localhost:".concat(PORT);
// Configurar Winston logger
var logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.json()),
    defaultMeta: { service: 'social-video-generator' },
    transports: [
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            maxsize: 10485760, // 10MB
            maxFiles: 5
        }),
        new winston.transports.File({
            filename: 'logs/combined.log',
            maxsize: 10485760,
            maxFiles: 5
        })
    ],
});
// En desarrollo, también log a consola
if (NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}
// Rate limiter
var rateLimiter = new rate_limiter_flexible_1.RateLimiterMemory({
    keyGenerator: function (req) { return req.ip; },
    points: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    duration: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000') / 1000, // 15 minutos
});
var rateLimiterMiddleware = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var rejRes_1, secs;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, rateLimiter.consume(req.ip)];
            case 1:
                _a.sent();
                next();
                return [3 /*break*/, 3];
            case 2:
                rejRes_1 = _a.sent();
                secs = Math.round(rejRes_1.msBeforeNext / 1000) || 1;
                res.set('Retry-After', String(secs));
                res.status(429).json({
                    error: 'Too Many Requests',
                    retryAfter: secs
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
// Middleware de seguridad
app.use((0, helmet_1.default)({
    contentSecurityPolicy: false, // Desactivar para permitir videos
    crossOriginEmbedderPolicy: false
}));
// Configurar CORS
var corsOptions = {
    origin: ((_a = process.env.ALLOWED_ORIGINS) === null || _a === void 0 ? void 0 : _a.split(',')) || [
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
// Middleware básico
app.use((0, compression_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Trust proxy si está configurado
if (process.env.TRUST_PROXY === 'true') {
    app.set('trust proxy', 1);
}
// Rate limiting
app.use(rateLimiterMiddleware);
// Middleware de logging
app.use(function (req, res, next) {
    var start = Date.now();
    res.on('finish', function () {
        var duration = Date.now() - start;
        logger.info({
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration: "".concat(duration, "ms"),
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });
    });
    next();
});
// Servir archivos estáticos
app.use('/output', express_1.default.static('output', {
    maxAge: '1d',
    setHeaders: function (res, path) {
        if (path.endsWith('.mp4')) {
            res.setHeader('Content-Type', 'video/mp4');
        }
        else if (path.endsWith('.png')) {
            res.setHeader('Content-Type', 'image/png');
        }
    }
}));
app.use('/videos', express_1.default.static('videos', { maxAge: '7d' }));
// Servir cliente si existe
var clientPath = process.env.CLIENT_BUILD_PATH || './client/dist';
try {
    app.use('/app', express_1.default.static(clientPath));
}
catch (error) {
    logger.warn('Cliente no encontrado en:', clientPath);
}
// Health check con información detallada
app.get('/health', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var directories, directoriesStatus, stats, systemInfo, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                directories = ['output', 'temp', 'uploads', 'logs', 'videos'];
                return [4 /*yield*/, Promise.all(directories.map(function (dir) { return __awaiter(void 0, void 0, void 0, function () {
                        var _a;
                        var _b, _c;
                        return __generator(this, function (_d) {
                            switch (_d.label) {
                                case 0:
                                    _d.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, promises_1.default.access(dir)];
                                case 1:
                                    _d.sent();
                                    return [2 /*return*/, (_b = {}, _b[dir] = 'OK', _b)];
                                case 2:
                                    _a = _d.sent();
                                    return [2 /*return*/, (_c = {}, _c[dir] = 'MISSING', _c)];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); }))
                    // Verificar espacio en disco
                ];
            case 1:
                directoriesStatus = _a.sent();
                return [4 /*yield*/, promises_1.default.stat('.')
                    // Información del sistema
                ];
            case 2:
                stats = _a.sent();
                systemInfo = {
                    status: 'OK',
                    timestamp: new Date().toISOString(),
                    version: '2.0.0',
                    environment: NODE_ENV,
                    uptime: process.uptime(),
                    memory: {
                        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
                        external: Math.round(process.memoryUsage().external / 1024 / 1024)
                    },
                    directories: Object.assign.apply(Object, __spreadArray([{}], directoriesStatus, false)),
                    config: {
                        maxVideoDuration: process.env.MAX_VIDEO_DURATION || '60',
                        defaultFPS: process.env.DEFAULT_FPS || '30',
                        uploadMaxSize: process.env.UPLOAD_MAX_SIZE || '100',
                        rateLimitMax: process.env.RATE_LIMIT_MAX_REQUESTS || '100'
                    }
                };
                res.json(systemInfo);
                return [3 /*break*/, 4];
            case 3:
                error_1 = _a.sent();
                logger.error('Health check failed:', error_1);
                res.status(500).json({
                    status: 'ERROR',
                    error: 'Health check failed',
                    timestamp: new Date().toISOString()
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// Información de la API
app.get('/', function (req, res) {
    res.json({
        name: 'Social Video Generator API',
        version: '2.0.0',
        description: 'API para generar videos sociales con efectos glassmorphism',
        endpoints: {
            health: '/health',
            generateVideo: 'POST /api/video/generate',
            generateImage: 'POST /api/image/generate',
            uploadBackground: 'POST /api/upload/background',
            listBackgrounds: 'GET /api/backgrounds',
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
// Rutas de la API
app.use('/api/video', video_1.default);
app.use('/api/image', image_1.default);
app.use('/api/upload', upload_1.default);
// Ruta para listar videos de fondo disponibles
app.get('/api/backgrounds', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var categories, backgrounds, _loop_1, _i, categories_1, category, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 5, , 6]);
                categories = ['tech', 'nature', 'urban', 'abstract', 'business', 'custom'];
                backgrounds = {};
                _loop_1 = function (category) {
                    var files, error_3;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                _b.trys.push([0, 2, , 3]);
                                return [4 /*yield*/, promises_1.default.readdir("videos/".concat(category))];
                            case 1:
                                files = _b.sent();
                                backgrounds[category] = files
                                    .filter(function (file) { return file.match(/\.(mp4|mov|avi|mkv|webm)$/i); })
                                    .map(function (file) { return ({
                                    name: file,
                                    url: "".concat(PUBLIC_URL, "/videos/").concat(category, "/").concat(file),
                                    category: category
                                }); });
                                return [3 /*break*/, 3];
                            case 2:
                                error_3 = _b.sent();
                                backgrounds[category] = [];
                                return [3 /*break*/, 3];
                            case 3: return [2 /*return*/];
                        }
                    });
                };
                _i = 0, categories_1 = categories;
                _a.label = 1;
            case 1:
                if (!(_i < categories_1.length)) return [3 /*break*/, 4];
                category = categories_1[_i];
                return [5 /*yield**/, _loop_1(category)];
            case 2:
                _a.sent();
                _a.label = 3;
            case 3:
                _i++;
                return [3 /*break*/, 1];
            case 4:
                res.json({
                    success: true,
                    backgrounds: backgrounds,
                    total: Object.values(backgrounds).flat().length
                });
                return [3 /*break*/, 6];
            case 5:
                error_2 = _a.sent();
                logger.error('Error listando backgrounds:', error_2);
                res.status(500).json({
                    error: 'Error listando videos de fondo',
                    details: error_2.message
                });
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); });
// Documentación básica
app.get('/docs', function (req, res) {
    res.json({
        title: 'Social Video Generator API Documentation',
        version: '2.0.0',
        baseUrl: PUBLIC_URL,
        endpoints: {
            'POST /api/video/generate': {
                description: 'Generar video social con glassmorphism',
                body: {
                    tweetData: {
                        username: 'string',
                        displayName: 'string',
                        text: 'string',
                        likes: 'number',
                        retweets: 'number',
                        replies: 'number',
                        timestamp: 'string',
                        verified: 'boolean (optional)',
                        theme: 'light|dark (optional)'
                    },
                    options: {
                        duration: 'number (5-60)',
                        fps: 'number (24|30|60)',
                        width: 'number (default: 1080)',
                        height: 'number (default: 1920)',
                        style: 'glassmorphism|solid|gradient',
                        animation: 'fade|slide|zoom|none',
                        backgroundVideo: 'string (optional)'
                    }
                },
                response: {
                    success: 'boolean',
                    videoUrl: 'string',
                    duration: 'number',
                    size: 'string'
                }
            },
            'POST /api/image/generate': {
                description: 'Generar imagen social (OG)',
                body: {
                    tweetData: 'TweetData object'
                },
                response: {
                    success: 'boolean',
                    imageUrl: 'string'
                }
            },
            'POST /api/upload/background': {
                description: 'Subir video de fondo personalizado',
                body: 'multipart/form-data with video file',
                response: {
                    success: 'boolean',
                    videoPath: 'string'
                }
            }
        },
        examples: {
            curl: "curl -X POST ".concat(PUBLIC_URL, "/api/video/generate \\\n  -H \"Content-Type: application/json\" \\\n  -d '{\n    \"tweetData\": {\n      \"username\": \"@psychito\",\n      \"displayName\": \"Psychito Dev\",\n      \"text\": \"\u00A1Nuevo generador de videos sociales con glassmorphism! \uD83D\uDE80\",\n      \"likes\": 42,\n      \"retweets\": 12,\n      \"replies\": 5,\n      \"timestamp\": \"2h\"\n    },\n    \"options\": {\n      \"duration\": 10,\n      \"style\": \"glassmorphism\",\n      \"animation\": \"fade\"\n    }\n  }'")
        }
    });
});
// Middleware de manejo de errores
app.use(function (err, req, res, next) {
    logger.error({
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip
    });
    if (err.name === 'MulterError') {
        return res.status(400).json({
            error: 'Error de archivo',
            details: err.message
        });
    }
    res.status(500).json({
        error: 'Error interno del servidor',
        message: NODE_ENV === 'development' ? err.message : 'Algo salió mal'
    });
});
// Ruta 404
app.use('*', function (req, res) {
    res.status(404).json({
        error: 'Endpoint no encontrado',
        availableEndpoints: [
            'GET /',
            'GET /health',
            'GET /docs',
            'POST /api/video/generate',
            'POST /api/image/generate',
            'POST /api/upload/background',
            'GET /api/backgrounds'
        ]
    });
});
// Inicializar directorios necesarios
function initializeDirectories() {
    return __awaiter(this, void 0, void 0, function () {
        var directories, _i, directories_1, dir, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    directories = [
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
                    _i = 0, directories_1 = directories;
                    _a.label = 1;
                case 1:
                    if (!(_i < directories_1.length)) return [3 /*break*/, 6];
                    dir = directories_1[_i];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, promises_1.default.mkdir(dir, { recursive: true })];
                case 3:
                    _a.sent();
                    logger.info("\u2705 Directorio creado/verificado: ".concat(dir));
                    return [3 /*break*/, 5];
                case 4:
                    error_4 = _a.sent();
                    logger.error("\u274C Error creando directorio ".concat(dir, ":"), error_4);
                    return [3 /*break*/, 5];
                case 5:
                    _i++;
                    return [3 /*break*/, 1];
                case 6: return [2 /*return*/];
            }
        });
    });
}
// Función de limpieza automática
function cleanupOldFiles() {
    return __awaiter(this, void 0, void 0, function () {
        var now, maxAge, tempFiles, _i, tempFiles_1, file, filePath, stats, outputFiles, maxFiles, filesWithStats, filesToDelete, _a, filesToDelete_1, file, error_5;
        var _this = this;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 13, , 14]);
                    now = Date.now();
                    maxAge = 24 * 60 * 60 * 1000 // 24 horas en ms
                    ;
                    return [4 /*yield*/, promises_1.default.readdir('temp').catch(function () { return []; })];
                case 1:
                    tempFiles = _b.sent();
                    _i = 0, tempFiles_1 = tempFiles;
                    _b.label = 2;
                case 2:
                    if (!(_i < tempFiles_1.length)) return [3 /*break*/, 6];
                    file = tempFiles_1[_i];
                    filePath = path_1.default.join('temp', file);
                    return [4 /*yield*/, promises_1.default.stat(filePath)];
                case 3:
                    stats = _b.sent();
                    if (!(now - stats.mtime.getTime() > maxAge)) return [3 /*break*/, 5];
                    return [4 /*yield*/, promises_1.default.unlink(filePath)];
                case 4:
                    _b.sent();
                    logger.info("\uD83D\uDDD1\uFE0F Archivo temporal eliminado: ".concat(file));
                    _b.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 2];
                case 6: return [4 /*yield*/, promises_1.default.readdir('output').catch(function () { return []; })];
                case 7:
                    outputFiles = _b.sent();
                    maxFiles = parseInt(process.env.MAX_OUTPUT_FILES || '1000');
                    if (!(outputFiles.length > maxFiles)) return [3 /*break*/, 12];
                    return [4 /*yield*/, Promise.all(outputFiles.map(function (file) { return __awaiter(_this, void 0, void 0, function () {
                            var stats;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, promises_1.default.stat(path_1.default.join('output', file))];
                                    case 1:
                                        stats = _a.sent();
                                        return [2 /*return*/, { file: file, mtime: stats.mtime }];
                                }
                            });
                        }); }))
                        // Ordenar por fecha y eliminar los más antiguos
                    ];
                case 8:
                    filesWithStats = _b.sent();
                    // Ordenar por fecha y eliminar los más antiguos
                    filesWithStats.sort(function (a, b) { return a.mtime.getTime() - b.mtime.getTime(); });
                    filesToDelete = filesWithStats.slice(0, outputFiles.length - maxFiles);
                    _a = 0, filesToDelete_1 = filesToDelete;
                    _b.label = 9;
                case 9:
                    if (!(_a < filesToDelete_1.length)) return [3 /*break*/, 12];
                    file = filesToDelete_1[_a].file;
                    return [4 /*yield*/, promises_1.default.unlink(path_1.default.join('output', file))];
                case 10:
                    _b.sent();
                    logger.info("\uD83D\uDDD1\uFE0F Archivo de salida eliminado: ".concat(file));
                    _b.label = 11;
                case 11:
                    _a++;
                    return [3 /*break*/, 9];
                case 12: return [3 /*break*/, 14];
                case 13:
                    error_5 = _b.sent();
                    logger.error('Error en limpieza automática:', error_5);
                    return [3 /*break*/, 14];
                case 14: return [2 /*return*/];
            }
        });
    });
}
// Graceful shutdown
process.on('SIGTERM', function () {
    logger.info('🛑 SIGTERM recibido, cerrando servidor...');
    process.exit(0);
});
process.on('SIGINT', function () {
    logger.info('🛑 SIGINT recibido, cerrando servidor...');
    process.exit(0);
});
// Iniciar servidor
function startServer() {
    return __awaiter(this, void 0, void 0, function () {
        var cleanupInterval, error_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    // Inicializar directorios
                    return [4 /*yield*/, initializeDirectories()
                        // Configurar limpieza automática si está habilitada
                    ];
                case 1:
                    // Inicializar directorios
                    _a.sent();
                    // Configurar limpieza automática si está habilitada
                    if (process.env.CLEANUP_TEMP_FILES !== 'false') {
                        cleanupInterval = parseInt(process.env.CLEANUP_INTERVAL_HOURS || '24') * 60 * 60 * 1000;
                        setInterval(cleanupOldFiles, cleanupInterval);
                        logger.info("\uD83E\uDDF9 Limpieza autom\u00E1tica configurada cada ".concat(process.env.CLEANUP_INTERVAL_HOURS || 24, " horas"));
                    }
                    // Iniciar servidor
                    app.listen(PORT, function () {
                        logger.info("\uD83D\uDE80 Social Video Generator API v2.0.0");
                        logger.info("\uD83D\uDCE1 Servidor ejecut\u00E1ndose en ".concat(PUBLIC_URL));
                        logger.info("\uD83C\uDF0D Entorno: ".concat(NODE_ENV));
                        logger.info("\uD83C\uDFAC Generaci\u00F3n de videos: \u2705 Habilitada");
                        logger.info("\uD83C\uDFA8 Efectos glassmorphism: \u2705 Activos");
                        logger.info("\uD83D\uDCCA Rate limiting: ".concat(process.env.RATE_LIMIT_MAX_REQUESTS || 100, " requests/").concat(Math.round((parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000')) / 60000), " min"));
                        if (NODE_ENV === 'development') {
                            logger.info("\uD83D\uDCD6 Documentaci\u00F3n: ".concat(PUBLIC_URL, "/docs"));
                            logger.info("\uD83D\uDD0D Health check: ".concat(PUBLIC_URL, "/health"));
                            logger.info("\uD83C\uDFAE Cliente web: ".concat(PUBLIC_URL, "/app"));
                        }
                    });
                    return [3 /*break*/, 3];
                case 2:
                    error_6 = _a.sent();
                    logger.error('❌ Error iniciando servidor:', error_6);
                    process.exit(1);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Iniciar la aplicación
startServer();
exports.default = app;
