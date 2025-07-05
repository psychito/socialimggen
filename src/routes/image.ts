// src/routes/image.ts - Rutas para generación de imágenes
import { Router, Request, Response } from 'express'
import winston from 'winston'
import { v4 as uuidv4 } from 'uuid'
import { 
  TweetData, 
  ImageOptions, 
  GenerationResponse, 
  DEFAULT_IMAGE_OPTIONS,
  isValidTweetData
} from '../types'
import { generateSocialImage } from '../services/imageGenerator'

const router = Router()
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/image.log' })
  ]
})

// Validación de entrada para imágenes
function validateImageRequest(req: Request): { isValid: boolean; errors: string[] } {
  const { tweetData, options } = req.body
  const errors: string[] = []

  // Validar tweetData
  if (!tweetData) {
    errors.push('tweetData es requerido')
  } else if (!isValidTweetData(tweetData)) {
    if (!tweetData.username) errors.push('username es requerido')
    if (!tweetData.displayName) errors.push('displayName es requerido')
    if (!tweetData.text) errors.push('text es requerido')
    if (tweetData.likes !== undefined && typeof tweetData.likes !== 'number') errors.push('likes debe ser un número')
    if (tweetData.retweets !== undefined && typeof tweetData.retweets !== 'number') errors.push('retweets debe ser un número')
    if (tweetData.replies !== undefined && typeof tweetData.replies !== 'number') errors.push('replies debe ser un número')
    if (!tweetData.timestamp) errors.push('timestamp es requerido')
  }

  // Validaciones adicionales
  if (tweetData) {
    if (tweetData.text && tweetData.text.length > 280) {
      errors.push('El texto no puede exceder 280 caracteres')
    }
    if (tweetData.username && !tweetData.username.startsWith('@')) {
      tweetData.username = '@' + tweetData.username
    }
  }

  // Validar options de imagen (opcional)
  if (options) {
    if (options.width && (options.width < 200 || options.width > 2048)) {
      errors.push('El ancho debe estar entre 200 y 2048 píxeles')
    }
    if (options.height && (options.height < 200 || options.height > 2048)) {
      errors.push('La altura debe estar entre 200 y 2048 píxeles')
    }
    if (options.format && !['png', 'jpg', 'webp'].includes(options.format)) {
      errors.push('El formato debe ser png, jpg o webp')
    }
    if (options.quality && (options.quality < 10 || options.quality > 100)) {
      errors.push('La calidad debe estar entre 10 y 100')
    }
  }

  return { isValid: errors.length === 0, errors }
}

