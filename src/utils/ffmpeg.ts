// src/utils/ffmpeg.ts - Utilidades para FFmpeg
import ffmpeg from 'fluent-ffmpeg'
import path from 'path'
import fs from 'fs/promises'
import winston from 'winston'
import { VideoOptions, FFmpegOptions } from '../types'

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/ffmpeg.log' })
  ]
})

// Configurar ruta de FFmpeg si está especificada en variables de entorno
if (process.env.FFMPEG_PATH) {
  ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH)
}

// Función principal para combinar video con overlay
export async function combineVideoWithOverlay(
  backgroundPath: string,
  overlayPath: string,
  options: VideoOptions,
  requestId: string
): Promise<string> {
  
  return new Promise((resolve, reject) => {
    const outputFileName = `social-video-${requestId}.mp4`
    const outputPath = path.join('output', outputFileName)

    logger.info(`[${requestId}] Iniciando combinación FFmpeg`, {
      background: backgroundPath,
      overlay: overlayPath,
      output: outputPath
    })

    const ffmpegCommand = ffmpeg()

    // Input del video de fondo
    ffmpegCommand.input(backgroundPath)
    
    // Input del overlay
    ffmpegCommand.input(overlayPath)

    // Construir filtros complejos
    const filters = buildComplexFilters(options, requestId)

    ffmpegCommand
      .complexFilter(filters)
      .outputOptions(buildOutputOptions(options))
      .output(outputPath)
      .on('start', (commandLine) => {
        logger.info(`[${requestId}] FFmpeg iniciado:`, { command: commandLine })
      })
      .on('progress', (progress) => {
        const percent = Math.round(progress.percent || 0)
        if (percent % 10 === 0) { // Log cada 10%
          logger.info(`[${requestId}] Progreso FFmpeg: ${percent}%`)
        }
      })
      .on('end', () => {
        logger.info(`[${requestId}] FFmpeg completado exitosamente`)
        resolve(outputPath)
      })
      .on('error', (err) => {
        logger.error(`[${requestId}] Error FFmpeg:`, {
          error: err.message,
          stack: err.stack
        })
        reject(new Error(`Error FFmpeg: ${err.message}`))
      })
      .run()
  })
}

// Construir filtros complejos mejorados para mejor calidad
function buildComplexFilters(options: VideoOptions, requestId: string): string[] {
  const filters: string[] = []
  
  // Escalar y recortar video de fondo con mejor algoritmo de escalado
  let scaleFilter = `[0:v]scale=${options.width}:${options.height}:force_original_aspect_ratio=increase:flags=lanczos,crop=${options.width}:${options.height}`
  
  // Playback rate (velocidad)
  if (options.backgroundPlaybackRate && options.backgroundPlaybackRate !== 1) {
    scaleFilter += `,setpts=${(1/options.backgroundPlaybackRate).toFixed(2)}*PTS`
  }
  
  // Blur configurable con mejor calidad
  const blurValue = options.overlayBlur !== undefined ? options.overlayBlur : 2
  let backgroundFilter = scaleFilter
  
  // Aplicar blur solo si es necesario para mejor rendimiento
  if (blurValue > 0) {
    backgroundFilter += `,gblur=sigma=${blurValue}:steps=2` // Gaussian blur de mejor calidad
  }
  
  backgroundFilter += '[bg]'
  filters.push(backgroundFilter)

  // Procesar overlay con escalado de alta calidad si es necesario
  let overlayPreprocessing = '[1:v]'
  
  // Si el overlay necesita escalado, usar Lanczos
  if (options.width !== 1080 || options.height !== 1920) {
    overlayPreprocessing += `scale=${options.width}:${options.height}:flags=lanczos,`
  }
  
  // Asegurar que el overlay tenga el formato correcto
  overlayPreprocessing += 'format=yuva420p[overlay_processed]'
  filters.push(overlayPreprocessing)

  // Configurar overlay con blend mode para mejor composición
  let overlayFilter = '[bg][overlay_processed]overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/2'
  
  if (options.animation) {
    overlayFilter = addAnimationToOverlay(overlayFilter, options, requestId)
  }

  // El overlay debe estar desde t=0 y durar todo el video
  overlayFilter += `[final]`
  filters.push(overlayFilter)

  // Agregar fade-in suave al overlay SIEMPRE (0.5s más rápido)
  let fadeFilter = `[final]fade=in:st=0:d=0.5`
  
  // Aplicar sharpening sutil para mejorar la calidad visual
  if (options.quality === 'high' || options.quality === 'ultra') {
    fadeFilter += `,unsharp=5:5:0.8:3:3:0.4` // Sharpen suave
  }
  
  fadeFilter += '[output]'
  filters.push(fadeFilter)

  logger.info(`[${requestId}] Filtros mejorados construidos:`, { filters })
  
  return filters
}

