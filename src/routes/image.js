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
// src/routes/image.ts - Rutas para generación de imágenes
var express_1 = require("express");
var winston = require('winston');
var uuid_1 = require("uuid");
var types_1 = require("../types");
var imageGenerator_1 = require("../services/imageGenerator");
var router = (0, express_1.Router)();
var logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'logs/image.log' })
    ]
});
// Validación de entrada para imágenes
function validateImageRequest(req) {
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
    // Validaciones adicionales
    if (tweetData) {
        if (tweetData.text && tweetData.text.length > 280) {
            errors.push('El texto no puede exceder 280 caracteres');
        }
        if (tweetData.username && !tweetData.username.startsWith('@')) {
            tweetData.username = '@' + tweetData.username;
        }
    }
    // Validar options de imagen (opcional)
    if (options) {
        if (options.width && (options.width < 200 || options.width > 2048)) {
            errors.push('El ancho debe estar entre 200 y 2048 píxeles');
        }
        if (options.height && (options.height < 200 || options.height > 2048)) {
            errors.push('La altura debe estar entre 200 y 2048 píxeles');
        }
        if (options.format && !['png', 'jpg', 'webp'].includes(options.format)) {
            errors.push('El formato debe ser png, jpg o webp');
        }
        if (options.quality && (options.quality < 10 || options.quality > 100)) {
            errors.push('La calidad debe estar entre 10 y 100');
        }
    }
    return { isValid: errors.length === 0, errors: errors };
}
// POST /api/image/generate - Generar imagen social
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
                logger.info("[".concat(requestId, "] Nueva solicitud de generaci\u00F3n de imagen"), {
                    ip: req.ip,
                    userAgent: req.get('User-Agent')
                });
                validation = validateImageRequest(req);
                if (!validation.isValid) {
                    logger.warn("[".concat(requestId, "] Validaci\u00F3n fallida:"), validation.errors);
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            error: 'Datos de entrada inválidos',
                            details: validation.errors.join(', ')
                        })];
                }
                tweetData = req.body.tweetData;
                options = __assign(__assign({}, types_1.DEFAULT_IMAGE_OPTIONS), req.body.options);
                logger.info("[".concat(requestId, "] Par\u00E1metros validados:"), {
                    username: tweetData.username,
                    textLength: tweetData.text.length,
                    format: options.format,
                    dimensions: "".concat(options.width, "x").concat(options.height)
                });
                // Generar la imagen
                logger.info("[".concat(requestId, "] Iniciando generaci\u00F3n de imagen..."));
                return [4 /*yield*/, (0, imageGenerator_1.generateSocialImage)(tweetData, options, requestId)];
            case 2:
                result = _a.sent();
                processingTime = Date.now() - startTime;
                logger.info("[".concat(requestId, "] Imagen generada exitosamente en ").concat(processingTime, "ms"), {
                    outputPath: result.imageUrl
                });
                res.json({
                    success: true,
                    imageUrl: result.imageUrl,
                    format: options.format || 'png'
                });
                return [3 /*break*/, 4];
            case 3:
                error_1 = _a.sent();
                processingTime = Date.now() - startTime;
                logger.error("[".concat(requestId, "] Error generando imagen despu\u00E9s de ").concat(processingTime, "ms:"), {
                    error: error_1.message,
                    stack: error_1.stack
                });
                statusCode = 500;
                errorMessage = 'Error interno generando imagen';
                if (error_1.message.includes('Canvas')) {
                    statusCode = 500;
                    errorMessage = 'Error en el motor de renderizado';
                }
                else if (error_1.message.includes('font')) {
                    statusCode = 500;
                    errorMessage = 'Error cargando fuentes';
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
// GET /api/image/og - Generar imagen Open Graph (compatible con metadatos)
router.get('/og', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, _b, username, _c, name_1, _d, text, _e, likes, _f, retweets, _g, replies, _h, verified, _j, theme, tweetData, options, requestId, result, fs, path, imagePath, error_2;
    return __generator(this, function (_k) {
        switch (_k.label) {
            case 0:
                _k.trys.push([0, 2, , 3]);
                _a = req.query, _b = _a.username, username = _b === void 0 ? '@usuario' : _b, _c = _a.name, name_1 = _c === void 0 ? 'Usuario' : _c, _d = _a.text, text = _d === void 0 ? 'Tweet de ejemplo' : _d, _e = _a.likes, likes = _e === void 0 ? '0' : _e, _f = _a.retweets, retweets = _f === void 0 ? '0' : _f, _g = _a.replies, replies = _g === void 0 ? '0' : _g, _h = _a.verified, verified = _h === void 0 ? 'false' : _h, _j = _a.theme, theme = _j === void 0 ? 'dark' : _j;
                tweetData = {
                    username: username,
                    displayName: name_1,
                    text: text,
                    likes: parseInt(likes) || 0,
                    retweets: parseInt(retweets) || 0,
                    replies: parseInt(replies) || 0,
                    timestamp: '2h',
                    verified: verified === 'true',
                    theme: theme || 'dark'
                };
                options = {
                    width: 1200,
                    height: 630,
                    format: 'png',
                    quality: 85
                };
                requestId = (0, uuid_1.v4)();
                return [4 /*yield*/, (0, imageGenerator_1.generateSocialImage)(tweetData, options, requestId)
                    // Leer el archivo y enviarlo directamente
                ];
            case 1:
                result = _k.sent();
                fs = require('fs');
                path = require('path');
                imagePath = path.join('output', path.basename(result.imageUrl || ''));
                if (fs.existsSync(imagePath)) {
                    res.setHeader('Content-Type', 'image/png');
                    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache por 1 hora
                    res.sendFile(path.resolve(imagePath));
                }
                else {
                    res.status(404).json({ error: 'Imagen no encontrada' });
                }
                return [3 /*break*/, 3];
            case 2:
                error_2 = _k.sent();
                logger.error('Error generando imagen OG:', error_2);
                res.status(500).json({
                    error: 'Error generando imagen Open Graph',
                    details: error_2.message
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// GET /api/image/formats - Obtener formatos soportados
router.get('/formats', function (req, res) {
    var formats = {
        output: {
            png: {
                description: 'Mayor calidad, soporte de transparencia',
                maxQuality: 100,
                compression: 'lossless',
                useCase: 'Imágenes con texto, logos, transparencias'
            },
            jpg: {
                description: 'Menor tamaño de archivo, sin transparencia',
                maxQuality: 100,
                compression: 'lossy',
                useCase: 'Fotografías, imágenes con muchos colores'
            },
            webp: {
                description: 'Mejor compresión, soporte moderno',
                maxQuality: 100,
                compression: 'both',
                useCase: 'Web moderna, mejor rendimiento'
            }
        },
        standardSizes: {
            'Twitter Card': { width: 1200, height: 628 },
            'Facebook OG': { width: 1200, height: 630 },
            'LinkedIn': { width: 1200, height: 627 },
            'Instagram Post': { width: 1080, height: 1080 },
            'Instagram Story': { width: 1080, height: 1920 },
            'Pinterest Pin': { width: 1000, height: 1500 },
            'YouTube Thumbnail': { width: 1280, height: 720 }
        },
        qualityGuidelines: {
            web: 75,
            print: 90,
            archive: 100
        }
    };
    res.json({
        success: true,
        formats: formats,
        recommendations: {
            social: 'PNG para mejor calidad de texto',
            web: 'WebP para mejor compresión',
            universal: 'JPG para máxima compatibilidad'
        }
    });
});
// GET /api/image/templates - Obtener plantillas predefinidas
router.get('/templates', function (req, res) {
    var templates = [
        {
            name: 'Twitter Classic',
            description: 'Estilo clásico de Twitter con fondo azul',
            options: {
                width: 1200,
                height: 628,
                format: 'png',
                theme: 'dark'
            },
            style: {
                background: 'linear-gradient(45deg, #1DA1F2, #0d7cb5)',
                glassmorphism: true
            }
        },
        {
            name: 'Minimal Light',
            description: 'Diseño minimalista con tema claro',
            options: {
                width: 1200,
                height: 628,
                format: 'png',
                theme: 'light'
            },
            style: {
                background: 'linear-gradient(45deg, #f8f9fa, #e9ecef)',
                glassmorphism: false
            }
        },
        {
            name: 'Tech Gradient',
            description: 'Gradiente tecnológico para contenido tech',
            options: {
                width: 1200,
                height: 628,
                format: 'png',
                theme: 'dark'
            },
            style: {
                background: 'linear-gradient(45deg, #667eea, #764ba2)',
                glassmorphism: true
            }
        },
        {
            name: 'Business Professional',
            description: 'Estilo profesional para contenido corporativo',
            options: {
                width: 1200,
                height: 628,
                format: 'jpg',
                theme: 'dark'
            },
            style: {
                background: 'linear-gradient(45deg, #2c3e50, #34495e)',
                glassmorphism: false
            }
        }
    ];
    res.json({
        success: true,
        templates: templates,
        total: templates.length
    });
});
// POST /api/image/batch - Generar múltiples imágenes
router.post('/batch', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var requestId, startTime, _a, tweets, options, results, imageOptions, i, tweetData, validation, result, error_3, processingTime, successCount, error_4;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                requestId = (0, uuid_1.v4)();
                startTime = Date.now();
                _b.label = 1;
            case 1:
                _b.trys.push([1, 8, , 9]);
                _a = req.body, tweets = _a.tweets, options = _a.options;
                if (!Array.isArray(tweets) || tweets.length === 0) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            error: 'Se requiere un array de tweets'
                        })];
                }
                if (tweets.length > 10) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            error: 'Máximo 10 tweets por lote'
                        })];
                }
                logger.info("[".concat(requestId, "] Generaci\u00F3n en lote iniciada para ").concat(tweets.length, " tweets"));
                results = [];
                imageOptions = __assign(__assign({}, types_1.DEFAULT_IMAGE_OPTIONS), options);
                i = 0;
                _b.label = 2;
            case 2:
                if (!(i < tweets.length)) return [3 /*break*/, 7];
                tweetData = tweets[i];
                validation = validateImageRequest({ body: { tweetData: tweetData } });
                if (!validation.isValid) {
                    results.push({
                        index: i,
                        success: false,
                        error: validation.errors.join(', ')
                    });
                    return [3 /*break*/, 6];
                }
                _b.label = 3;
            case 3:
                _b.trys.push([3, 5, , 6]);
                return [4 /*yield*/, (0, imageGenerator_1.generateSocialImage)(tweetData, imageOptions, "".concat(requestId, "-").concat(i))];
            case 4:
                result = _b.sent();
                results.push({
                    index: i,
                    success: true,
                    imageUrl: result.imageUrl
                });
                return [3 /*break*/, 6];
            case 5:
                error_3 = _b.sent();
                results.push({
                    index: i,
                    success: false,
                    error: error_3.message
                });
                return [3 /*break*/, 6];
            case 6:
                i++;
                return [3 /*break*/, 2];
            case 7:
                processingTime = Date.now() - startTime;
                successCount = results.filter(function (r) { return r.success; }).length;
                logger.info("[".concat(requestId, "] Lote completado: ").concat(successCount, "/").concat(tweets.length, " exitosos en ").concat(processingTime, "ms"));
                res.json({
                    success: true,
                    results: results,
                    summary: {
                        total: tweets.length,
                        successful: successCount,
                        failed: tweets.length - successCount,
                        processingTime: "".concat(processingTime, "ms")
                    }
                });
                return [3 /*break*/, 9];
            case 8:
                error_4 = _b.sent();
                logger.error("[".concat(requestId, "] Error en generaci\u00F3n en lote:"), error_4);
                res.status(500).json({
                    success: false,
                    error: 'Error en generación en lote',
                    details: error_4.message
                });
                return [3 /*break*/, 9];
            case 9: return [2 /*return*/];
        }
    });
}); });
// DELETE /api/image/:filename - Eliminar imagen generada
router.delete('/:filename', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var filename, fs, path, filePath, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                filename = req.params.filename;
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                // Validar nombre de archivo
                if (!filename.match(/^[a-zA-Z0-9_-]+\.(png|jpg|jpeg|webp)$/)) {
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
                logger.info("Imagen eliminada: ".concat(filename), { ip: req.ip });
                res.json({
                    success: true,
                    message: 'Imagen eliminada exitosamente'
                });
                return [3 /*break*/, 4];
            case 3:
                error_5 = _a.sent();
                if (error_5.code === 'ENOENT') {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            error: 'Imagen no encontrada'
                        })];
                }
                logger.error('Error eliminando imagen:', error_5);
                res.status(500).json({
                    success: false,
                    error: 'Error eliminando imagen'
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
exports.default = router;
