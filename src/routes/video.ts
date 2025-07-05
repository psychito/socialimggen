// src/routes/video.ts - Rutas para generación de videos
import { Router, Request, Response } from 'express'
import winston from 'winston'
import { v4 as uuidv4 } from 'uuid'
import { 
  TweetData, 
  VideoOptions, 
  GenerationResponse, 
  DEFAULT_VIDEO_OPTIONS,
  isValidTweetData,
  isValidVideoOptions
} from '../types'
import { generateVideo } from '../services/videoGenerator'
import { selectBackgroundVideo } from '../services/backgroundSelector'
import fs from 'fs/promises'
import path from 'path'

const router = Router()
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/video.log' })
  ]
})

// Validación de entrada
function validateVideoRequest(req: Request): { isValid: boolean; errors: string[] } {
  const { tweetData, options } = req.body
  const errors: string[] = []

  // Validar tweetData
  if (!tweetData) {
    errors.push('tweetData es requerido')
  } else if (!isValidTweetData(tweetData)) {
    if (!tweetData.username) errors.push('username es requerido')
    if (!tweetData.displayName) errors.push('displayName es requerido')
    if (!tweetData.text) errors.push('text es requerido')
    if (typeof tweetData.likes !== 'number') errors.push('likes debe ser un número')
    if (typeof tweetData.retweets !== 'number') errors.push('retweets debe ser un número')
    if (typeof tweetData.replies !== 'number') errors.push('replies debe ser un número')
    if (!tweetData.timestamp) errors.push('timestamp es requerido')
  }

  // Validaciones adicionales para tweetData
  if (tweetData) {
    if (tweetData.text && tweetData.text.length > 280) {
      errors.push('El texto no puede exceder 280 caracteres')
    }
    if (tweetData.username && !tweetData.username.startsWith('@')) {
      // Auto-corregir agregando @
      tweetData.username = '@' + tweetData.username
    }
    if (tweetData.likes < 0 || tweetData.retweets < 0 || tweetData.replies < 0) {
      errors.push('Los números de likes, retweets y replies deben ser positivos')
    }
  }

  // Validar options (opcional, usar defaults si no se proporciona)
  if (options && !isValidVideoOptions(options)) {
    if (options.duration && (options.duration < 5 || options.duration > 60)) {
      errors.push('La duración debe estar entre 5 y 60 segundos')
    }
    if (options.fps && ![24, 30, 60].includes(options.fps)) {
      errors.push('FPS debe ser 24, 30 o 60')
    }
    if (options.width && (options.width < 480 || options.width > 4096)) {
      errors.push('El ancho debe estar entre 480 y 4096 píxeles')
    }
    if (options.height && (options.height < 480 || options.height > 4096)) {
      errors.push('La altura debe estar entre 480 y 4096 píxeles')
    }
    if (options.style && !['glassmorphism', 'solid', 'gradient'].includes(options.style)) {
      errors.push('El estilo debe ser glassmorphism, solid o gradient')
    }
    if (options.animation && !['fade', 'slide', 'zoom', 'none'].includes(options.animation)) {
      errors.push('La animación debe ser fade, slide, zoom o none')
    }
  }

  return { isValid: errors.length === 0, errors }
}

