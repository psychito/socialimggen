// src/services/videoGenerator.ts - Servicio principal de generación de videos
import path from 'path'
import fs from 'fs/promises'
import winston from 'winston'
import { v4 as uuidv4 } from 'uuid'
import { TweetData, VideoOptions, GenerationResponse } from '../types'
import { generateGlassmorphismOverlay } from '../utils/canvas'
import { combineVideoWithOverlay } from '../utils/ffmpeg'
import { cleanupTempFile } from '../utils/fileUtils'

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/video-generator.log' })
  ]
})

export async function generateVideo(
  tweetData: TweetData,
  options: VideoOptions,
  requestId: string
): Promise<GenerationResponse> {
  const startTime = Date.now()
  let overlayPath: string | null = null

  try {
    logger.info(`[${requestId}] Iniciando generación de video`, {
      username: tweetData.username,
      duration: options.duration,
      style: options.style,
      animation: options.animation
    })

    // Paso 1: Validar video de fondo
    if (!options.backgroundVideo) {
      throw new Error('Video de fondo no especificado')
    }

    // Quitar cualquier '/' inicial para evitar rutas absolutas erróneas
    const videoRelPath = options.backgroundVideo.replace(/^\/+/, '')
    const backgroundPath = path.join(process.cwd(), videoRelPath)
    try {
      await fs.access(backgroundPath)
      logger.info(`[${requestId}] Video de fondo validado: ${backgroundPath}`)
    } catch (error) {
      throw new Error(`Video de fondo no encontrado: ${backgroundPath}`)
    }

    // Paso 2: Generar overlay glassmorphism
    logger.info(`[${requestId}] Generando overlay glassmorphism...`)
    overlayPath = await generateGlassmorphismOverlay(tweetData, options, requestId)
    logger.info(`[${requestId}] Overlay generado: ${overlayPath}`)

    // Paso 3: Combinar video + overlay con FFmpeg
    logger.info(`[${requestId}] Combinando video con overlay...`)
    const outputPath = await combineVideoWithOverlay(
      backgroundPath,
      overlayPath,
      options,
      requestId
    )

    // Paso 4: Obtener información del archivo generado
    const stats = await fs.stat(outputPath)
    const fileSize = `${(stats.size / (1024 * 1024)).toFixed(2)}MB`
    
    // Paso 5: Generar URL pública
    const fileName = path.basename(outputPath)
    const publicUrl = `${process.env.PUBLIC_URL}/output/${fileName}`

    const processingTime = Date.now() - startTime

    logger.info(`[${requestId}] Video generado exitosamente`, {
      outputPath,
      fileSize,
      processingTime: `${processingTime}ms`
    })

    return {
      success: true,
      videoUrl: publicUrl,
      size: fileSize
    }

  } catch (error: any) {
    const processingTime = Date.now() - startTime
    
    logger.error(`[${requestId}] Error en generación de video después de ${processingTime}ms`, {
      error: error.message,
      stack: error.stack
    })

    throw error

  } finally {
    // Limpiar archivo temporal de overlay
    if (overlayPath) {
      try {
        await cleanupTempFile(overlayPath)
        logger.info(`[${requestId}] Overlay temporal limpiado: ${overlayPath}`)
      } catch (cleanupError) {
        logger.warn(`[${requestId}] Error limpiando overlay: ${cleanupError}`)
      }
    }
  }
}

// Función para validar capacidad del sistema antes de generar
export async function checkSystemCapacity(): Promise<{ canProcess: boolean; reason?: string }> {
  try {
    // Verificar memoria disponible
    const memoryUsage = process.memoryUsage()
    const totalMemoryMB = memoryUsage.heapTotal / (1024 * 1024)
    const usedMemoryMB = memoryUsage.heapUsed / (1024 * 1024)
    const availableMemoryMB = totalMemoryMB - usedMemoryMB

    if (availableMemoryMB < 500) { // Menos de 500MB disponibles
      return {
        canProcess: false,
        reason: 'Memoria insuficiente para procesar video'
      }
    }

    // Verificar espacio en disco para archivos temporales
    const tempStats = await fs.stat('temp').catch(() => null)
    if (!tempStats) {
      await fs.mkdir('temp', { recursive: true })
    }

    // Verificar número de archivos de salida
    const outputFiles = await fs.readdir('output').catch(() => [])
    const maxFiles = parseInt(process.env.MAX_OUTPUT_FILES || '1000')
    
    if (outputFiles.length >= maxFiles) {
      return {
        canProcess: false,
        reason: 'Límite de archivos de salida alcanzado'
      }
    }

    return { canProcess: true }

  } catch (error) {
    logger.error('Error verificando capacidad del sistema:', error)
    return {
      canProcess: false,
      reason: 'Error verificando recursos del sistema'
    }
  }
}

