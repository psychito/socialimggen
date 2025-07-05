"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/video.ts - Rutas para generación de videos
var express_1 = require("express");
var winston = require('winston');
var uuid_1 = require("uuid");
var types_1 = require("../types");
var videoGenerator_1 = require("../services/videoGenerator");
var backgroundSelector_1 = require("../services/backgroundSelector");
var router = (0, express_1.Router)();
var logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'logs/video.log' })
    ]
});
// Validación de entrada
function validateVideoRequest(req) {
    var _a = req.body, tweetData = _a.tweetData, options = _a.options;
    var errors = [];
    // Validar tweetData
    if (!tweetData) {
        errors.push('tweetData es requerido');
    }
    else if (!(0, types_1.isValidTweetData)(tweetData)) {
        if (!tweetData.username)
            errors.push('username es requerido');
        if (!tweetData.displayName)
            errors.push('displayName es requerido');
        if (!tweetData.text)
            errors.push('text es requerido');
        if (typeof tweetData.likes !== 'number')
            errors.push('likes debe ser un número');
        if (typeof tweetData.retweets !== 'number')
            errors.push('retweets debe ser un número');
        if (typeof tweetData.replies !== 'number')
            errors.push('replies debe ser un número');
        if (!tweetData.timestamp)
            errors.push('timestamp es requerido');
    }
    // Validaciones adicionales para tweetData
    if (tweetData) {
        if (tweetData.text && tweetData.text.length > 280) {
            errors.push('El texto no puede exceder 280 caracteres');
        }
        if (tweetData.username && !tweetData.username.startsWith('@')) {
            // Auto-corregir agregando @
            tweetData.username = '@' + tweetData.username;
        }
        if (tweetData.likes < 0 || tweetData.retweets < 0 || tweetData.replies < 0) {
            errors.push('Los números de likes, retweets y replies deben ser positivos');
        }
    }
    // Validar options (opcional, usar defaults si no se proporciona)
    if (options && !(0, types_1.isValidVideoOptions)(options)) {
        if (options.duration && (options.duration < 5 || options.duration > 60)) {
            errors.push('La duración debe estar entre 5 y 60 segundos');
        }
        if (options.fps && ![24, 30, 60].includes(options.fps)) {
            errors.push('FPS debe ser 24, 30 o 60');
        }
        if (options.width && (options.width < 480 || options.width > 4096)) {
            errors.push('El ancho debe estar entre 480 y 4096 píxeles');
        }
        if (options.height && (options.height < 480 || options.height > 4096)) {
            errors.push('La altura debe estar entre 480 y 4096 píxeles');
        }
        if (options.style && !['glassmorphism', 'solid', 'gradient'].includes(options.style)) {
            errors.push('El estilo debe ser glassmorphism, solid o gradient');
        }
        if (options.animation && !['fade', 'slide', 'zoom', 'none'].includes(options.animation)) {
            errors.push('La animación debe ser fade, slide, zoom o none');
        }
    }
    return { isValid: errors.length === 0, errors: errors };
}
// POST /api/video/generate - Generar video social
router.post('/generate', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var requestId, startTime, validation, tweetData, options, result, processingTime, error_1, processingTime, statusCode, errorMessage;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                requestId = (0, uuid_1.v4)();
                startTime = Date.now();
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                logger.info("[".concat(requestId, "] Nueva solicitud de generaci\u00F3n de video"), {
                    ip: req.ip,
                    userAgent: req.get('User-Agent')
                });
                validation = validateVideoRequest(req);
                if (!validation.isValid) {
                    logger.warn("[".concat(requestId, "] Validaci\u00F3n fallida:"), validation.errors);
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            error: 'Datos de entrada inválidos',
                            details: validation.errors.join(', ')
                        })];
                }
                tweetData = req.body.tweetData;
                options = __assign(__assign({}, types_1.DEFAULT_VIDEO_OPTIONS), req.body.options);
                logger.info("[".concat(requestId, "] Par\u00E1metros validados:"), {
                    username: tweetData.username,
                    textLength: tweetData.text.length,
                    duration: options.duration,
                    style: options.style
                });
                // Seleccionar video de fondo si no se especifica
                if (!options.backgroundVideo) {
                    options.backgroundVideo = (0, backgroundSelector_1.selectBackgroundVideo)(tweetData.text);
                    logger.info("[".concat(requestId, "] Video de fondo seleccionado: ").concat(options.backgroundVideo));
                }
                // Generar el video
                logger.info("[".concat(requestId, "] Iniciando generaci\u00F3n de video..."));
                return [4 /*yield*/, (0, videoGenerator_1.generateVideo)(tweetData, options, requestId)];
            case 2:
                result = _a.sent();
                processingTime = Date.now() - startTime;
                logger.info("[".concat(requestId, "] Video generado exitosamente en ").concat(processingTime, "ms"), {
                    outputPath: result.videoUrl,
                    fileSize: result.size
                });
                res.json({
                    success: true,
                    videoUrl: result.videoUrl,
                    duration: options.duration,
                    size: result.size,
                    format: 'mp4'
                });
                return [3 /*break*/, 4];
            case 3:
                error_1 = _a.sent();
                processingTime = Date.now() - startTime;
                logger.error("[".concat(requestId, "] Error generando video despu\u00E9s de ").concat(processingTime, "ms:"), {
                    error: error_1.message,
                    stack: error_1.stack
                });
                statusCode = 500;
                errorMessage = 'Error interno generando video';
                if (error_1.message.includes('ENOENT')) {
                    statusCode = 404;
                    errorMessage = 'Video de fondo no encontrado';
                }
                else if (error_1.message.includes('ENOMEM')) {
                    statusCode = 507;
                    errorMessage = 'Memoria insuficiente para procesar el video';
                }
                else if (error_1.message.includes('timeout')) {
                    statusCode = 408;
                    errorMessage = 'Tiempo de procesamiento excedido';
                }
                res.status(statusCode).json({
                    success: false,
                    error: errorMessage,
                    details: process.env.NODE_ENV === 'development' ? error_1.message : undefined
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// GET /api/video/presets - Obtener presets predefinidos
router.get('/presets', function (req, res) {
    var presets = [
        {
            name: 'Tech Announcement',
            description: 'Perfecto para anuncios de tecnología y startups',
            options: __assign(__assign({}, types_1.DEFAULT_VIDEO_OPTIONS), { style: 'glassmorphism', animation: 'slide', duration: 8 }),
            backgroundCategory: 'tech'
        },
        {
            name: 'Motivational Quote',
            description: 'Para citas inspiracionales y motivacionales',
            options: __assign(__assign({}, types_1.DEFAULT_VIDEO_OPTIONS), { style: 'gradient', animation: 'fade', duration: 12 }),
            backgroundCategory: 'nature'
        },
        {
            name: 'Business Update',
            description: 'Para actualizaciones corporativas y de negocios',
            options: __assign(__assign({}, types_1.DEFAULT_VIDEO_OPTIONS), { style: 'solid', animation: 'zoom', duration: 10 }),
            backgroundCategory: 'business'
        },
        {
            name: 'Creative Content',
            description: 'Para contenido creativo y artístico',
            options: __assign(__assign({}, types_1.DEFAULT_VIDEO_OPTIONS), { style: 'glassmorphism', animation: 'slide', duration: 15, fps: 60 }),
            backgroundCategory: 'abstract'
        },
        {
            name: 'Urban Lifestyle',
            description: 'Para contenido de estilo de vida urbano',
            options: __assign(__assign({}, types_1.DEFAULT_VIDEO_OPTIONS), { style: 'glassmorphism', animation: 'fade', duration: 10 }),
            backgroundCategory: 'urban'
        }
    ];
    res.json({
        success: true,
        presets: presets,
        total: presets.length
    });
});
// GET /api/video/formats - Obtener formatos soportados
router.get('/formats', function (req, res) {
    var formats = {
        video: {
            output: ['mp4', 'webm', 'mov'],
            input: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
            codecs: {
                h264: 'Mayor compatibilidad, tamaño moderado',
                h265: 'Mejor compresión, requiere más procesamiento',
                vp9: 'Optimizado para web, tamaño pequeño'
            }
        },
        resolutions: {
            'Instagram Story': { width: 1080, height: 1920 },
            'Instagram Post': { width: 1080, height: 1080 },
            'Twitter Video': { width: 1280, height: 720 },
            'YouTube Short': { width: 1080, height: 1920 },
            'TikTok': { width: 1080, height: 1920 },
            'LinkedIn': { width: 1200, height: 628 },
            'Custom': { width: 'variable', height: 'variable' }
        },
        frameRates: [24, 30, 60],
        qualityPresets: {
            low: 'Procesamiento rápido, menor calidad',
            medium: 'Balance entre calidad y velocidad',
            high: 'Alta calidad, procesamiento más lento',
            ultra: 'Máxima calidad, procesamiento muy lento'
        }
    };
    res.json({
        success: true,
        formats: formats,
        recommendations: {
            social: 'mp4 con h264, 30fps, calidad medium',
            professional: 'mp4 con h265, 60fps, calidad high',
            web: 'webm con vp9, 30fps, calidad medium'
        }
    });
});
// GET /api/video/status/:requestId - Obtener estado de procesamiento (para implementación futura)
router.get('/status/:requestId', function (req, res) {
    var requestId = req.params.requestId;
    // Por ahora retornamos un estado simulado
    // En el futuro esto se conectaría con un sistema de colas
    res.json({
        success: true,
        requestId: requestId,
        status: 'completed',
        progress: 100,
        message: 'Video generado exitosamente',
        estimatedTimeRemaining: 0
    });
});
// DELETE /api/video/:filename - Eliminar video generado
router.delete('/:filename', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var filename, fs, path, filePath, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                filename = req.params.filename;
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                // Validar que el archivo existe y es seguro eliminar
                if (!filename.match(/^[a-zA-Z0-9_-]+\.(mp4|webm|mov)$/)) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            error: 'Nombre de archivo inválido'
                        })];
                }
                fs = require('fs/promises');
                path = require('path');
                filePath = path.join('output', filename);
                return [4 /*yield*/, fs.unlink(filePath)];
            case 2:
                _a.sent();
                logger.info("Archivo eliminado: ".concat(filename), { ip: req.ip });
                res.json({
                    success: true,
                    message: 'Archivo eliminado exitosamente'
                });
                return [3 /*break*/, 4];
            case 3:
                error_2 = _a.sent();
                if (error_2.code === 'ENOENT') {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            error: 'Archivo no encontrado'
                        })];
                }
                logger.error('Error eliminando archivo:', error_2);
                res.status(500).json({
                    success: false,
                    error: 'Error eliminando archivo'
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// Middleware de manejo de errores específico para video
router.use(function (error, req, res, next) {
    logger.error('Error en ruta de video:', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method
    });
    if (error.name === 'FFmpegError') {
        return res.status(500).json({
            success: false,
            error: 'Error de procesamiento de video',
            details: 'Problema con la codificación de video'
        });
    }
    if (error.name === 'CanvasError') {
        return res.status(500).json({
            success: false,
            error: 'Error de generación de overlay',
            details: 'Problema creando el overlay glassmorphism'
        });
    }
    next(error);
});
exports.default = router;
