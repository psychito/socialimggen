"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
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
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const winston_1 = __importDefault(require("winston"));
const logger = winston_1.default.createLogger({
    level: 'info',
    format: winston_1.default.format.json(),
    transports: [
        new winston_1.default.transports.File({ filename: 'logs/ffmpeg.log' })
    ]
});
if (process.env.FFMPEG_PATH) {
    fluent_ffmpeg_1.default.setFfmpegPath(process.env.FFMPEG_PATH);
}
async function combineVideoWithOverlay(backgroundPath, overlayPath, options, requestId) {
    return new Promise((resolve, reject) => {
        const outputFileName = `social-video-${requestId}.mp4`;
        const outputPath = path_1.default.join('output', outputFileName);
        logger.info(`[${requestId}] Iniciando combinación FFmpeg`, {
            background: backgroundPath,
            overlay: overlayPath,
            output: outputPath
        });
        const ffmpegCommand = (0, fluent_ffmpeg_1.default)();
        ffmpegCommand.input(backgroundPath);
        ffmpegCommand.input(overlayPath);
        const filters = buildComplexFilters(options, requestId);
        ffmpegCommand
            .complexFilter(filters)
            .outputOptions(buildOutputOptions(options))
            .output(outputPath)
            .on('start', (commandLine) => {
            logger.info(`[${requestId}] FFmpeg iniciado:`, { command: commandLine });
        })
            .on('progress', (progress) => {
            const percent = Math.round(progress.percent || 0);
            if (percent % 10 === 0) {
                logger.info(`[${requestId}] Progreso FFmpeg: ${percent}%`);
            }
        })
            .on('end', () => {
            logger.info(`[${requestId}] FFmpeg completado exitosamente`);
            resolve(outputPath);
        })
            .on('error', (err) => {
            logger.error(`[${requestId}] Error FFmpeg:`, {
                error: err.message,
                stack: err.stack
            });
            reject(new Error(`Error FFmpeg: ${err.message}`));
        })
            .run();
    });
}
function buildComplexFilters(options, requestId) {
    const filters = [];
    let scaleFilter = `[0:v]scale=${options.width}:${options.height}:force_original_aspect_ratio=increase:flags=lanczos,crop=${options.width}:${options.height}`;
    if (options.backgroundPlaybackRate && options.backgroundPlaybackRate !== 1) {
        scaleFilter += `,setpts=${(1 / options.backgroundPlaybackRate).toFixed(2)}*PTS`;
    }
    const blurValue = options.overlayBlur !== undefined ? options.overlayBlur : 2;
    let backgroundFilter = scaleFilter;
    if (blurValue > 0) {
        backgroundFilter += `,gblur=sigma=${blurValue}:steps=2`;
    }
    backgroundFilter += '[bg]';
    filters.push(backgroundFilter);
    let overlayPreprocessing = '[1:v]';
    if (options.width !== 1080 || options.height !== 1920) {
        overlayPreprocessing += `scale=${options.width}:${options.height}:flags=lanczos,`;
    }
    overlayPreprocessing += 'format=yuva420p[overlay_processed]';
    filters.push(overlayPreprocessing);
    let overlayFilter = '[bg][overlay_processed]overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/2';
    if (options.animation) {
        overlayFilter = addAnimationToOverlay(overlayFilter, options, requestId);
    }
    overlayFilter += `[final]`;
    filters.push(overlayFilter);
    let fadeFilter = `[final]fade=in:st=0:d=0.5`;
    if (options.quality === 'high' || options.quality === 'ultra') {
        fadeFilter += `,unsharp=5:5:0.8:3:3:0.4`;
    }
    fadeFilter += '[output]';
    filters.push(fadeFilter);
    logger.info(`[${requestId}] Filtros mejorados construidos:`, { filters });
    return filters;
}
function addAnimationToOverlay(overlayFilter, options, requestId) {
    const safeDuration = options.duration ?? 10;
    switch (options.animation) {
        case 'slide':
            return overlayFilter.replace('(main_w-overlay_w)/2', `main_w-overlay_w*(t/${safeDuration})`);
        case 'zoom':
            return overlayFilter.replace('(main_w-overlay_w)/2:(main_h-overlay_h)/2', `(main_w-overlay_w*min(t*2,1))/2:(main_h-overlay_h*min(t*2,1))/2`);
        case 'fade':
            return overlayFilter;
        default:
            return overlayFilter;
    }
}
function buildOutputOptions(options) {
    const outputOptions = [];
    outputOptions.push('-map', '[output]');
    if (process.env.ENABLE_GPU_ACCELERATION === 'true') {
        const gpuType = process.env.GPU_TYPE || 'nvidia';
        if (gpuType === 'nvidia') {
            outputOptions.push('-c:v', 'h264_nvenc');
            outputOptions.push('-profile:v', 'high');
            outputOptions.push('-rc', 'vbr');
            outputOptions.push('-cq', getCRFForQuality(options.quality || 'medium').toString());
            outputOptions.push('-b:v', getBitrateForQuality(options.quality || 'medium', options.width, options.height));
            outputOptions.push('-maxrate', getMaxBitrateForQuality(options.quality || 'medium', options.width, options.height));
            outputOptions.push('-bufsize', getBufferSizeForQuality(options.quality || 'medium', options.width, options.height));
        }
        else {
            outputOptions.push('-c:v', 'libx264');
        }
    }
    else {
        outputOptions.push('-c:v', 'libx264');
    }
    if (process.env.ENABLE_GPU_ACCELERATION !== 'true' || process.env.GPU_TYPE !== 'nvidia') {
        const preset = getPresetForQuality(options.quality || 'medium');
        outputOptions.push('-preset', preset);
        const crf = getCRFForQuality(options.quality || 'medium');
        outputOptions.push('-crf', crf.toString());
        outputOptions.push('-profile:v', 'high');
        outputOptions.push('-level', '4.1');
    }
    outputOptions.push('-pix_fmt', 'yuv420p');
    outputOptions.push('-r', options.fps.toString());
    const safeDuration = options.duration ?? 10;
    outputOptions.push('-t', safeDuration.toString());
    outputOptions.push('-movflags', '+faststart');
    outputOptions.push('-avoid_negative_ts', 'make_zero');
    const gopSize = Math.round(options.fps * 2);
    outputOptions.push('-g', gopSize.toString());
    outputOptions.push('-an');
    return outputOptions;
}
function getPresetForQuality(quality) {
    switch (quality) {
        case 'low': return 'ultrafast';
        case 'medium': return 'slow';
        case 'high': return 'veryslow';
        case 'ultra': return 'veryslow';
        default: return 'slow';
    }
}
function getCRFForQuality(quality) {
    switch (quality) {
        case 'low': return 25;
        case 'medium': return 20;
        case 'high': return 16;
        case 'ultra': return 12;
        default: return 20;
    }
}
function getBitrateForQuality(quality, width, height) {
    const pixelCount = width * height;
    const baseMultiplier = pixelCount / (1920 * 1080);
    let baseBitrate;
    switch (quality) {
        case 'low':
            baseBitrate = 2000;
            break;
        case 'medium':
            baseBitrate = 4000;
            break;
        case 'high':
            baseBitrate = 8000;
            break;
        case 'ultra':
            baseBitrate = 12000;
            break;
        default: baseBitrate = 4000;
    }
    const finalBitrate = Math.round(baseBitrate * baseMultiplier);
    return `${finalBitrate}k`;
}
function getMaxBitrateForQuality(quality, width, height) {
    const baseBitrate = parseInt(getBitrateForQuality(quality, width, height).replace('k', ''));
    const maxBitrate = Math.round(baseBitrate * 1.5);
    return `${maxBitrate}k`;
}
function getBufferSizeForQuality(quality, width, height) {
    const baseBitrate = parseInt(getBitrateForQuality(quality, width, height).replace('k', ''));
    const bufferSize = Math.round(baseBitrate * 2);
    return `${bufferSize}k`;
}
async function optimizeBackgroundVideo(inputPath, requestId) {
    return new Promise((resolve, reject) => {
        const outputPath = path_1.default.join('videos/custom', `optimized-${requestId}.mp4`);
        logger.info(`[${requestId}] Optimizando video de fondo`, {
            input: inputPath,
            output: outputPath
        });
        (0, fluent_ffmpeg_1.default)(inputPath)
            .outputOptions([
            '-c:v', 'libx264',
            '-preset', 'slow',
            '-crf', '20',
            '-profile:v', 'high',
            '-level', '4.1',
            '-vf', 'scale=1920:1080:force_original_aspect_ratio=decrease:flags=lanczos,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=black',
            '-pix_fmt', 'yuv420p',
            '-g', '60',
            '-an',
            '-movflags', '+faststart',
            '-avoid_negative_ts', 'make_zero'
        ])
            .output(outputPath)
            .on('start', (commandLine) => {
            logger.info(`[${requestId}] Optimización iniciada:`, { command: commandLine });
        })
            .on('progress', (progress) => {
            const percent = Math.round(progress.percent || 0);
            if (percent % 20 === 0) {
                logger.info(`[${requestId}] Progreso optimización: ${percent}%`);
            }
        })
            .on('end', () => {
            logger.info(`[${requestId}] Video optimizado exitosamente`);
            resolve(outputPath);
        })
            .on('error', (err) => {
            logger.error(`[${requestId}] Error optimizando video:`, err);
            reject(new Error(`Error optimizando video: ${err.message}`));
        })
            .run();
    });
}
async function getVideoInfo(videoPath) {
    return new Promise((resolve, reject) => {
        fluent_ffmpeg_1.default.ffprobe(videoPath, (err, metadata) => {
            if (err) {
                logger.error('Error obteniendo info de video:', err);
                reject(new Error(`Error analizando video: ${err.message}`));
                return;
            }
            try {
                const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
                if (!videoStream) {
                    reject(new Error('No se encontró stream de video'));
                    return;
                }
                const info = {
                    duration: metadata.format.duration || 0,
                    width: videoStream.width || 0,
                    height: videoStream.height || 0,
                    fps: eval(videoStream.r_frame_rate || '30/1'),
                    codec: videoStream.codec_name || 'unknown',
                    bitrate: typeof metadata.format.bit_rate === 'string' ? parseInt(metadata.format.bit_rate) : (metadata.format.bit_rate || 0)
                };
                resolve(info);
            }
            catch (parseError) {
                reject(new Error(`Error parseando metadata: ${parseError.message}`));
            }
        });
    });
}
async function generateVideoThumbnail(videoPath, outputPath, timeOffset = 1) {
    return new Promise((resolve, reject) => {
        (0, fluent_ffmpeg_1.default)(videoPath)
            .seekInput(timeOffset)
            .outputOptions([
            '-vframes', '1',
            '-q:v', '2',
            '-f', 'image2'
        ])
            .output(outputPath)
            .on('end', () => {
            resolve(outputPath);
        })
            .on('error', (err) => {
            reject(new Error(`Error generando thumbnail: ${err.message}`));
        })
            .run();
    });
}
async function convertVideoToGif(videoPath, outputPath, options = {}) {
    return new Promise((resolve, reject) => {
        const { width = 480, fps = 15, duration = 3, startTime = 0 } = options;
        const command = (0, fluent_ffmpeg_1.default)(videoPath)
            .seekInput(startTime)
            .duration(duration)
            .outputOptions([
            '-vf', `fps=${fps},scale=${width}:-1:flags=lanczos,palettegen`,
            '-y'
        ]);
        const paletteFile = outputPath.replace('.gif', '_palette.png');
        command
            .output(paletteFile)
            .on('end', () => {
            (0, fluent_ffmpeg_1.default)(videoPath)
                .seekInput(startTime)
                .duration(duration)
                .input(paletteFile)
                .outputOptions([
                '-filter_complex', `fps=${fps},scale=${width}:-1:flags=lanczos[x];[x][1:v]paletteuse`,
                '-y'
            ])
                .output(outputPath)
                .on('end', async () => {
                try {
                    await promises_1.default.unlink(paletteFile);
                }
                catch (error) {
                    logger.warn('Error limpiando paleta:', error);
                }
                resolve(outputPath);
            })
                .on('error', (err) => {
                reject(new Error(`Error generando GIF: ${err.message}`));
            })
                .run();
        })
            .on('error', (err) => {
            reject(new Error(`Error generando paleta: ${err.message}`));
        })
            .run();
    });
}
async function validateFFmpegInstallation() {
    return new Promise((resolve) => {
        const features = [];
        const errors = [];
        fluent_ffmpeg_1.default.getAvailableFormats((err, formats) => {
            if (err) {
                errors.push('No se puede acceder a formatos de FFmpeg');
            }
            else {
                features.push(`${Object.keys(formats).length} formatos disponibles`);
            }
            fluent_ffmpeg_1.default.getAvailableCodecs((err, codecs) => {
                if (err) {
                    errors.push('No se puede acceder a codecs de FFmpeg');
                }
                else {
                    features.push(`${Object.keys(codecs).length} codecs disponibles`);
                    if (codecs.libx264)
                        features.push('H.264 disponible');
                    if (codecs.h264_nvenc)
                        features.push('NVENC disponible');
                    if (codecs.libvpx)
                        features.push('VP8/VP9 disponible');
                }
                (0, fluent_ffmpeg_1.default)()
                    .on('start', (commandLine) => {
                    const versionMatch = commandLine.match(/ffmpeg version ([^\s]+)/);
                    const version = versionMatch ? versionMatch[1] : 'unknown';
                    resolve({
                        isInstalled: errors.length === 0,
                        version,
                        features,
                        errors
                    });
                })
                    .on('error', () => {
                    errors.push('FFmpeg no está instalado o no es accesible');
                    resolve({
                        isInstalled: false,
                        features,
                        errors
                    });
                })
                    .outputOptions(['-f', 'null', '-'])
                    .run();
            });
        });
    });
}
async function getProcessingStats() {
    try {
        const logContent = await promises_1.default.readFile('logs/ffmpeg.log', 'utf-8').catch(() => '');
        const lines = logContent.split('\n').filter(line => line.length > 0);
        const completedJobs = lines.filter(line => line.includes('FFmpeg completado exitosamente')).length;
        const failedJobs = lines.filter(line => line.includes('Error FFmpeg')).length;
        const totalJobs = completedJobs + failedJobs;
        const successRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 100;
        return {
            activeJobs: 0,
            queueLength: 0,
            averageProcessingTime: 0,
            successRate: Math.round(successRate)
        };
    }
    catch (error) {
        logger.error('Error obteniendo estadísticas de procesamiento:', error);
        return {
            activeJobs: 0,
            queueLength: 0,
            averageProcessingTime: 0,
            successRate: 0
        };
    }
}
async function cleanupFFmpegTempFiles() {
    let cleanedFiles = 0;
    try {
        const tempDir = 'temp';
        const files = await promises_1.default.readdir(tempDir).catch(() => []);
        for (const file of files) {
            if (file.includes('ffmpeg') || file.includes('overlay-')) {
                try {
                    await promises_1.default.unlink(path_1.default.join(tempDir, file));
                    cleanedFiles++;
                    logger.info(`Archivo temporal limpiado: ${file}`);
                }
                catch (error) {
                    logger.warn(`Error limpiando ${file}:`, error);
                }
            }
        }
    }
    catch (error) {
        logger.error('Error en limpieza de archivos temporales:', error);
    }
    return cleanedFiles;
}
//# sourceMappingURL=ffmpeg.js.map