// Agregar animación al overlay
function addAnimationToOverlay(overlayFilter: string, options: VideoOptions, requestId: string): string {
  const safeDuration = options.duration ?? 10;
  switch (options.animation) {
    case 'slide':
      // Slide desde la derecha
      return overlayFilter.replace(
        '(main_w-overlay_w)/2',
        `main_w-overlay_w*(t/${safeDuration})`
      )
    
    case 'zoom':
      // Zoom in effect
      return overlayFilter.replace(
        '(main_w-overlay_w)/2:(main_h-overlay_h)/2',
        `(main_w-overlay_w*min(t*2,1))/2:(main_h-overlay_h*min(t*2,1))/2`
      )
    
    case 'fade':
      // El fade se maneja en el filtro final
      return overlayFilter
    
    default:
      return overlayFilter
  }
}

// Construir opciones de salida mejoradas para mayor calidad
function buildOutputOptions(options: VideoOptions): string[] {
  const outputOptions: string[] = []

  // Mapear el output final
  outputOptions.push('-map', '[output]')

  // Configurar codec de video
  if (process.env.ENABLE_GPU_ACCELERATION === 'true') {
    const gpuType = process.env.GPU_TYPE || 'nvidia'
    if (gpuType === 'nvidia') {
      outputOptions.push('-c:v', 'h264_nvenc')
      // Configuraciones adicionales para NVENC
      outputOptions.push('-profile:v', 'high')
      outputOptions.push('-rc', 'vbr')
      outputOptions.push('-cq', getCRFForQuality(options.quality || 'medium').toString())
      outputOptions.push('-b:v', getBitrateForQuality(options.quality || 'medium', options.width, options.height))
      outputOptions.push('-maxrate', getMaxBitrateForQuality(options.quality || 'medium', options.width, options.height))
      outputOptions.push('-bufsize', getBufferSizeForQuality(options.quality || 'medium', options.width, options.height))
    } else {
      outputOptions.push('-c:v', 'libx264')
    }
  } else {
    outputOptions.push('-c:v', 'libx264')
  }

  // Solo aplicar configuraciones CRF para CPU encoding
  if (process.env.ENABLE_GPU_ACCELERATION !== 'true' || process.env.GPU_TYPE !== 'nvidia') {
    // Configurar preset según la calidad
    const preset = getPresetForQuality(options.quality || 'medium')
    outputOptions.push('-preset', preset)

    // Configurar CRF (Constant Rate Factor)
    const crf = getCRFForQuality(options.quality || 'medium')
    outputOptions.push('-crf', crf.toString())
    
    // Configurar profile para mejor compatibilidad
    outputOptions.push('-profile:v', 'high')
    outputOptions.push('-level', '4.1')
  }

  // Configurar formato de píxeles para compatibilidad
  outputOptions.push('-pix_fmt', 'yuv420p')

  // Configurar frame rate
  outputOptions.push('-r', options.fps.toString())

  // Configurar duración
  const safeDuration = options.duration ?? 10;
  outputOptions.push('-t', safeDuration.toString())

  // Configuraciones adicionales para mejor calidad
  outputOptions.push('-movflags', '+faststart') // Optimizar para streaming
  outputOptions.push('-avoid_negative_ts', 'make_zero') // Evitar timestamps negativos
  
  // Configurar GOP (Group of Pictures) para mejor calidad
  const gopSize = Math.round(options.fps * 2) // 2 segundos de GOP
  outputOptions.push('-g', gopSize.toString())

  // Eliminar audio (no lo necesitamos para videos sociales)
  outputOptions.push('-an')

  return outputOptions
}

// Obtener preset según calidad
function getPresetForQuality(quality: string): string {
  switch (quality) {
    case 'low': return 'ultrafast'
    case 'medium': return 'slow'
    case 'high': return 'veryslow'
    case 'ultra': return 'veryslow'
    default: return 'slow'
  }
}

// Obtener CRF según calidad (valores más bajos = mejor calidad)
function getCRFForQuality(quality: string): number {
  switch (quality) {
    case 'low': return 25     // Reducido de 28
    case 'medium': return 20  // Reducido de 18
    case 'high': return 16    // Reducido de 15
    case 'ultra': return 12   // Nuevo: ultra alta calidad
    default: return 20
  }
}

// Obtener bitrate base según calidad y resolución
function getBitrateForQuality(quality: string, width: number, height: number): string {
  const pixelCount = width * height
  const baseMultiplier = pixelCount / (1920 * 1080) // Normalizar a 1080p
  
  let baseBitrate: number
  switch (quality) {
    case 'low': baseBitrate = 2000; break      // 2 Mbps base
    case 'medium': baseBitrate = 4000; break   // 4 Mbps base  
    case 'high': baseBitrate = 8000; break     // 8 Mbps base
    case 'ultra': baseBitrate = 12000; break   // 12 Mbps base
    default: baseBitrate = 4000
  }
  
  const finalBitrate = Math.round(baseBitrate * baseMultiplier)
  return `${finalBitrate}k`
}