// POST /api/image/generate - Generar imagen social
router.post('/generate', async (req: Request, res: Response<GenerationResponse>) => {
  const requestId = uuidv4()
  const startTime = Date.now()

  try {
    logger.info(`[${requestId}] Nueva solicitud de generación de imagen`, {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    })

    // Validar entrada
    const validation = validateImageRequest(req)
    if (!validation.isValid) {
      logger.warn(`[${requestId}] Validación fallida:`, validation.errors)
      return res.status(400).json({
        success: false,
        error: 'Datos de entrada inválidos',
        details: validation.errors.join(', ')
      })
    }

    const tweetData: TweetData = req.body.tweetData
    const options: ImageOptions = { ...DEFAULT_IMAGE_OPTIONS, ...req.body.options }

    logger.info(`[${requestId}] Parámetros validados:`, {
      username: tweetData.username,
      textLength: tweetData.text.length,
      format: options.format,
      dimensions: `${options.width}x${options.height}`
    })

    // Generar la imagen
    logger.info(`[${requestId}] Iniciando generación de imagen...`)
    const result = await generateSocialImage(tweetData, options, requestId)

    const processingTime = Date.now() - startTime
    
    logger.info(`[${requestId}] Imagen generada exitosamente en ${processingTime}ms`, {
      outputPath: result.imageUrl
    })

    res.json({
      success: true,
      imageUrl: result.imageUrl,
      format: options.format || 'png'
    })

  } catch (error: any) {
    const processingTime = Date.now() - startTime
    
    logger.error(`[${requestId}] Error generando imagen después de ${processingTime}ms:`, {
      error: error.message,
      stack: error.stack
    })

    let statusCode = 500
    let errorMessage = 'Error interno generando imagen'

    if (error.message.includes('Canvas')) {
      statusCode = 500
      errorMessage = 'Error en el motor de renderizado'
    } else if (error.message.includes('font')) {
      statusCode = 500
      errorMessage = 'Error cargando fuentes'
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// GET /api/image/og - Generar imagen Open Graph (compatible con metadatos)
router.get('/og', async (req: Request, res: Response) => {
  try {
    const { 
      username = '@usuario',
      name = 'Usuario',
      text = 'Tweet de ejemplo',
      likes = '0',
      retweets = '0',
      replies = '0',
      verified = 'false',
      theme = 'dark'
    } = req.query

    // Construir tweetData desde query parameters
    const tweetData: TweetData = {
      username: username as string,
      displayName: name as string,
      text: text as string,
      likes: parseInt(likes as string) || 0,
      retweets: parseInt(retweets as string) || 0,
      replies: parseInt(replies as string) || 0,
      timestamp: '2h',
      verified: verified === 'true',
      theme: (theme as 'light' | 'dark') || 'dark'
    }

    const options: ImageOptions = {
      width: 1200,
      height: 630,
      format: 'png',
      quality: 85
    }

    const requestId = uuidv4()
    const result = await generateSocialImage(tweetData, options, requestId)

    // Leer el archivo y enviarlo directamente
    const fs = require('fs')
    const path = require('path')
    const imagePath = path.join('output', path.basename(result.imageUrl || ''))
    
    if (fs.existsSync(imagePath)) {
      res.setHeader('Content-Type', 'image/png')
      res.setHeader('Cache-Control', 'public, max-age=3600') // Cache por 1 hora
      res.sendFile(path.resolve(imagePath))
    } else {
      res.status(404).json({ error: 'Imagen no encontrada' })
    }

  } catch (error: any) {
    logger.error('Error generando imagen OG:', error)
    res.status(500).json({
      error: 'Error generando imagen Open Graph',
      details: error.message
    })
  }
})

// GET /api/image/formats - Obtener formatos soportados
router.get('/formats', (req: Request, res: Response) => {
  const formats = {
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
  }

  res.json({
    success: true,
    formats,
    recommendations: {
      social: 'PNG para mejor calidad de texto',
      web: 'WebP para mejor compresión',
      universal: 'JPG para máxima compatibilidad'
    }
  })
})

// GET /api/image/templates - Obtener plantillas predefinidas
router.get('/templates', (req: Request, res: Response) => {
  const templates = [
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
  ]

  res.json({
    success: true,
    templates,
    total: templates.length
  })
})

// POST /api/image/batch - Generar múltiples imágenes
router.post('/batch', async (req: Request, res: Response) => {
  const requestId = uuidv4()
  const startTime = Date.now()

  try {
    const { tweets, options } = req.body

    if (!Array.isArray(tweets) || tweets.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere un array de tweets'
      })
    }

    if (tweets.length > 10) {
      return res.status(400).json({
        success: false,
        error: 'Máximo 10 tweets por lote'
      })
    }

    logger.info(`[${requestId}] Generación en lote iniciada para ${tweets.length} tweets`)

    const results = []
    const imageOptions: ImageOptions = { ...DEFAULT_IMAGE_OPTIONS, ...options }

    for (let i = 0; i < tweets.length; i++) {
      const tweetData = tweets[i]
      
      // Validar cada tweet
      const validation = validateImageRequest({ body: { tweetData } } as Request)
      if (!validation.isValid) {
        results.push({
          index: i,
          success: false,
          error: validation.errors.join(', ')
        })
        continue
      }

      try {
        const result = await generateSocialImage(tweetData, imageOptions, `${requestId}-${i}`)
        results.push({
          index: i,
          success: true,
          imageUrl: result.imageUrl
        })
      } catch (error: any) {
        results.push({
          index: i,
          success: false,
          error: error.message
        })
      }
    }

    const processingTime = Date.now() - startTime
    const successCount = results.filter(r => r.success).length

    logger.info(`[${requestId}] Lote completado: ${successCount}/${tweets.length} exitosos en ${processingTime}ms`)

    res.json({
      success: true,
      results,
      summary: {
        total: tweets.length,
        successful: successCount,
        failed: tweets.length - successCount,
        processingTime: `${processingTime}ms`
      }
    })

  } catch (error: any) {
    logger.error(`[${requestId}] Error en generación en lote:`, error)
    res.status(500).json({
      success: false,
      error: 'Error en generación en lote',
      details: error.message
    })
  }
})

// DELETE /api/image/:filename - Eliminar imagen generada
router.delete('/:filename', async (req: Request, res: Response) => {
  const { filename } = req.params

  try {
    // Validar nombre de archivo
    if (!filename.match(/^[a-zA-Z0-9_-]+\.(png|jpg|jpeg|webp)$/)) {
      return res.status(400).json({
        success: false,
        error: 'Nombre de archivo inválido'
      })
    }

    const fs = require('fs/promises')
    const path = require('path')
    const filePath = path.join('output', filename)

    await fs.unlink(filePath)
    
    logger.info(`Imagen eliminada: ${filename}`, { ip: req.ip })

    res.json({
      success: true,
      message: 'Imagen eliminada exitosamente'
    })

  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({
        success: false,
        error: 'Imagen no encontrada'
      })
    }

    logger.error('Error eliminando imagen:', error)
    res.status(500).json({
      success: false,
      error: 'Error eliminando imagen'
    })
  }
})

// NUEVO: Endpoint plano para compatibilidad con video
router.post('/', async (req: Request, res: Response) => {
  const { name, username, avatarUrl, date, text, likes, comments, retweets, backgroundVideo, options } = req.body;
  // Mapear a tweetData
  const avatarPath = avatarUrl && avatarUrl.startsWith('/') ? avatarUrl.slice(1) : avatarUrl;
  const tweetData = {
    displayName: name,
    username: username && username.startsWith('@') ? username : '@' + (username || ''),
    avatar: avatarPath,
    timestamp: date,
    text,
    likes: typeof likes === 'number' ? likes : 0,
    retweets: typeof retweets === 'number' ? retweets : 0,
    replies: typeof comments === 'number' ? comments : 0,
    background: backgroundVideo,
  };
  // Validar entrada
  const validation = validateImageRequest({ body: { tweetData, options } } as Request);
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      error: 'Datos de entrada inválidos',
      details: validation.errors.join(', ')
    });
  }
  try {
    const requestId = uuidv4();
    const result = await generateSocialImage(tweetData, { ...DEFAULT_IMAGE_OPTIONS, ...options }, requestId);
    res.json({
      success: true,
      imageUrl: result.imageUrl,
      format: options?.format || 'png'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Error generando imagen',
      details: error.message
    });
  }
});

export default router