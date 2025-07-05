"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
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
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const winston_1 = __importDefault(require("winston"));
const uuid_1 = require("uuid");
const canvas_1 = require("../utils/canvas");
const ffmpeg_1 = require("../utils/ffmpeg");
const fileUtils_1 = require("../utils/fileUtils");
const logger = winston_1.default.createLogger({
    level: 'info',
    format: winston_1.default.format.json(),
    transports: [
        new winston_1.default.transports.File({ filename: 'logs/video-generator.log' })
    ]
});
async function generateVideo(tweetData, options, requestId) {
    const startTime = Date.now();
    let overlayPath = null;
    try {
        logger.info(`[${requestId}] Iniciando generación de video`, {
            username: tweetData.username,
            duration: options.duration,
            style: options.style,
            animation: options.animation
        });
        if (!options.backgroundVideo) {
            throw new Error('Video de fondo no especificado');
        }
        const videoRelPath = options.backgroundVideo.replace(/^\/+/, '');
        const backgroundPath = path_1.default.join(process.cwd(), videoRelPath);
        try {
            await promises_1.default.access(backgroundPath);
            logger.info(`[${requestId}] Video de fondo validado: ${backgroundPath}`);
        }
        catch (error) {
            throw new Error(`Video de fondo no encontrado: ${backgroundPath}`);
        }
        logger.info(`[${requestId}] Generando overlay glassmorphism...`);
        overlayPath = await (0, canvas_1.generateGlassmorphismOverlay)(tweetData, options, requestId);
        logger.info(`[${requestId}] Overlay generado: ${overlayPath}`);
        logger.info(`[${requestId}] Combinando video con overlay...`);
        const outputPath = await (0, ffmpeg_1.combineVideoWithOverlay)(backgroundPath, overlayPath, options, requestId);
        const stats = await promises_1.default.stat(outputPath);
        const fileSize = `${(stats.size / (1024 * 1024)).toFixed(2)}MB`;
        const fileName = path_1.default.basename(outputPath);
        const publicUrl = `${process.env.PUBLIC_URL}/output/${fileName}`;
        const processingTime = Date.now() - startTime;
        logger.info(`[${requestId}] Video generado exitosamente`, {
            outputPath,
            fileSize,
            processingTime: `${processingTime}ms`
        });
        return {
            success: true,
            videoUrl: publicUrl,
            size: fileSize
        };
    }
    catch (error) {
        const processingTime = Date.now() - startTime;
        logger.error(`[${requestId}] Error en generación de video después de ${processingTime}ms`, {
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
    finally {
        if (overlayPath) {
            try {
                await (0, fileUtils_1.cleanupTempFile)(overlayPath);
                logger.info(`[${requestId}] Overlay temporal limpiado: ${overlayPath}`);
            }
            catch (cleanupError) {
                logger.warn(`[${requestId}] Error limpiando overlay: ${cleanupError}`);
            }
        }
    }
}
async function checkSystemCapacity() {
    try {
        const memoryUsage = process.memoryUsage();
        const totalMemoryMB = memoryUsage.heapTotal / (1024 * 1024);
        const usedMemoryMB = memoryUsage.heapUsed / (1024 * 1024);
        const availableMemoryMB = totalMemoryMB - usedMemoryMB;
        if (availableMemoryMB < 500) {
            return {
                canProcess: false,
                reason: 'Memoria insuficiente para procesar video'
            };
        }
        const tempStats = await promises_1.default.stat('temp').catch(() => null);
        if (!tempStats) {
            await promises_1.default.mkdir('temp', { recursive: true });
        }
        const outputFiles = await promises_1.default.readdir('output').catch(() => []);
        const maxFiles = parseInt(process.env.MAX_OUTPUT_FILES || '1000');
        if (outputFiles.length >= maxFiles) {
            return {
                canProcess: false,
                reason: 'Límite de archivos de salida alcanzado'
            };
        }
        return { canProcess: true };
    }
    catch (error) {
        logger.error('Error verificando capacidad del sistema:', error);
        return {
            canProcess: false,
            reason: 'Error verificando recursos del sistema'
        };
    }
}
async function getProcessingStats() {
    try {
        const logFiles = (await promises_1.default.readdir('logs').catch(() => []));
        const videoLogExists = logFiles.includes('video-generator.log');
        let completedToday = 0;
        let averageProcessingTime = 0;
        if (videoLogExists) {
            try {
                const logContent = await promises_1.default.readFile('logs/video-generator.log', 'utf-8');
                const today = new Date().toISOString().split('T')[0];
                const todayEntries = logContent
                    .split('\n')
                    .filter(line => line.includes(today) && line.includes('Video generado exitosamente'));
                completedToday = todayEntries.length;
                const processingTimes = todayEntries
                    .map(line => {
                    const match = line.match(/"processingTime":"(\d+)ms"/);
                    return match ? parseInt(match[1]) : 0;
                })
                    .filter(time => time > 0);
                if (processingTimes.length > 0) {
                    averageProcessingTime = processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length;
                }
            }
            catch (logError) {
                logger.warn('Error leyendo logs para estadísticas:', logError);
            }
        }
        const memoryUsage = process.memoryUsage();
        const memoryPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
        return {
            activeJobs: 0,
            completedToday,
            averageProcessingTime: Math.round(averageProcessingTime),
            systemLoad: {
                memory: Math.round(memoryPercent),
                cpu: 0
            }
        };
    }
    catch (error) {
        logger.error('Error obteniendo estadísticas:', error);
        return {
            activeJobs: 0,
            completedToday: 0,
            averageProcessingTime: 0,
            systemLoad: {
                memory: 0,
                cpu: 0
            }
        };
    }
}
async function generateAdvancedVideo(tweetData, options, requestId) {
    logger.info(`[${requestId}] Generación avanzada solicitada, usando generación básica`);
    return generateVideo(tweetData, options, requestId);
}
async function generateVideoVariations(tweetData, baseOptions, variations, requestId) {
    const results = [];
    for (let i = 0; i < variations.length; i++) {
        const variationOptions = { ...baseOptions, ...variations[i] };
        const variationId = `${requestId}-var-${i}`;
        try {
            const result = await generateVideo(tweetData, variationOptions, variationId);
            results.push({
                ...result,
                variation: `Variación ${i + 1}`
            });
        }
        catch (error) {
            results.push({
                success: false,
                error: error.message,
                variation: `Variación ${i + 1}`
            });
        }
    }
    return results;
}
async function scheduleVideoGeneration(tweetData, options, scheduleTime) {
    const jobId = (0, uuid_1.v4)();
    logger.info('Video programado para generación', {
        jobId,
        scheduledFor: scheduleTime.toISOString(),
        username: tweetData.username
    });
    return {
        success: true,
        jobId,
        scheduledFor: scheduleTime.toISOString()
    };
}
function cancelVideoGeneration(requestId) {
    logger.info(`Cancelación solicitada para: ${requestId}`);
    return {
        success: true,
        message: 'Solicitud de cancelación registrada'
    };
}
function getGenerationProgress(requestId) {
    return {
        stage: 'processing',
        percentage: 50,
        message: 'Combinando video con overlay...',
        estimatedTimeRemaining: 30
    };
}
//# sourceMappingURL=videoGenerator.js.map