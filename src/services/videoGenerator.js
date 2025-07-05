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
exports.generateVideo = generateVideo;
exports.checkSystemCapacity = checkSystemCapacity;
exports.getProcessingStats = getProcessingStats;
exports.generateAdvancedVideo = generateAdvancedVideo;
exports.generateVideoVariations = generateVideoVariations;
exports.scheduleVideoGeneration = scheduleVideoGeneration;
exports.cancelVideoGeneration = cancelVideoGeneration;
exports.getGenerationProgress = getGenerationProgress;
// src/services/videoGenerator.ts - Servicio principal de generación de videos
var path_1 = require("path");
var promises_1 = require("fs/promises");
const winston = require('winston');
var uuid_1 = require("uuid");
var canvas_1 = require("../utils/canvas");
var ffmpeg_1 = require("../utils/ffmpeg");
var fileUtils_1 = require("../utils/fileUtils");
var logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'logs/video-generator.log' })
    ]
});
function generateVideo(tweetData, options, requestId) {
    return __awaiter(this, void 0, void 0, function () {
        var startTime, overlayPath, backgroundPath, error_1, outputPath, stats, fileSize, fileName, publicUrl, processingTime, error_2, processingTime, cleanupError_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    startTime = Date.now();
                    overlayPath = null;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 9, 10, 15]);
                    logger.info("[".concat(requestId, "] Iniciando generaci\u00F3n de video"), {
                        username: tweetData.username,
                        duration: options.duration,
                        style: options.style,
                        animation: options.animation
                    });
                    // Paso 1: Validar video de fondo
                    if (!options.backgroundVideo) {
                        throw new Error('Video de fondo no especificado');
                    }
                    backgroundPath = path_1.default.resolve(options.backgroundVideo);
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, promises_1.default.access(backgroundPath)];
                case 3:
                    _a.sent();
                    logger.info("[".concat(requestId, "] Video de fondo validado: ").concat(backgroundPath));
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _a.sent();
                    throw new Error("Video de fondo no encontrado: ".concat(backgroundPath));
                case 5:
                    // Paso 2: Generar overlay glassmorphism
                    logger.info("[".concat(requestId, "] Generando overlay glassmorphism..."));
                    return [4 /*yield*/, (0, canvas_1.generateGlassmorphismOverlay)(tweetData, options, requestId)];
                case 6:
                    overlayPath = _a.sent();
                    logger.info("[".concat(requestId, "] Overlay generado: ").concat(overlayPath));
                    // Paso 3: Combinar video + overlay con FFmpeg
                    logger.info("[".concat(requestId, "] Combinando video con overlay..."));
                    return [4 /*yield*/, (0, ffmpeg_1.combineVideoWithOverlay)(backgroundPath, overlayPath, options, requestId)
                        // Paso 4: Obtener información del archivo generado
                    ];
                case 7:
                    outputPath = _a.sent();
                    return [4 /*yield*/, promises_1.default.stat(outputPath)];
                case 8:
                    stats = _a.sent();
                    fileSize = "".concat((stats.size / (1024 * 1024)).toFixed(2), "MB");
                    fileName = path_1.default.basename(outputPath);
                    publicUrl = "".concat(process.env.PUBLIC_URL, "/output/").concat(fileName);
                    processingTime = Date.now() - startTime;
                    logger.info("[".concat(requestId, "] Video generado exitosamente"), {
                        outputPath: outputPath,
                        fileSize: fileSize,
                        processingTime: "".concat(processingTime, "ms")
                    });
                    return [2 /*return*/, {
                            success: true,
                            videoUrl: publicUrl,
                            size: fileSize
                        }];
                case 9:
                    error_2 = _a.sent();
                    processingTime = Date.now() - startTime;
                    logger.error("[".concat(requestId, "] Error en generaci\u00F3n de video despu\u00E9s de ").concat(processingTime, "ms"), {
                        error: error_2.message,
                        stack: error_2.stack
                    });
                    throw error_2;
                case 10:
                    if (!overlayPath) return [3 /*break*/, 14];
                    _a.label = 11;
                case 11:
                    _a.trys.push([11, 13, , 14]);
                    return [4 /*yield*/, (0, fileUtils_1.cleanupTempFile)(overlayPath)];
                case 12:
                    _a.sent();
                    logger.info("[".concat(requestId, "] Overlay temporal limpiado: ").concat(overlayPath));
                    return [3 /*break*/, 14];
                case 13:
                    cleanupError_1 = _a.sent();
                    logger.warn("[".concat(requestId, "] Error limpiando overlay: ").concat(cleanupError_1));
                    return [3 /*break*/, 14];
                case 14: return [7 /*endfinally*/];
                case 15: return [2 /*return*/];
            }
        });
    });
}
// Función para validar capacidad del sistema antes de generar
function checkSystemCapacity() {
    return __awaiter(this, void 0, void 0, function () {
        var memoryUsage, totalMemoryMB, usedMemoryMB, availableMemoryMB, tempStats, outputFiles, maxFiles, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    memoryUsage = process.memoryUsage();
                    totalMemoryMB = memoryUsage.heapTotal / (1024 * 1024);
                    usedMemoryMB = memoryUsage.heapUsed / (1024 * 1024);
                    availableMemoryMB = totalMemoryMB - usedMemoryMB;
                    if (availableMemoryMB < 500) { // Menos de 500MB disponibles
                        return [2 /*return*/, {
                                canProcess: false,
                                reason: 'Memoria insuficiente para procesar video'
                            }];
                    }
                    return [4 /*yield*/, promises_1.default.stat('temp').catch(function () { return null; })];
                case 1:
                    tempStats = _a.sent();
                    if (!!tempStats) return [3 /*break*/, 3];
                    return [4 /*yield*/, promises_1.default.mkdir('temp', { recursive: true })];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3: return [4 /*yield*/, promises_1.default.readdir('output').catch(function () { return []; })];
                case 4:
                    outputFiles = _a.sent();
                    maxFiles = parseInt(process.env.MAX_OUTPUT_FILES || '1000');
                    if (outputFiles.length >= maxFiles) {
                        return [2 /*return*/, {
                                canProcess: false,
                                reason: 'Límite de archivos de salida alcanzado'
                            }];
                    }
                    return [2 /*return*/, { canProcess: true }];
                case 5:
                    error_3 = _a.sent();
                    logger.error('Error verificando capacidad del sistema:', error_3);
                    return [2 /*return*/, {
                            canProcess: false,
                            reason: 'Error verificando recursos del sistema'
                        }];
                case 6: return [2 /*return*/];
            }
        });
    });
}
// Función para obtener estadísticas de procesamiento
function getProcessingStats() {
    return __awaiter(this, void 0, void 0, function () {
        var logFiles, videoLogExists, completedToday, averageProcessingTime, logContent, today_1, todayEntries, processingTimes, logError_1, memoryUsage, memoryPercent, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 6, , 7]);
                    return [4 /*yield*/, promises_1.default.readdir('logs').catch(function () { return []; })];
                case 1:
                    logFiles = _a.sent();
                    videoLogExists = logFiles.includes('video-generator.log');
                    completedToday = 0;
                    averageProcessingTime = 0;
                    if (!videoLogExists) return [3 /*break*/, 5];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, promises_1.default.readFile('logs/video-generator.log', 'utf-8')];
                case 3:
                    logContent = _a.sent();
                    today_1 = new Date().toISOString().split('T')[0];
                    todayEntries = logContent
                        .split('\n')
                        .filter(function (line) { return line.includes(today_1) && line.includes('Video generado exitosamente'); });
                    completedToday = todayEntries.length;
                    processingTimes = todayEntries
                        .map(function (line) {
                        var match = line.match(/"processingTime":"(\d+)ms"/);
                        return match ? parseInt(match[1]) : 0;
                    })
                        .filter(function (time) { return time > 0; });
                    if (processingTimes.length > 0) {
                        averageProcessingTime = processingTimes.reduce(function (a, b) { return a + b; }, 0) / processingTimes.length;
                    }
                    return [3 /*break*/, 5];
                case 4:
                    logError_1 = _a.sent();
                    logger.warn('Error leyendo logs para estadísticas:', logError_1);
                    return [3 /*break*/, 5];
                case 5:
                    memoryUsage = process.memoryUsage();
                    memoryPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
                    return [2 /*return*/, {
                            activeJobs: 0, // En implementación real, esto vendría de un sistema de colas
                            completedToday: completedToday,
                            averageProcessingTime: Math.round(averageProcessingTime),
                            systemLoad: {
                                memory: Math.round(memoryPercent),
                                cpu: 0 // Requeriría una librería adicional para obtener CPU usage
                            }
                        }];
                case 6:
                    error_4 = _a.sent();
                    logger.error('Error obteniendo estadísticas:', error_4);
                    return [2 /*return*/, {
                            activeJobs: 0,
                            completedToday: 0,
                            averageProcessingTime: 0,
                            systemLoad: {
                                memory: 0,
                                cpu: 0
                            }
                        }];
                case 7: return [2 /*return*/];
            }
        });
    });
}
// Función para generar video con opciones avanzadas
function generateAdvancedVideo(tweetData, options, requestId) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            // Esta función extendería generateVideo con funcionalidades avanzadas
            // Por ahora, delegamos a la función básica
            logger.info("[".concat(requestId, "] Generaci\u00F3n avanzada solicitada, usando generaci\u00F3n b\u00E1sica"));
            return [2 /*return*/, generateVideo(tweetData, options, requestId)];
        });
    });
}
// Función para generar múltiples variaciones de un video
function generateVideoVariations(tweetData, baseOptions, variations, requestId) {
    return __awaiter(this, void 0, void 0, function () {
        var results, i, variationOptions, variationId, result, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    results = [];
                    i = 0;
                    _a.label = 1;
                case 1:
                    if (!(i < variations.length)) return [3 /*break*/, 6];
                    variationOptions = __assign(__assign({}, baseOptions), variations[i]);
                    variationId = "".concat(requestId, "-var-").concat(i);
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, generateVideo(tweetData, variationOptions, variationId)];
                case 3:
                    result = _a.sent();
                    results.push(__assign(__assign({}, result), { variation: "Variaci\u00F3n ".concat(i + 1) }));
                    return [3 /*break*/, 5];
                case 4:
                    error_5 = _a.sent();
                    results.push({
                        success: false,
                        error: error_5.message,
                        variation: "Variaci\u00F3n ".concat(i + 1)
                    });
                    return [3 /*break*/, 5];
                case 5:
                    i++;
                    return [3 /*break*/, 1];
                case 6: return [2 /*return*/, results];
            }
        });
    });
}
// Función para programar generación de video (para implementación futura)
function scheduleVideoGeneration(tweetData, options, scheduleTime) {
    return __awaiter(this, void 0, void 0, function () {
        var jobId;
        return __generator(this, function (_a) {
            jobId = (0, uuid_1.v4)();
            logger.info('Video programado para generación', {
                jobId: jobId,
                scheduledFor: scheduleTime.toISOString(),
                username: tweetData.username
            });
            // En una implementación real, esto se agregaría a una cola de trabajos
            // Por ahora, solo registramos la solicitud
            return [2 /*return*/, {
                    success: true,
                    jobId: jobId,
                    scheduledFor: scheduleTime.toISOString()
                }];
        });
    });
}
// Función para cancelar generación de video
function cancelVideoGeneration(requestId) {
    // En una implementación real, esto cancelaría procesos FFmpeg activos
    logger.info("Cancelaci\u00F3n solicitada para: ".concat(requestId));
    return {
        success: true,
        message: 'Solicitud de cancelación registrada'
    };
}
// Función para obtener progreso de generación (para WebSockets en el futuro)
function getGenerationProgress(requestId) {
    // En una implementación real, esto consultaría el estado actual del proceso
    return {
        stage: 'processing',
        percentage: 50,
        message: 'Combinando video con overlay...',
        estimatedTimeRemaining: 30
    };
}