// Función para obtener estadísticas de procesamiento
export async function getProcessingStats(): Promise<{
  activeJobs: number
  completedToday: number
  averageProcessingTime: number
  systemLoad: {
    memory: number
    cpu: number
  }
}> {
  try {
    // En una implementación real, esto se conectaría con un sistema de colas
    // Por ahora, devolvemos datos simulados basados en logs

    const logFiles = (await fs.readdir('logs').catch(() => [])) as string[]
    const videoLogExists = logFiles.includes('video-generator.log')

    let completedToday = 0
    let averageProcessingTime = 0

    if (videoLogExists) {
      try {
        const logContent = await fs.readFile('logs/video-generator.log', 'utf-8')
        const today = new Date().toISOString().split('T')[0]
        const todayEntries = logContent
          .split('\n')
          .filter(line => line.includes(today) && line.includes('Video generado exitosamente'))

        completedToday = todayEntries.length

        // Calcular tiempo promedio de procesamiento
        const processingTimes = todayEntries
          .map(line => {
            const match = line.match(/"processingTime":"(\d+)ms"/)
            return match ? parseInt(match[1]) : 0
          })
          .filter(time => time > 0)

        if (processingTimes.length > 0) {
          averageProcessingTime = processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
        }
      } catch (logError) {
        logger.warn('Error leyendo logs para estadísticas:', logError)
      }
    }

    // Obtener información del sistema
    const memoryUsage = process.memoryUsage()
    const memoryPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100

    return {
      activeJobs: 0, // En implementación real, esto vendría de un sistema de colas
      completedToday,
      averageProcessingTime: Math.round(averageProcessingTime),
      systemLoad: {
        memory: Math.round(memoryPercent),
        cpu: 0 // Requeriría una librería adicional para obtener CPU usage
      }
    }

  } catch (error) {
    logger.error('Error obteniendo estadísticas:', error)
    return {
      activeJobs: 0,
      completedToday: 0,
      averageProcessingTime: 0,
      systemLoad: {
        memory: 0,
        cpu: 0
      }
    }
  }
}

// Función para generar video con opciones avanzadas
export async function generateAdvancedVideo(
  tweetData: TweetData,
  options: VideoOptions & {
    watermark?: string
    intro?: { duration: number; text: string }
    outro?: { duration: number; text: string }
    transitions?: Array<{ type: string; duration: number }>
  },
  requestId: string
): Promise<GenerationResponse> {
  
  // Esta función extendería generateVideo con funcionalidades avanzadas
  // Por ahora, delegamos a la función básica
  logger.info(`[${requestId}] Generación avanzada solicitada, usando generación básica`)
  
  return generateVideo(tweetData, options, requestId)
}

// Función para generar múltiples variaciones de un video
export async function generateVideoVariations(
  tweetData: TweetData,
  baseOptions: VideoOptions,
  variations: Array<Partial<VideoOptions>>,
  requestId: string
): Promise<Array<GenerationResponse & { variation: string }>> {
  
  const results: Array<GenerationResponse & { variation: string }> = []

  for (let i = 0; i < variations.length; i++) {
    const variationOptions = { ...baseOptions, ...variations[i] }
    const variationId = `${requestId}-var-${i}`
    
    try {
      const result = await generateVideo(tweetData, variationOptions, variationId)
      results.push({
        ...result,
        variation: `Variación ${i + 1}`
      })
    } catch (error: any) {
      results.push({
        success: false,
        error: error.message,
        variation: `Variación ${i + 1}`
      })
    }
  }

  return results
}

// Función para programar generación de video (para implementación futura)
export async function scheduleVideoGeneration(
  tweetData: TweetData,
  options: VideoOptions,
  scheduleTime: Date
): Promise<{ success: boolean; jobId: string; scheduledFor: string }> {
  
  const jobId = uuidv4()
  
  logger.info('Video programado para generación', {
    jobId,
    scheduledFor: scheduleTime.toISOString(),
    username: tweetData.username
  })

  // En una implementación real, esto se agregaría a una cola de trabajos
  // Por ahora, solo registramos la solicitud
  
  return {
    success: true,
    jobId,
    scheduledFor: scheduleTime.toISOString()
  }
}

// Función para cancelar generación de video
export function cancelVideoGeneration(requestId: string): { success: boolean; message: string } {
  // En una implementación real, esto cancelaría procesos FFmpeg activos
  logger.info(`Cancelación solicitada para: ${requestId}`)
  
  return {
    success: true,
    message: 'Solicitud de cancelación registrada'
  }
}

// Función para obtener progreso de generación (para WebSockets en el futuro)
export function getGenerationProgress(requestId: string): {
  stage: string
  percentage: number
  message: string
  estimatedTimeRemaining?: number
} {
  
  // En una implementación real, esto consultaría el estado actual del proceso
  return {
    stage: 'processing',
    percentage: 50,
    message: 'Combinando video con overlay...',
    estimatedTimeRemaining: 30
  }
}