// Obtener bitrate máximo (para VBR)
function getMaxBitrateForQuality(quality: string, width: number, height: number): string {
  const baseBitrate = parseInt(getBitrateForQuality(quality, width, height).replace('k', ''))
  const maxBitrate = Math.round(baseBitrate * 1.5) // 150% del bitrate base
  return `${maxBitrate}k`
}

// Obtener buffer size
function getBufferSizeForQuality(quality: string, width: number, height: number): string {
  const baseBitrate = parseInt(getBitrateForQuality(quality, width, height).replace('k', ''))
  const bufferSize = Math.round(baseBitrate * 2) // 2x el bitrate base
  return `${bufferSize}k`
}

// Optimizar video de fondo subido
export async function optimizeBackgroundVideo(
  inputPath: string,
  requestId: string
): Promise<string> {
  
  return new Promise((resolve, reject) => {
    const outputPath = path.join('videos/custom', `optimized-${requestId}.mp4`)
    
    logger.info(`[${requestId}] Optimizando video de fondo`, {
      input: inputPath,
      output: outputPath
    })

    ffmpeg(inputPath)
      .outputOptions([
        '-c:v', 'libx264',
        '-preset', 'slow', // Mejor calidad para videos de fondo
        '-crf', '20',      // Mejor calidad
        '-profile:v', 'high',
        '-level', '4.1',
        '-vf', 'scale=1920:1080:force_original_aspect_ratio=decrease:flags=lanczos,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=black', // Mejores algoritmos
        '-pix_fmt', 'yuv420p',
        '-g', '60',        // GOP size
        '-an',             // Remover audio
        '-movflags', '+faststart', // Optimizar para streaming
        '-avoid_negative_ts', 'make_zero' // Evitar timestamps negativos
      ])
      .output(outputPath)
      .on('start', (commandLine) => {
        logger.info(`[${requestId}] Optimización iniciada:`, { command: commandLine })
      })
      .on('progress', (progress) => {
        const percent = Math.round(progress.percent || 0)
        if (percent % 20 === 0) {
          logger.info(`[${requestId}] Progreso optimización: ${percent}%`)
        }
      })
      .on('end', () => {
        logger.info(`[${requestId}] Video optimizado exitosamente`)
        resolve(outputPath)
      })
      .on('error', (err) => {
        logger.error(`[${requestId}] Error optimizando video:`, err)
        reject(new Error(`Error optimizando video: ${err.message}`))
      })
      .run()
  })
}

// Obtener información de un video
export async function getVideoInfo(videoPath: string): Promise<{
  duration: number
  width: number
  height: number
  fps: number
  codec: string
  bitrate: number
}> {
  
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        logger.error('Error obteniendo info de video:', err)
        reject(new Error(`Error analizando video: ${err.message}`))
        return
      }

      try {
        const videoStream = metadata.streams.find(stream => stream.codec_type === 'video')
        
        if (!videoStream) {
          reject(new Error('No se encontró stream de video'))
          return
        }

        const info = {
          duration: metadata.format.duration || 0,
          width: videoStream.width || 0,
          height: videoStream.height || 0,
          fps: eval(videoStream.r_frame_rate || '30/1'), // Evaluar fracción
          codec: videoStream.codec_name || 'unknown',
          bitrate: typeof metadata.format.bit_rate === 'string' ? parseInt(metadata.format.bit_rate) : (metadata.format.bit_rate || 0)
        }

        resolve(info)
      } catch (parseError: any) {
        reject(new Error(`Error parseando metadata: ${parseError.message}`))
      }
    })
  })
}

// Crear thumbnail de un video
export async function generateVideoThumbnail(
  videoPath: string,
  outputPath: string,
  timeOffset: number = 1
): Promise<string> {
  
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .seekInput(timeOffset)
      .outputOptions([
        '-vframes', '1',
        '-q:v', '2',
        '-f', 'image2'
      ])
      .output(outputPath)
      .on('end', () => {
        resolve(outputPath)
      })
      .on('error', (err) => {
        reject(new Error(`Error generando thumbnail: ${err.message}`))
      })
      .run()
  })
}

