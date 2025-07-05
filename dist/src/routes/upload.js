"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const winston_1 = __importDefault(require("winston"));
const uuid_1 = require("uuid");
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const ffmpeg_1 = require("../utils/ffmpeg");
const router = (0, express_1.Router)();
const logger = winston_1.default.createLogger({
    level: 'info',
    format: winston_1.default.format.json(),
    transports: [
        new winston_1.default.transports.File({ filename: 'logs/upload.log' })
    ]
});
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueName = `${(0, uuid_1.v4)()}-${Date.now()}${path_1.default.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});
const fileFilter = (req, file, cb) => {
    const allowedMimes = [
        'video/mp4',
        'video/mpeg',
        'video/quicktime',
        'video/x-msvideo',
        'video/x-ms-wmv',
        'video/webm',
        'video/x-matroska'
    ];
    const allowedExtensions = ['.mp4', '.mov', '.avi', '.wmv', '.webm', '.mkv'];
    const fileExtension = path_1.default.extname(file.originalname).toLowerCase();
    if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
        cb(null, true);
    }
    else {
        cb(new Error('Tipo de archivo no soportado. Usa: MP4, MOV, AVI, WMV, WebM, MKV'));
    }
};
const upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: (parseInt(process.env.UPLOAD_MAX_SIZE || '100') * 1024 * 1024),
        files: 1
    }
});
router.post('/background', upload.single('video'), async (req, res) => {
    const requestId = (0, uuid_1.v4)();
    const startTime = Date.now();
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No se proporcionó ningún archivo'
            });
        }
        logger.info(`[${requestId}] Nuevo archivo subido:`, {
            originalName: req.file.originalname,
            filename: req.file.filename,
            size: req.file.size,
            mimetype: req.file.mimetype,
            ip: req.ip
        });
        const inputPath = req.file.path;
        const fileStats = await promises_1.default.stat(inputPath);
        const fileSizeMB = (fileStats.size / (1024 * 1024)).toFixed(2);
        logger.info(`[${requestId}] Analizando video...`);
        const videoInfo = await (0, ffmpeg_1.getVideoInfo)(inputPath);
        if (videoInfo.duration > 300) {
            await promises_1.default.unlink(inputPath);
            return res.status(400).json({
                success: false,
                error: 'El video no puede durar más de 5 minutos'
            });
        }
        if (videoInfo.width < 720 || videoInfo.height < 480) {
            await promises_1.default.unlink(inputPath);
            return res.status(400).json({
                success: false,
                error: 'La resolución mínima es 720x480'
            });
        }
        logger.info(`[${requestId}] Optimizando video...`);
        const optimizedPath = await (0, ffmpeg_1.optimizeBackgroundVideo)(inputPath, requestId);
        const optimizedStats = await promises_1.default.stat(optimizedPath);
        const optimizedSizeMB = (optimizedStats.size / (1024 * 1024)).toFixed(2);
        await promises_1.default.unlink(inputPath);
        const processingTime = Date.now() - startTime;
        logger.info(`[${requestId}] Video procesado exitosamente en ${processingTime}ms`, {
            originalSize: `${fileSizeMB}MB`,
            optimizedSize: `${optimizedSizeMB}MB`,
            outputPath: optimizedPath
        });
        res.json({
            success: true,
            videoPath: optimizedPath,
            fileName: path_1.default.basename(optimizedPath),
            fileSize: `${optimizedSizeMB}MB`,
            duration: Math.round(videoInfo.duration),
            resolution: `${videoInfo.width}x${videoInfo.height}`,
            message: 'Video subido y optimizado exitosamente'
        });
    }
    catch (error) {
        const processingTime = Date.now() - startTime;
        if (req.file?.path) {
            try {
                await promises_1.default.unlink(req.file.path);
            }
            catch (cleanupError) {
                logger.warn(`Error limpiando archivo: ${cleanupError}`);
            }
        }
        logger.error(`[${requestId}] Error procesando video después de ${processingTime}ms:`, {
            error: error.message,
            stack: error.stack
        });
        let statusCode = 500;
        let errorMessage = 'Error procesando video';
        if (error.message.includes('Invalid video')) {
            statusCode = 400;
            errorMessage = 'Archivo de video inválido o corrupto';
        }
        else if (error.message.includes('duration')) {
            statusCode = 400;
            errorMessage = 'Video demasiado largo';
        }
        else if (error.message.includes('resolution')) {
            statusCode = 400;
            errorMessage = 'Resolución de video no soportada';
        }
        res.status(statusCode).json({
            success: false,
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
router.post('/avatar', (0, multer_1.default)({
    storage: multer_1.default.diskStorage({
        destination: 'uploads/avatars/',
        filename: (req, file, cb) => {
            const uniqueName = `avatar-${(0, uuid_1.v4)()}${path_1.default.extname(file.originalname)}`;
            cb(null, uniqueName);
        }
    }),
    fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Solo se permiten imágenes JPG, PNG o WebP'));
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1
    }
}).single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No se proporcionó ninguna imagen'
            });
        }
        await promises_1.default.mkdir('uploads/avatars', { recursive: true });
        const avatarUrl = `${process.env.PUBLIC_URL}/uploads/avatars/${req.file.filename}`;
        logger.info('Avatar subido:', {
            filename: req.file.filename,
            size: req.file.size,
            ip: req.ip
        });
        res.json({
            success: true,
            avatarUrl,
            fileName: req.file.filename,
            fileSize: `${(req.file.size / 1024).toFixed(1)}KB`
        });
    }
    catch (error) {
        logger.error('Error subiendo avatar:', error);
        res.status(500).json({
            success: false,
            error: 'Error subiendo avatar',
            details: error.message
        });
    }
});
router.get('/backgrounds', async (req, res) => {
    try {
        const customVideosDir = 'videos/custom';
        await promises_1.default.mkdir(customVideosDir, { recursive: true });
        const files = await promises_1.default.readdir(customVideosDir);
        const videoFiles = files.filter(file => file.match(/\.(mp4|mov|avi|mkv|webm)$/i));
        const videos = await Promise.all(videoFiles.map(async (file) => {
            const filePath = path_1.default.join(customVideosDir, file);
            const stats = await promises_1.default.stat(filePath);
            try {
                const videoInfo = await (0, ffmpeg_1.getVideoInfo)(filePath);
                return {
                    name: file,
                    url: `${process.env.PUBLIC_URL}/videos/custom/${file}`,
                    size: `${(stats.size / (1024 * 1024)).toFixed(2)}MB`,
                    duration: Math.round(videoInfo.duration),
                    resolution: `${videoInfo.width}x${videoInfo.height}`,
                    uploadDate: stats.birthtime.toISOString()
                };
            }
            catch (error) {
                return {
                    name: file,
                    url: `${process.env.PUBLIC_URL}/videos/custom/${file}`,
                    size: `${(stats.size / (1024 * 1024)).toFixed(2)}MB`,
                    uploadDate: stats.birthtime.toISOString(),
                    error: 'No se pudo obtener información del video'
                };
            }
        }));
        res.json({
            success: true,
            videos,
            total: videos.length
        });
    }
    catch (error) {
        logger.error('Error listando videos:', error);
        res.status(500).json({
            success: false,
            error: 'Error listando videos de fondo'
        });
    }
});
router.delete('/background/:filename', async (req, res) => {
    const { filename } = req.params;
    try {
        if (!filename.match(/^[a-zA-Z0-9_-]+\.(mp4|mov|avi|mkv|webm)$/)) {
            return res.status(400).json({
                success: false,
                error: 'Nombre de archivo inválido'
            });
        }
        const filePath = path_1.default.join('videos/custom', filename);
        try {
            await promises_1.default.access(filePath);
        }
        catch (error) {
            return res.status(404).json({
                success: false,
                error: 'Video no encontrado'
            });
        }
        await promises_1.default.unlink(filePath);
        logger.info(`Video de fondo eliminado: ${filename}`, { ip: req.ip });
        res.json({
            success: true,
            message: 'Video eliminado exitosamente'
        });
    }
    catch (error) {
        logger.error('Error eliminando video:', error);
        res.status(500).json({
            success: false,
            error: 'Error eliminando video'
        });
    }
});
router.get('/stats', async (req, res) => {
    try {
        const customVideosDir = 'videos/custom';
        const uploadsDir = 'uploads';
        const customFiles = await promises_1.default.readdir(customVideosDir).catch(() => []);
        const uploadFiles = await promises_1.default.readdir(uploadsDir).catch(() => []);
        let totalSize = 0;
        let videoCount = 0;
        for (const file of customFiles) {
            if (file.match(/\.(mp4|mov|avi|mkv|webm)$/i)) {
                const stats = await promises_1.default.stat(path_1.default.join(customVideosDir, file));
                totalSize += stats.size;
                videoCount++;
            }
        }
        let tempFiles = 0;
        for (const file of uploadFiles) {
            if (file.match(/\.(mp4|mov|avi|mkv|webm)$/i)) {
                tempFiles++;
            }
        }
        res.json({
            success: true,
            stats: {
                customVideos: videoCount,
                tempFiles,
                totalStorageUsed: `${(totalSize / (1024 * 1024)).toFixed(2)}MB`,
                maxUploadSize: `${process.env.UPLOAD_MAX_SIZE || 100}MB`
            }
        });
    }
    catch (error) {
        logger.error('Error obteniendo estadísticas:', error);
        res.status(500).json({
            success: false,
            error: 'Error obteniendo estadísticas'
        });
    }
});
router.get('/guidelines', (req, res) => {
    const guidelines = {
        video: {
            formats: ['MP4', 'MOV', 'AVI', 'WMV', 'WebM', 'MKV'],
            maxSize: `${process.env.UPLOAD_MAX_SIZE || 100}MB`,
            maxDuration: '5 minutos',
            minResolution: '720x480',
            recommendedResolution: '1920x1080',
            aspectRatio: 'Cualquiera (se ajustará automáticamente)',
            codec: 'H.264 recomendado para mejor compatibilidad'
        },
        avatar: {
            formats: ['JPG', 'PNG', 'WebP'],
            maxSize: '5MB',
            recommendedSize: '400x400',
            aspectRatio: 'Cuadrado (1:1) recomendado',
            notes: 'Se recortará automáticamente en círculo'
        },
        optimization: {
            description: 'Los videos se optimizan automáticamente para uso como fondo',
            processes: [
                'Conversión a MP4 H.264',
                'Ajuste de resolución a 1080p máximo',
                'Optimización de bitrate',
                'Eliminación de audio',
                'Compresión inteligente'
            ]
        },
        tips: [
            'Videos con movimiento sutil funcionan mejor como fondos',
            'Evita videos con texto o elementos importantes en el centro',
            'Los loops de 10-30 segundos son ideales',
            'Considera la paleta de colores para que contraste con el texto',
            'Videos en formato horizontal funcionan mejor para posts sociales'
        ]
    };
    res.json({
        success: true,
        guidelines
    });
});
router.get('/avatars', async (req, res) => {
    console.log('[GET /api/upload/avatars] Request recibida de', req.ip);
    try {
        const avatarsDir = 'uploads/avatars';
        await promises_1.default.mkdir(avatarsDir, { recursive: true });
        const files = await promises_1.default.readdir(avatarsDir);
        console.log('[GET /api/upload/avatars] Archivos encontrados:', files);
        const avatarFiles = files.filter(file => file.match(/\.(jpg|jpeg|png|webp)$/i));
        const avatars = await Promise.all(avatarFiles.map(async (file) => {
            const filePath = path_1.default.join(avatarsDir, file);
            const stats = await promises_1.default.stat(filePath);
            return {
                name: file,
                url: `/uploads/avatars/${file}`,
                size: `${(stats.size / 1024).toFixed(1)}KB`
            };
        }));
        console.log('[GET /api/upload/avatars] Avatares listos para enviar:', avatars);
        res.json({ success: true, avatars, total: avatars.length });
    }
    catch (error) {
        console.error('[GET /api/upload/avatars] Error:', error);
        res.status(500).json({ success: false, error: 'Error listando avatares', details: error.message });
    }
});
router.use((error, req, res, next) => {
    if (error instanceof multer_1.default.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: `Archivo demasiado grande. Máximo: ${process.env.UPLOAD_MAX_SIZE || 100}MB`
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                error: 'Solo se permite un archivo a la vez'
            });
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                error: 'Campo de archivo inesperado'
            });
        }
    }
    logger.error('Error en upload:', error);
    res.status(500).json({
        success: false,
        error: error.message || 'Error procesando archivo'
    });
});
exports.default = router;
//# sourceMappingURL=upload.js.map