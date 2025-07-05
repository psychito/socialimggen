// src/routes/upload.ts - Rutas para subida de archivos
import { Router, Request, Response } from 'express'
import multer from 'multer'
import winston from 'winston'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import fs from 'fs/promises'
import { UploadResponse } from '../types'
import { optimizeBackgroundVideo, getVideoInfo } from '../utils/ffmpeg'

const router = Router()
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/upload.log' })
  ]
})

// Configuración de multer para subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`
    cb(null, uniqueName)
  }
})

// Filtro para validar tipos de archivo
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-ms-wmv',
    'video/webm',
    'video/x-matroska'
  ]

  const allowedExtensions = ['.mp4', '.mov', '.avi', '.wmv', '.webm', '.mkv']
  const fileExtension = path.extname(file.originalname).toLowerCase()

  if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
    cb(null, true)
  } else {
    cb(new Error('Tipo de archivo no soportado. Usa: MP4, MOV, AVI, WMV, WebM, MKV'))
  }
}

// Configurar multer con límites
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: (parseInt(process.env.UPLOAD_MAX_SIZE || '100') * 1024 * 1024), // MB a bytes
    files: 1
  }
})

// POST /api/upload/background - Subir video de fondo personalizado
router.post('/background', upload.single('video'), async (req: Request, res: Response<UploadResponse>) => {
  const requestId = uuidv4()
  const startTime = Date.now()

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No se proporcionó ningún archivo'
      })
    }

    logger.info(`[${requestId}] Nuevo archivo subido:`, {
      originalName: req.file.originalname,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
      ip: req.ip
    })

    const inputPath = req.file.path
    const fileStats = await fs.stat(inputPath)
    const fileSizeMB = (fileStats.size / (1024 * 1024)).toFixed(2)

    // Obtener información del video
    logger.info(`[${requestId}] Analizando video...`)
    const videoInfo = await getVideoInfo(inputPath)
    
    // Validar duración del video
    if (videoInfo.duration > 300) { // 5 minutos máximo
      await fs.unlink(inputPath) // Limpiar archivo
      return res.status(400).json({
        success: false,
        error: 'El video no puede durar más de 5 minutos'
      })
    }

    // Validar resolución mínima
    if (videoInfo.width < 720 || videoInfo.height < 480) {
      await fs.unlink(inputPath) // Limpiar archivo
      return res.status(400).json({
        success: false,
        error: 'La resolución mínima es 720x480'
      })
    }

    // Optimizar el video para uso como fondo
    logger.info(`[${requestId}] Optimizando video...`)
    const optimizedPath = await optimizeBackgroundVideo(inputPath, requestId)

    // Obtener información del video optimizado
    const optimizedStats = await fs.stat(optimizedPath)
    const optimizedSizeMB = (optimizedStats.size / (1024 * 1024)).toFixed(2)

    // Limpiar archivo original
    await fs.unlink(inputPath)

    const processingTime = Date.now() - startTime

    logger.info(`[${requestId}] Video procesado exitosamente en ${processingTime}ms`, {
      originalSize: `${fileSizeMB}MB`,
      optimizedSize: `${optimizedSizeMB}MB`,
      outputPath: optimizedPath
    })

    res.json({
      success: true,
      videoPath: optimizedPath,
      fileName: path.basename(optimizedPath),
      fileSize: `${optimizedSizeMB}MB`,
      duration: Math.round(videoInfo.duration),
      resolution: `${videoInfo.width}x${videoInfo.height}`,
      message: 'Video subido y optimizado exitosamente'
    })

  } catch (error: any) {
    const processingTime = Date.now() - startTime

    // Limpiar archivo en caso de error
    if (req.file?.path) {
      try {
        await fs.unlink(req.file.path)
      } catch (cleanupError) {
        logger.warn(`Error limpiando archivo: ${cleanupError}`)
      }
    }

    logger.error(`[${requestId}] Error procesando video después de ${processingTime}ms:`, {
      error: error.message,
      stack: error.stack
    })

    let statusCode = 500
    let errorMessage = 'Error procesando video'

    if (error.message.includes('Invalid video')) {
      statusCode = 400
      errorMessage = 'Archivo de video inválido o corrupto'
    } else if (error.message.includes('duration')) {
      statusCode = 400
      errorMessage = 'Video demasiado largo'
    } else if (error.message.includes('resolution')) {
      statusCode = 400
      errorMessage = 'Resolución de video no soportada'
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// POST /api/upload/avatar - Subir imagen de avatar
router.post('/avatar', 
  multer({
    storage: multer.diskStorage({
      destination: 'uploads/avatars/',
      filename: (req, file, cb) => {
        const uniqueName = `avatar-${uuidv4()}${path.extname(file.originalname)}`
        cb(null, uniqueName)
      }
    }),
    fileFilter: (req, file, cb) => {
      const allowedMimes = ['image/jpeg', 'image/png', 'image/webp']
      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true)
      } else {
        cb(new Error('Solo se permiten imágenes JPG, PNG o WebP'))
      }
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
      files: 1
    }
  }).single('avatar'), 
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No se proporcionó ninguna imagen'
        })
      }

      // Crear directorio si no existe
      await fs.mkdir('uploads/avatars', { recursive: true })

      const avatarUrl = `${process.env.PUBLIC_URL}/uploads/avatars/${req.file.filename}`

      logger.info('Avatar subido:', {
        filename: req.file.filename,
        size: req.file.size,
        ip: req.ip
      })

      res.json({
        success: true,
        avatarUrl,
        fileName: req.file.filename,
        fileSize: `${(req.file.size / 1024).toFixed(1)}KB`
      })

    } catch (error: any) {
      logger.error('Error subiendo avatar:', error)
      res.status(500).json({
        success: false,
        error: 'Error subiendo avatar',
        details: error.message
      })
    }
  }
)