// POST /api/video/generate - Generar video social
router.post('/generate', async (req: Request, res: Response<GenerationResponse>) => {
  const requestId = uuidv4()
  const startTime = Date.now()

  try {
    logger.info(`[${requestId}] Nueva solicitud de generación de video`, {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    })

    // Validar entrada
    const validation = validateVideoRequest(req)
    if (!validation.isValid) {
      logger.warn(`[${requestId}] Validación fallida:`, validation.errors)
      return res.status(400).json({
        success: false,
        error: 'Datos de entrada inválidos',
        details: validation.errors.join(', ')
      })
    }

    const tweetData: TweetData = req.body.tweetData
    let options = req.body.options || {}

    // Si se especifica aspectRatio, calcular width y height antes de mezclar con defaults
    if (options.aspectRatio) {
      const [w, h] = options.aspectRatio.split(':').map(Number)
      if (w > 0 && h > 0) {
        if (options.height && !options.width) {
          options.width = Math.round(options.height * (w / h))
        } else {
          options.height = Math.round((options.width || DEFAULT_VIDEO_OPTIONS.width) * (h / w))
        }
      }
    }

    options = { ...DEFAULT_VIDEO_OPTIONS, ...options }

    logger.info(`[${requestId}] Parámetros validados:`, {
      username: tweetData.username,
      textLength: tweetData.text.length,
      duration: options.duration,
      style: options.style
    })

    // Seleccionar video de fondo si no se especifica
    if (!options.backgroundVideo) {
      options.backgroundVideo = selectBackgroundVideo(tweetData.text)
      logger.info(`[${requestId}] Video de fondo seleccionado: ${options.backgroundVideo}`)
    }

    // Resolver ruta absoluta del avatar si es relativa
    if (tweetData.avatar && tweetData.avatar.startsWith('/uploads/')) {
      const path = require('path');
      tweetData.avatar = path.join(process.cwd(), tweetData.avatar.replace(/^\//, ''));
    }

    // Generar el video
    logger.info(`[${requestId}] Iniciando generación de video...`)
    const result = await generateVideo(tweetData, options, requestId)

    const processingTime = Date.now() - startTime
    
    logger.info(`[${requestId}] Video generado exitosamente en ${processingTime}ms`, {
      outputPath: result.videoUrl,
      fileSize: result.size
    })

    res.json({
      success: true,
      videoUrl: result.videoUrl,
      duration: options.duration,
      size: result.size,
      format: 'mp4'
    })

  } catch (error: any) {
    const processingTime = Date.now() - startTime
    
    logger.error(`[${requestId}] Error generando video después de ${processingTime}ms:`, {
      error: error.message,
      stack: error.stack
    })

    // Determinar código de error apropiado
    let statusCode = 500
    let errorMessage = 'Error interno generando video'

    if (error.message.includes('ENOENT')) {
      statusCode = 404
      errorMessage = 'Video de fondo no encontrado'
    } else if (error.message.includes('ENOMEM')) {
      statusCode = 507
      errorMessage = 'Memoria insuficiente para procesar el video'
    } else if (error.message.includes('timeout')) {
      statusCode = 408
      errorMessage = 'Tiempo de procesamiento excedido'
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// GET /api/video/presets - Obtener presets predefinidos
router.get('/presets', (req: Request, res: Response) => {
  const presets = [
    {
      name: 'Tech Announcement',
      description: 'Perfecto para anuncios de tecnología y startups',
      options: {
        ...DEFAULT_VIDEO_OPTIONS,
        style: 'glassmorphism',
        animation: 'slide',
        duration: 8
      },
      backgroundCategory: 'tech'
    },
    {
      name: 'Motivational Quote',
      description: 'Para citas inspiracionales y motivacionales',
      options: {
        ...DEFAULT_VIDEO_OPTIONS,
        style: 'gradient',
        animation: 'fade',
        duration: 12
      },
      backgroundCategory: 'nature'
    },
    {
      name: 'Business Update',
      description: 'Para actualizaciones corporativas y de negocios',
      options: {
        ...DEFAULT_VIDEO_OPTIONS,
        style: 'solid',
        animation: 'zoom',
        duration: 10
      },
      backgroundCategory: 'business'
    },
    {
      name: 'Creative Content',
      description: 'Para contenido creativo y artístico',
      options: {
        ...DEFAULT_VIDEO_OPTIONS,
        style: 'glassmorphism',
        animation: 'slide',
        duration: 15,
        fps: 60
      },
      backgroundCategory: 'abstract'
    },
    {
      name: 'Urban Lifestyle',
      description: 'Para contenido de estilo de vida urbano',
      options: {
        ...DEFAULT_VIDEO_OPTIONS,
        style: 'glassmorphism',
        animation: 'fade',
        duration: 10
      },
      backgroundCategory: 'urban'
    }
  ]

  res.json({
    success: true,
    presets,
    total: presets.length
  })
})

// GET /api/video/formats - Obtener formatos soportados
router.get('/formats', (req: Request, res: Response) => {
  const formats = {
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
  }

  res.json({
    success: true,
    formats,
    recommendations: {
      social: 'mp4 con h264, 30fps, calidad medium',
      professional: 'mp4 con h265, 60fps, calidad high',
      web: 'webm con vp9, 30fps, calidad medium'
    }
  })
})

// GET /api/video/status/:requestId - Obtener estado de procesamiento (para implementación futura)
router.get('/status/:requestId', (req: Request, res: Response) => {
  const { requestId } = req.params
  
  // Por ahora retornamos un estado simulado
  // En el futuro esto se conectaría con un sistema de colas
  res.json({
    success: true,
    requestId,
    status: 'completed',
    progress: 100,
    message: 'Video generado exitosamente',
    estimatedTimeRemaining: 0
  })
})

// DELETE /api/video/:filename - Eliminar video generado
router.delete('/:filename', async (req: Request, res: Response) => {
  const { filename } = req.params

  try {
    // Validar que el archivo existe y es seguro eliminar
    if (!filename.match(/^[a-zA-Z0-9_-]+\.(mp4|webm|mov)$/)) {
      return res.status(400).json({
        success: false,
        error: 'Nombre de archivo inválido'
      })
    }

    const fs = require('fs/promises')
    const path = require('path')
    const filePath = path.join('output', filename)

    await fs.unlink(filePath)
    
    logger.info(`Archivo eliminado: ${filename}`, { ip: req.ip })

    res.json({
      success: true,
      message: 'Archivo eliminado exitosamente'
    })

  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({
        success: false,
        error: 'Archivo no encontrado'
      })
    }

    logger.error('Error eliminando archivo:', error)
    res.status(500).json({
      success: false,
      error: 'Error eliminando archivo'
    })
  }
})

// Middleware de manejo de errores específico para video
router.use((error: Error, req: Request, res: Response, next: any) => {
  logger.error('Error en ruta de video:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method
  })

  if (error.name === 'FFmpegError') {
    return res.status(500).json({
      success: false,
      error: 'Error de procesamiento de video',
      details: 'Problema con la codificación de video'
    })
  }

  if (error.name === 'CanvasError') {
    return res.status(500).json({
      success: false,
      error: 'Error de generación de overlay',
      details: 'Problema creando el overlay glassmorphism'
    })
  }

  next(error)
})

// POST /api/video - Alias para /api/video/generate (permite body plano)
router.post('/', async (req: Request, res: Response) => {
  const requestId = uuidv4()
  const startTime = Date.now()

  // Permitir body plano (sin tweetData/options)
  let tweetData = req.body.tweetData;
  let options = req.body.options;

  // Si el body es plano, mapear a la estructura esperada
  if (!tweetData) {
    tweetData = {
      username: req.body.username,
      displayName: req.body.name || req.body.displayName || req.body.username,
      text: req.body.text,
      avatar: req.body.avatarUrl || req.body.avatar,
      likes: req.body.likes,
      retweets: req.body.retweets,
      replies: req.body.comments || req.body.replies,
      timestamp: req.body.date || req.body.timestamp,
      verified: req.body.verified,
      theme: req.body.theme
    };
    options = {
      backgroundVideo: req.body.backgroundVideo,
      ...req.body.options // permite override
    };
  }

  try {
    logger.info(`[${requestId}] Nueva solicitud de generación de video (body plano)`, {
      ip: req.ip,
      userAgent: req.headers['user-agent']
    })

    // Validar entrada
    const validation = validateVideoRequest({ body: { tweetData, options } } as Request)
    if (!validation.isValid) {
      logger.warn(`[${requestId}] Validación fallida:`, validation.errors)
      return res.status(400).json({
        success: false,
        error: 'Datos de entrada inválidos',
        details: validation.errors.join(', ')
      })
    }

    // Si se especifica aspectRatio, calcular width y height antes de mezclar con defaults
    if (options.aspectRatio) {
      const [w, h] = options.aspectRatio.split(':').map(Number)
      if (w > 0 && h > 0) {
        if (options.height && !options.width) {
          options.width = Math.round(options.height * (w / h))
        } else {
          options.height = Math.round((options.width || DEFAULT_VIDEO_OPTIONS.width) * (h / w))
        }
      }
    }
    options = { ...DEFAULT_VIDEO_OPTIONS, ...options }

    logger.info(`[${requestId}] Parámetros validados:`, {
      username: tweetData.username,
      textLength: tweetData.text.length,
      duration: options.duration,
      style: options.style
    })

    // Seleccionar video de fondo si no se especifica
    if (!options.backgroundVideo) {
      options.backgroundVideo = selectBackgroundVideo(tweetData.text)
      logger.info(`[${requestId}] Video de fondo seleccionado: ${options.backgroundVideo}`)
    }

    // Resolver ruta absoluta del avatar si es relativa
    if (tweetData.avatar && tweetData.avatar.startsWith('/uploads/')) {
      const path = require('path');
      tweetData.avatar = path.join(process.cwd(), tweetData.avatar.replace(/^\//, ''));
    }

    // Generar el video
    logger.info(`[${requestId}] Iniciando generación de video...`)
    const result = await generateVideo(tweetData, options, requestId)

    const processingTime = Date.now() - startTime
    logger.info(`[${requestId}] Video generado exitosamente en ${processingTime}ms`, {
      outputPath: result.videoUrl,
      fileSize: result.size
    })

    res.json({
      success: true,
      videoUrl: result.videoUrl,
      duration: options.duration,
      size: result.size,
      format: 'mp4'
    })
  } catch (error: any) {
    const processingTime = Date.now() - startTime
    logger.error(`[${requestId}] Error generando video después de ${processingTime}ms:`, {
      error: error.message,
      stack: error.stack
    })
    // Determinar código de error apropiado
    let statusCode = 500
    let errorMessage = 'Error interno generando video'
    if (error.message.includes('ENOENT')) {
      statusCode = 404
      errorMessage = 'Video de fondo no encontrado'
    } else if (error.message.includes('ENOMEM')) {
      statusCode = 507
      errorMessage = 'Memoria insuficiente para procesar el video'
    } else if (error.message.includes('timeout')) {
      statusCode = 408
      errorMessage = 'Tiempo de procesamiento excedido'
    }
    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
});

// GET /api/video/list - Listar videos disponibles en todas las categorías
router.get('/list', async (req: Request, res: Response) => {
  console.log('🎬 VIDEO LIST ENDPOINT HIT!')
  logger.info('🎬 Video list endpoint accessed')
  try {
    const categories = ['nature', 'urban', 'tech', 'abstract', 'business', 'custom']
    let videos: any[] = []
    for (const category of categories) {
      const dir = `videos/${category}`
      await fs.mkdir(dir, { recursive: true })
      const files = await fs.readdir(dir)
      const videoFiles = files.filter(file => file.match(/\.(mp4|mov|avi|mkv|webm)$/i))
      for (const file of videoFiles) {
        const filePath = path.join(dir, file)
        const stats = await fs.stat(filePath)
        videos.push({
          name: file,
          url: `/videos/${category}/${file}`,
          category,
          size: `${(stats.size / (1024 * 1024)).toFixed(2)}MB`
        })
      }
    }
    res.json({ success: true, videos, total: videos.length })
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Error listando videos', details: error.message })
  }
})

export default router