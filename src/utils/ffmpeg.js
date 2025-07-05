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
Object.defineProperty(exports, "__esModule", { value: true });
exports.combineVideoWithOverlay = combineVideoWithOverlay;
exports.optimizeBackgroundVideo = optimizeBackgroundVideo;
exports.getVideoInfo = getVideoInfo;
exports.generateVideoThumbnail = generateVideoThumbnail;
exports.convertVideoToGif = convertVideoToGif;
exports.validateFFmpegInstallation = validateFFmpegInstallation;
exports.getProcessingStats = getProcessingStats;
exports.cleanupFFmpegTempFiles = cleanupFFmpegTempFiles;
// src/utils/ffmpeg.ts - Utilidades para FFmpeg
var fluent_ffmpeg_1 = require("fluent-ffmpeg");
var path_1 = require("path");
var promises_1 = require("fs/promises");
const winston = require('winston');
var logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'logs/ffmpeg.log' })
    ]
});
// Configurar ruta de FFmpeg si está especificada en variables de entorno
if (process.env.FFMPEG_PATH) {
    fluent_ffmpeg_1.default.setFfmpegPath(process.env.FFMPEG_PATH);
}
// Función principal para combinar video con overlay
function combineVideoWithOverlay(backgroundPath, overlayPath, options, requestId) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    var outputFileName = "social-video-".concat(requestId, ".mp4");
                    var outputPath = path_1.default.join('output', outputFileName);
                    logger.info("[".concat(requestId, "] Iniciando combinaci\u00F3n FFmpeg"), {
                        background: backgroundPath,
                        overlay: overlayPath,
                        output: outputPath
                    });
                    var ffmpegCommand = (0, fluent_ffmpeg_1.default)();
                    // Input del video de fondo
                    ffmpegCommand.input(backgroundPath);
                    // Input del overlay
                    ffmpegCommand.input(overlayPath);
                    // Construir filtros complejos
                    var filters = buildComplexFilters(options, requestId);
                    ffmpegCommand
                        .complexFilter(filters)
                        .outputOptions(buildOutputOptions(options))
                        .output(outputPath)
                        .on('start', function (commandLine) {
                        logger.info("[".concat(requestId, "] FFmpeg iniciado:"), { command: commandLine });
                    })
                        .on('progress', function (progress) {
                        var percent = Math.round(progress.percent || 0);
                        if (percent % 10 === 0) { // Log cada 10%
                            logger.info("[".concat(requestId, "] Progreso FFmpeg: ").concat(percent, "%"));
                        }
                    })
                        .on('end', function () {
                        logger.info("[".concat(requestId, "] FFmpeg completado exitosamente"));
                        resolve(outputPath);
                    })
                        .on('error', function (err) {
                        logger.error("[".concat(requestId, "] Error FFmpeg:"), {
                            error: err.message,
                            stack: err.stack
                        });
                        reject(new Error("Error FFmpeg: ".concat(err.message)));
                    })
                        .run();
                })];
        });
    });
}
// Construir filtros complejos según las opciones
function buildComplexFilters(options, requestId) {
    var filters = [];
    // Escalar y recortar video de fondo
    var scaleFilter = "[0:v]scale=".concat(options.width, ":").concat(options.height, ":force_original_aspect_ratio=increase,crop=").concat(options.width, ":").concat(options.height);
    // Agregar blur sutil al fondo
    var backgroundFilter = "".concat(scaleFilter, ",boxblur=2:1[bg]");
    filters.push(backgroundFilter);
    // Configurar overlay según la animación
    var overlayFilter = '[bg][1:v]overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/2';
    if (options.animation) {
        overlayFilter = addAnimationToOverlay(overlayFilter, options, requestId);
    }
    // Aplicar duración
    overlayFilter += ":enable='between(t,0.5,".concat(options.duration - 0.5, ")'[final]");
    filters.push(overlayFilter);
    // Agregar fade in/out si es necesario
    if (options.animation === 'fade') {
        filters.push("[final]fade=in:st=0:d=0.5,fade=out:st=".concat(options.duration - 0.5, ":d=0.5[output]"));
    }
    else {
        filters.push('[final]copy[output]');
    }
    logger.info("[".concat(requestId, "] Filtros construidos:"), { filters: filters });
    return filters;
}
// Agregar animación al overlay
function addAnimationToOverlay(overlayFilter, options, requestId) {
    switch (options.animation) {
        case 'slide':
            // Slide desde la derecha
            return overlayFilter.replace('(main_w-overlay_w)/2', "main_w-overlay_w*(t/".concat(options.duration, ")"));
        case 'zoom':
            // Zoom in effect
            return overlayFilter.replace('(main_w-overlay_w)/2:(main_h-overlay_h)/2', "(main_w-overlay_w*min(t*2,1))/2:(main_h-overlay_h*min(t*2,1))/2");
        case 'fade':
            // El fade se maneja en el filtro final
            return overlayFilter;
        default:
            return overlayFilter;
    }
}
// Construir opciones de salida
function buildOutputOptions(options) {
    var outputOptions = [];
    // Mapear el output final
    outputOptions.push('-map', '[output]');
    // Configurar codec de video
    if (process.env.ENABLE_GPU_ACCELERATION === 'true') {
        var gpuType = process.env.GPU_TYPE || 'nvidia';
        if (gpuType === 'nvidia') {
            outputOptions.push('-c:v', 'h264_nvenc');
        }
        else {
            outputOptions.push('-c:v', 'libx264');
        }
    }
    else {
        outputOptions.push('-c:v', 'libx264');
    }
    // Configurar preset según la calidad
    var preset = getPresetForQuality(options.quality || 'medium');
    outputOptions.push('-preset', preset);
    // Configurar CRF (Constant Rate Factor)
    var crf = getCRFForQuality(options.quality || 'medium');
    outputOptions.push('-crf', crf.toString());
    // Configurar formato de píxeles para compatibilidad
    outputOptions.push('-pix_fmt', 'yuv420p');
    // Configurar frame rate
    outputOptions.push('-r', options.fps.toString());
    // Configurar duración
    outputOptions.push('-t', options.duration.toString());
    // Eliminar audio (no lo necesitamos para videos sociales)
    outputOptions.push('-an');
    return outputOptions;
}
// Obtener preset según calidad
function getPresetForQuality(quality) {
    switch (quality) {
        case 'low': return 'ultrafast';
        case 'medium': return 'medium';
        case 'high': return 'slow';
        case 'ultra': return 'veryslow';
        default: return 'medium';
    }
}
// Obtener CRF según calidad
function getCRFForQuality(quality) {
    switch (quality) {
        case 'low': return 28;
        case 'medium': return 23;
        case 'high': return 18;
        case 'ultra': return 15;
        default: return 23;
    }
}
// Optimizar video de fondo subido
function optimizeBackgroundVideo(inputPath, requestId) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    var outputPath = path_1.default.join('videos/custom', "optimized-".concat(requestId, ".mp4"));
                    logger.info("[".concat(requestId, "] Optimizando video de fondo"), {
                        input: inputPath,
                        output: outputPath
                    });
                    (0, fluent_ffmpeg_1.default)(inputPath)
                        .outputOptions([
                        '-c:v', 'libx264',
                        '-preset', 'medium',
                        '-crf', '25',
                        '-vf', 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2',
                        '-an', // Remover audio
                        '-movflags', '+faststart' // Optimizar para streaming
                    ])
                        .output(outputPath)
                        .on('start', function (commandLine) {
                        logger.info("[".concat(requestId, "] Optimizaci\u00F3n iniciada:"), { command: commandLine });
                    })
                        .on('progress', function (progress) {
                        var percent = Math.round(progress.percent || 0);
                        if (percent % 20 === 0) {
                            logger.info("[".concat(requestId, "] Progreso optimizaci\u00F3n: ").concat(percent, "%"));
                        }
                    })
                        .on('end', function () {
                        logger.info("[".concat(requestId, "] Video optimizado exitosamente"));
                        resolve(outputPath);
                    })
                        .on('error', function (err) {
                        logger.error("[".concat(requestId, "] Error optimizando video:"), err);
                        reject(new Error("Error optimizando video: ".concat(err.message)));
                    })
                        .run();
                })];
        });
    });
}
// Obtener información de un video
function getVideoInfo(videoPath) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    fluent_ffmpeg_1.default.ffprobe(videoPath, function (err, metadata) {
                        if (err) {
                            logger.error('Error obteniendo info de video:', err);
                            reject(new Error("Error analizando video: ".concat(err.message)));
                            return;
                        }
                        try {
                            var videoStream = metadata.streams.find(function (stream) { return stream.codec_type === 'video'; });
                            if (!videoStream) {
                                reject(new Error('No se encontró stream de video'));
                                return;
                            }
                            var info = {
                                duration: metadata.format.duration || 0,
                                width: videoStream.width || 0,
                                height: videoStream.height || 0,
                                fps: eval(videoStream.r_frame_rate || '30/1'), // Evaluar fracción
                                codec: videoStream.codec_name || 'unknown',
                                bitrate: metadata.format.bit_rate ? parseInt(metadata.format.bit_rate) : 0
                            };
                            resolve(info);
                        }
                        catch (parseError) {
                            reject(new Error("Error parseando metadata: ".concat(parseError.message)));
                        }
                    });
                })];
        });
    });
}
// Crear thumbnail de un video
function generateVideoThumbnail(videoPath_1, outputPath_1) {
    return __awaiter(this, arguments, void 0, function (videoPath, outputPath, timeOffset) {
        if (timeOffset === void 0) { timeOffset = 1; }
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    (0, fluent_ffmpeg_1.default)(videoPath)
                        .seekInput(timeOffset)
                        .outputOptions([
                        '-vframes', '1',
                        '-q:v', '2',
                        '-f', 'image2'
                    ])
                        .output(outputPath)
                        .on('end', function () {
                        resolve(outputPath);
                    })
                        .on('error', function (err) {
                        reject(new Error("Error generando thumbnail: ".concat(err.message)));
                    })
                        .run();
                })];
        });
    });
}
// Convertir video a GIF animado
function convertVideoToGif(videoPath_1, outputPath_1) {
    return __awaiter(this, arguments, void 0, function (videoPath, outputPath, options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    var _a = options.width, width = _a === void 0 ? 480 : _a, _b = options.fps, fps = _b === void 0 ? 15 : _b, _c = options.duration, duration = _c === void 0 ? 3 : _c, _d = options.startTime, startTime = _d === void 0 ? 0 : _d;
                    var command = (0, fluent_ffmpeg_1.default)(videoPath)
                        .seekInput(startTime)
                        .duration(duration)
                        .outputOptions([
                        '-vf',
                        "fps=".concat(fps, ",scale=").concat(width, ":-1:flags=lanczos,palettegen"),
                        '-y'
                    ]);
                    var paletteFile = outputPath.replace('.gif', '_palette.png');
                    // Primero generar paleta de colores
                    command
                        .output(paletteFile)
                        .on('end', function () {
                        // Luego generar GIF usando la paleta
                        (0, fluent_ffmpeg_1.default)(videoPath)
                            .seekInput(startTime)
                            .duration(duration)
                            .input(paletteFile)
                            .outputOptions([
                            '-filter_complex',
                            "fps=".concat(fps, ",scale=").concat(width, ":-1:flags=lanczos[x];[x][1:v]paletteuse"),
                            '-y'
                        ])
                            .output(outputPath)
                            .on('end', function () { return __awaiter(_this, void 0, void 0, function () {
                            var error_1;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        _a.trys.push([0, 2, , 3]);
                                        return [4 /*yield*/, promises_1.default.unlink(paletteFile)];
                                    case 1:
                                        _a.sent();
                                        return [3 /*break*/, 3];
                                    case 2:
                                        error_1 = _a.sent();
                                        logger.warn('Error limpiando paleta:', error_1);
                                        return [3 /*break*/, 3];
                                    case 3:
                                        resolve(outputPath);
                                        return [2 /*return*/];
                                }
                            });
                        }); })
                            .on('error', function (err) {
                            reject(new Error("Error generando GIF: ".concat(err.message)));
                        })
                            .run();
                    })
                        .on('error', function (err) {
                        reject(new Error("Error generando paleta: ".concat(err.message)));
                    })
                        .run();
                })];
        });
    });
}
// Validar que FFmpeg esté disponible
function validateFFmpegInstallation() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve) {
                    var features = [];
                    var errors = [];
                    fluent_ffmpeg_1.default.getAvailableFormats(function (err, formats) {
                        if (err) {
                            errors.push('No se puede acceder a formatos de FFmpeg');
                        }
                        else {
                            features.push("".concat(Object.keys(formats).length, " formatos disponibles"));
                        }
                        fluent_ffmpeg_1.default.getAvailableCodecs(function (err, codecs) {
                            if (err) {
                                errors.push('No se puede acceder a codecs de FFmpeg');
                            }
                            else {
                                features.push("".concat(Object.keys(codecs).length, " codecs disponibles"));
                                // Verificar codecs importantes
                                if (codecs.libx264)
                                    features.push('H.264 disponible');
                                if (codecs.h264_nvenc)
                                    features.push('NVENC disponible');
                                if (codecs.libvpx)
                                    features.push('VP8/VP9 disponible');
                            }
                            // Verificar versión
                            (0, fluent_ffmpeg_1.default)()
                                .on('start', function (commandLine) {
                                var versionMatch = commandLine.match(/ffmpeg version ([^\s]+)/);
                                var version = versionMatch ? versionMatch[1] : 'unknown';
                                resolve({
                                    isInstalled: errors.length === 0,
                                    version: version,
                                    features: features,
                                    errors: errors
                                });
                            })
                                .on('error', function () {
                                errors.push('FFmpeg no está instalado o no es accesible');
                                resolve({
                                    isInstalled: false,
                                    features: features,
                                    errors: errors
                                });
                            })
                                .outputOptions(['-f', 'null', '-'])
                                .run();
                        });
                    });
                })];
        });
    });
}
// Obtener estadísticas de procesamiento
function getProcessingStats() {
    return __awaiter(this, void 0, void 0, function () {
        var logContent, lines, completedJobs, failedJobs, totalJobs, successRate, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, promises_1.default.readFile('logs/ffmpeg.log', 'utf-8').catch(function () { return ''; })];
                case 1:
                    logContent = _a.sent();
                    lines = logContent.split('\n').filter(function (line) { return line.length > 0; });
                    completedJobs = lines.filter(function (line) {
                        return line.includes('FFmpeg completado exitosamente');
                    }).length;
                    failedJobs = lines.filter(function (line) {
                        return line.includes('Error FFmpeg');
                    }).length;
                    totalJobs = completedJobs + failedJobs;
                    successRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 100;
                    return [2 /*return*/, {
                            activeJobs: 0, // Se obtendría de un sistema de colas real
                            queueLength: 0,
                            averageProcessingTime: 0, // Se calcularía de los logs
                            successRate: Math.round(successRate)
                        }];
                case 2:
                    error_2 = _a.sent();
                    logger.error('Error obteniendo estadísticas de procesamiento:', error_2);
                    return [2 /*return*/, {
                            activeJobs: 0,
                            queueLength: 0,
                            averageProcessingTime: 0,
                            successRate: 0
                        }];
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Limpiar archivos temporales de FFmpeg
function cleanupFFmpegTempFiles() {
    return __awaiter(this, void 0, void 0, function () {
        var cleanedFiles, tempDir, files, _i, files_1, file, error_3, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    cleanedFiles = 0;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 9, , 10]);
                    tempDir = 'temp';
                    return [4 /*yield*/, promises_1.default.readdir(tempDir).catch(function () { return []; })];
                case 2:
                    files = _a.sent();
                    _i = 0, files_1 = files;
                    _a.label = 3;
                case 3:
                    if (!(_i < files_1.length)) return [3 /*break*/, 8];
                    file = files_1[_i];
                    if (!(file.includes('ffmpeg') || file.includes('overlay-'))) return [3 /*break*/, 7];
                    _a.label = 4;
                case 4:
                    _a.trys.push([4, 6, , 7]);
                    return [4 /*yield*/, promises_1.default.unlink(path_1.default.join(tempDir, file))];
                case 5:
                    _a.sent();
                    cleanedFiles++;
                    logger.info("Archivo temporal limpiado: ".concat(file));
                    return [3 /*break*/, 7];
                case 6:
                    error_3 = _a.sent();
                    logger.warn("Error limpiando ".concat(file, ":"), error_3);
                    return [3 /*break*/, 7];
                case 7:
                    _i++;
                    return [3 /*break*/, 3];
                case 8: return [3 /*break*/, 10];
                case 9:
                    error_4 = _a.sent();
                    logger.error('Error en limpieza de archivos temporales:', error_4);
                    return [3 /*break*/, 10];
                case 10: return [2 /*return*/, cleanedFiles];
            }
        });
    });
}