// GET /api/upload/backgrounds - Listar videos de fondo subidos
router.get('/backgrounds', async (req: Request, res: Response) => {
  try {
    const customVideosDir = 'videos/custom'
    
    // Asegurar que existe el directorio
    await fs.mkdir(customVideosDir, { recursive: true })
    
    const files = await fs.readdir(customVideosDir)
    const videoFiles = files.filter(file => 
      file.match(/\.(mp4|mov|avi|mkv|webm)$/i)
    )

    const videos = await Promise.all(
      videoFiles.map(async (file) => {
        const filePath = path.join(customVideosDir, file)
        const stats = await fs.stat(filePath)
        
        try {
          const videoInfo = await getVideoInfo(filePath)
          return {
            name: file,
            url: `${process.env.PUBLIC_URL}/videos/custom/${file}`,
            size: `${(stats.size / (1024 * 1024)).toFixed(2)}MB`,
            duration: Math.round(videoInfo.duration),
            resolution: `${videoInfo.width}x${videoInfo.height}`,
            uploadDate: stats.birthtime.toISOString()
          }
        } catch (error) {
          return {
            name: file,
            url: `${process.env.PUBLIC_URL}/videos/custom/${file}`,
            size: `${(stats.size / (1024 * 1024)).toFixed(2)}MB`,
            uploadDate: stats.birthtime.toISOString(),
            error: 'No se pudo obtener información del video'
          }
        }
      })
    )

    res.json({
      success: true,
      videos,
      total: videos.length
    })

  } catch (error: any) {
    logger.error('Error listando videos:', error)
    res.status(500).json({
      success: false,
      error: 'Error listando videos de fondo'
    })
  }
})

// DELETE /api/upload/background/:filename - Eliminar video de fondo
router.delete('/background/:filename', async (req: Request, res: Response) => {
  const { filename } = req.params

  try {
    // Validar nombre de archivo
    if (!filename.match(/^[a-zA-Z0-9_-]+\.(mp4|mov|avi|mkv|webm)$/)) {
      return res.status(400).json({
        success: false,
        error: 'Nombre de archivo inválido'
      })
    }

    const filePath = path.join('videos/custom', filename)
    
    // Verificar que el archivo existe
    try {
      await fs.access(filePath)
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: 'Video no encontrado'
      })
    }

    await fs.unlink(filePath)
    
    logger.info(`Video de fondo eliminado: ${filename}`, { ip: req.ip })

    res.json({
      success: true,
      message: 'Video eliminado exitosamente'
    })

  } catch (error: any) {
    logger.error('Error eliminando video:', error)
    res.status(500).json({
      success: false,
      error: 'Error eliminando video'
    })
  }
})

// GET /api/upload/stats - Estadísticas de subidas
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const customVideosDir = 'videos/custom'
    const uploadsDir = 'uploads'

    // Contar archivos y calcular tamaños
    const customFiles = await fs.readdir(customVideosDir).catch(() => [])
    const uploadFiles = await fs.readdir(uploadsDir).catch(() => [])

    let totalSize = 0
    let videoCount = 0

    // Calcular estadísticas de videos custom
    for (const file of customFiles) {
      if (file.match(/\.(mp4|mov|avi|mkv|webm)$/i)) {
        const stats = await fs.stat(path.join(customVideosDir, file))
        totalSize += stats.size
        videoCount++
      }
    }

    // Calcular estadísticas de uploads temporales
    let tempFiles = 0
    for (const file of uploadFiles) {
      if (file.match(/\.(mp4|mov|avi|mkv|webm)$/i)) {
        tempFiles++
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
    })

  } catch (error: any) {
    logger.error('Error obteniendo estadísticas:', error)
    res.status(500).json({
      success: false,
      error: 'Error obteniendo estadísticas'
    })
  }
})

// GET /api/upload/guidelines - Guías de subida
router.get('/guidelines', (req: Request, res: Response) => {
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
  }

  res.json({
    success: true,
    guidelines
  })
})

// GET /api/upload/avatars - Listar avatares disponibles
router.get('/avatars', async (req: Request, res: Response) => {
  console.log('[GET /api/upload/avatars] Request recibida de', req.ip);
  try {
    const avatarsDir = 'uploads/avatars'
    await fs.mkdir(avatarsDir, { recursive: true })
    const files = await fs.readdir(avatarsDir)
    console.log('[GET /api/upload/avatars] Archivos encontrados:', files);
    const avatarFiles = files.filter(file => file.match(/\.(jpg|jpeg|png|webp)$/i))
    const avatars = await Promise.all(
      avatarFiles.map(async (file) => {
        const filePath = path.join(avatarsDir, file)
        const stats = await fs.stat(filePath)
        return {
          name: file,
          url: `/uploads/avatars/${file}`,
          size: `${(stats.size / 1024).toFixed(1)}KB`
        }
      })
    )
    console.log('[GET /api/upload/avatars] Avatares listos para enviar:', avatars);
    res.json({ success: true, avatars, total: avatars.length })
  } catch (error: any) {
    console.error('[GET /api/upload/avatars] Error:', error);
    res.status(500).json({ success: false, error: 'Error listando avatares', details: error.message })
  }
})

// Middleware de manejo de errores para multer
router.use((error: Error, req: Request, res: Response, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: `Archivo demasiado grande. Máximo: ${process.env.UPLOAD_MAX_SIZE || 100}MB`
      })
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Solo se permite un archivo a la vez'
      })
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: 'Campo de archivo inesperado'
      })
    }
  }

  logger.error('Error en upload:', error)
  res.status(500).json({
    success: false,
    error: error.message || 'Error procesando archivo'
  })
})

export default router