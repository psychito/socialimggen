// server.ts - Servidor principal mejorado
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import { config } from 'dotenv'
import * as path from 'path'
import * as fs from 'fs/promises'
import { createWriteStream } from 'fs'
import winston from 'winston'
import { RateLimiterMemory } from 'rate-limiter-flexible'
import imageRoutes from './src/routes/image'
import videoRoutes from './src/routes/video'
import uploadRoutes from './src/routes/upload'

// Cargar variables de entorno
config()

// Configuración
const app = express()
const PORT = process.env.PORT || 3000
const NODE_ENV = process.env.NODE_ENV || 'development'
const PUBLIC_URL = process.env.PUBLIC_URL || `http://localhost:${PORT}`

// Configurar Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'social-video-generator' },
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 10485760,
      maxFiles: 5
    })
  ],
})

// En desarrollo, también log a consola
if (NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }))
}

// Rate limiter
const rateLimiter = new RateLimiterMemory({
  points: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  duration: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000') / 1000, // 15 minutos
})

const rateLimiterMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    await rateLimiter.consume(req.ip || 'unknown')
    next()
  } catch (rejRes: any) {
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1
    res.set('Retry-After', String(secs))
    res.status(429).json({
      error: 'Too Many Requests',
      retryAfter: secs
    })
  }
}

// Middleware de seguridad
app.use(helmet({
  contentSecurityPolicy: false, // Desactivar para permitir videos
  crossOriginEmbedderPolicy: false
}))

// Configurar CORS
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://localhost:5173',
    PUBLIC_URL
  ],
  credentials: true,
  optionsSuccessStatus: 200
}

if (process.env.ENABLE_CORS !== 'false') {
  app.use(cors(corsOptions))
}

// Middleware básico
app.use(compression())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Trust proxy si está configurado
if (process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1)
}

// Rate limiting
app.use(rateLimiterMiddleware)

// Middleware de logging
app.use((req, res, next) => {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - start
    logger.info({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    })
  })
  
  next()
})

// Servir archivos estáticos
app.use('/output', express.static('output', {
  maxAge: '1d',
  setHeaders: (res, path) => {
    if (path.endsWith('.mp4')) {
      res.setHeader('Content-Type', 'video/mp4')
    } else if (path.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png')
    }
  }
}))

app.use('/videos', express.static('videos', { maxAge: '7d' }))

// Servir frontend build
app.use(express.static('client/dist'))

// Health check básico
app.get('/health', async (req, res) => {
  try {
    const systemInfo = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      environment: NODE_ENV,
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024)
      }
    }

    res.json(systemInfo)
  } catch (error) {
    logger.error('Health check failed:', error)
    res.status(500).json({
      status: 'ERROR',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    })
  }
})

// Información de la API
app.get('/', (req, res) => {
  res.json({
    name: 'Social Video Generator API',
    version: '2.0.0',
    description: 'API para generar videos sociales con efectos glassmorphism',
    status: '✅ Backend funcionando correctamente',
    port: PORT,
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      debug: '/api/debug',
      avatars: '/api/upload/avatars',
      videos: '/api/video/list',
      documentation: '/docs'
    },
    features: [
      'Generación de videos con glassmorphism',
      'Fondos dinámicos tipo B-roll',
      'Múltiples formatos de salida',
      'Rate limiting',
      'Optimización automática',
      'API RESTful'
    ],
    github: 'https://github.com/psychito/socialimggen',
    author: 'psychito'
  })
})

// Debug: Log todas las requests
app.use('/api', (req, res, next) => {
  logger.info(`API Request: ${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  })
  next()
})

// Montar routers de la API antes de la ruta 404
app.use('/api/video', videoRoutes)
app.use('/api/image', imageRoutes)
app.use('/api/upload', uploadRoutes)

// Debug: Ruta para verificar que las APIs estén funcionando
app.get('/api/debug', (req, res) => {
  res.json({
    success: true,
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString(),
    availableRoutes: {
      video: ['/api/video/list', '/api/video/presets', '/api/video/formats'],
      upload: ['/api/upload/avatars', '/api/upload/backgrounds', '/api/upload/stats'],
      image: ['/api/image/generate']
    }
  })
})

// DEBUG: Endpoint temporal para listar videos (el router no funciona)
app.get('/api/video/list', async (req, res) => {
  try {
    logger.info('🎬 Video list endpoint accessed directly')
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
    logger.error('Error en endpoint de videos:', error)
    res.status(500).json({ success: false, error: 'Error listando videos', details: error.message })
  }
})

// Manejar rutas API no encontradas
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint no encontrado',
    path: req.path,
    availableEndpoints: [
      'GET /api/video/list',
      'GET /api/video/presets', 
      'GET /api/video/formats',
      'POST /api/video/generate',
      'GET /api/upload/avatars',
      'POST /api/image/generate',
      'GET /api/debug'
    ]
  })
})

// Servir frontend para todas las rutas no API
app.get('*', (req, res) => {
  res.sendFile(path.resolve('client/dist/index.html'))
})

// Middleware de manejo de errores
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error({
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  })

  res.status(500).json({
    error: 'Error interno del servidor',
    message: NODE_ENV === 'development' ? err.message : 'Algo salió mal'
  })
})

// Inicializar directorios necesarios
async function initializeDirectories() {
  const directories = [
    'output',
    'temp', 
    'uploads',
    'logs',
    'videos/tech',
    'videos/nature',
    'videos/urban',
    'videos/abstract',
    'videos/business',
    'videos/custom'
  ]

  for (const dir of directories) {
    try {
      await fs.mkdir(dir, { recursive: true })
      logger.info(`✅ Directorio creado/verificado: ${dir}`)
    } catch (error) {
      logger.error(`❌ Error creando directorio ${dir}:`, error)
    }
  }
}

// Iniciar servidor
async function startServer() {
  try {
    // Inicializar directorios
    await initializeDirectories()

    // Iniciar servidor
    app.listen(PORT, () => {
      logger.info(`🚀 Social Video Generator API v2.0.0`)
      logger.info(`📡 Servidor ejecutándose en ${PUBLIC_URL}`)
      logger.info(`🌍 Entorno: ${NODE_ENV}`)
      logger.info(`🎬 Generación básica: ✅ Habilitada`)
      
      if (NODE_ENV === 'development') {
        logger.info(`🔍 Health check: ${PUBLIC_URL}/health`)
      }
    })

  } catch (error) {
    logger.error('❌ Error iniciando servidor:', error)
    process.exit(1)
  }
}

// Iniciar la aplicación
startServer()

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

export default app