// Convertir video a GIF animado
export async function convertVideoToGif(
  videoPath: string,
  outputPath: string,
  options: {
    width?: number
    fps?: number
    duration?: number
    startTime?: number
  } = {}
): Promise<string> {
  
  return new Promise((resolve, reject) => {
    const {
      width = 480,
      fps = 15,
      duration = 3,
      startTime = 0
    } = options

    const command = ffmpeg(videoPath)
      .seekInput(startTime)
      .duration(duration)
      .outputOptions([
        '-vf', `fps=${fps},scale=${width}:-1:flags=lanczos,palettegen`,
        '-y'
      ])

    const paletteFile = outputPath.replace('.gif', '_palette.png')
    
    // Primero generar paleta de colores
    command
      .output(paletteFile)
      .on('end', () => {
        // Luego generar GIF usando la paleta
        ffmpeg(videoPath)
          .seekInput(startTime)
          .duration(duration)
          .input(paletteFile)
          .outputOptions([
            '-filter_complex', `fps=${fps},scale=${width}:-1:flags=lanczos[x];[x][1:v]paletteuse`,
            '-y'
          ])
          .output(outputPath)
          .on('end', async () => {
            // Limpiar archivo de paleta
            try {
              await fs.unlink(paletteFile)
            } catch (error) {
              logger.warn('Error limpiando paleta:', error)
            }
            resolve(outputPath)
          })
          .on('error', (err) => {
            reject(new Error(`Error generando GIF: ${err.message}`))
          })
          .run()
      })
      .on('error', (err) => {
        reject(new Error(`Error generando paleta: ${err.message}`))
      })
      .run()
  })
}

// Validar que FFmpeg esté disponible
export async function validateFFmpegInstallation(): Promise<{
  isInstalled: boolean
  version?: string
  features: string[]
  errors: string[]
}> {
  
  return new Promise((resolve) => {
    const features: string[] = []
    const errors: string[] = []

    ffmpeg.getAvailableFormats((err, formats) => {
      if (err) {
        errors.push('No se puede acceder a formatos de FFmpeg')
      } else {
        features.push(`${Object.keys(formats).length} formatos disponibles`)
      }

      ffmpeg.getAvailableCodecs((err, codecs) => {
        if (err) {
          errors.push('No se puede acceder a codecs de FFmpeg')
        } else {
          features.push(`${Object.keys(codecs).length} codecs disponibles`)
          
          // Verificar codecs importantes
          if (codecs.libx264) features.push('H.264 disponible')
          if (codecs.h264_nvenc) features.push('NVENC disponible')
          if (codecs.libvpx) features.push('VP8/VP9 disponible')
        }

        // Verificar versión
        ffmpeg()
          .on('start', (commandLine) => {
            const versionMatch = commandLine.match(/ffmpeg version ([^\s]+)/)
            const version = versionMatch ? versionMatch[1] : 'unknown'
            
            resolve({
              isInstalled: errors.length === 0,
              version,
              features,
              errors
            })
          })
          .on('error', () => {
            errors.push('FFmpeg no está instalado o no es accesible')
            resolve({
              isInstalled: false,
              features,
              errors
            })
          })
          .outputOptions(['-f', 'null', '-'])
          .run()
      })
    })
  })
}

// Obtener estadísticas de procesamiento
export async function getProcessingStats(): Promise<{
  activeJobs: number
  queueLength: number
  averageProcessingTime: number
  successRate: number
}> {
  
  // En una implementación real, esto se conectaría con un sistema de colas
  // Por ahora, devolvemos estadísticas simuladas basadas en logs
  
  try {
    const logContent = await fs.readFile('logs/ffmpeg.log', 'utf-8').catch(() => '')
    const lines = logContent.split('\n').filter(line => line.length > 0)
    
    const completedJobs = lines.filter(line => 
      line.includes('FFmpeg completado exitosamente')
    ).length
    
    const failedJobs = lines.filter(line => 
      line.includes('Error FFmpeg')
    ).length
    
    const totalJobs = completedJobs + failedJobs
    const successRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 100

    return {
      activeJobs: 0, // Se obtendría de un sistema de colas real
      queueLength: 0,
      averageProcessingTime: 0, // Se calcularía de los logs
      successRate: Math.round(successRate)
    }
  } catch (error) {
    logger.error('Error obteniendo estadísticas de procesamiento:', error)
    return {
      activeJobs: 0,
      queueLength: 0,
      averageProcessingTime: 0,
      successRate: 0
    }
  }
}

// Limpiar archivos temporales de FFmpeg
export async function cleanupFFmpegTempFiles(): Promise<number> {
  let cleanedFiles = 0
  
  try {
    const tempDir = 'temp'
    const files = await fs.readdir(tempDir).catch(() => [])
    
    for (const file of files) {
      if (file.includes('ffmpeg') || file.includes('overlay-')) {
        try {
          await fs.unlink(path.join(tempDir, file))
          cleanedFiles++
          logger.info(`Archivo temporal limpiado: ${file}`)
        } catch (error) {
          logger.warn(`Error limpiando ${file}:`, error)
        }
      }
    }
  } catch (error) {
    logger.error('Error en limpieza de archivos temporales:', error)
  }

  return cleanedFiles
}