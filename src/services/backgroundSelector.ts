// src/services/backgroundSelector.ts - Servicio inteligente de selección de fondos
import * as fs from 'fs'
import * as fsPromises from 'fs/promises'
import path from 'path'
import winston from 'winston'
import { VideoCategory, BackgroundVideo } from '../types'

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/background-selector.log' })
  ]
})

// Banco de videos organizados por categoría (arranca vacío, se llena dinámicamente)
const videoBank: Record<VideoCategory, string[]> = {
  tech: [],
  nature: [],
  urban: [],
  abstract: [],
  business: [],
  custom: []
}

// Palabras clave para análisis de contenido
const categoryKeywords = {
  tech: [
    'code', 'programming', 'developer', 'software', 'tech', 'ai', 'machine learning',
    'algorithm', 'api', 'framework', 'javascript', 'python', 'react', 'node',
    'database', 'cloud', 'startup', 'innovation', 'digital', 'cyber', 'blockchain',
    'cryptocurrency', 'bitcoin', 'ethereum', 'nft', 'web3', 'metaverse'
  ],
  nature: [
    'nature', 'natural', 'environment', 'earth', 'green', 'forest', 'tree',
    'ocean', 'sea', 'mountain', 'river', 'lake', 'sunset', 'sunrise', 'sky',
    'beautiful', 'peaceful', 'calm', 'serene', 'wildlife', 'animal', 'plant',
    'ecosystem', 'conservation', 'sustainable', 'organic', 'climate'
  ],
  urban: [
    'city', 'urban', 'street', 'building', 'downtown', 'metropolitan', 'traffic',
    'lifestyle', 'nightlife', 'restaurant', 'cafe', 'shopping', 'fashion',
    'architecture', 'modern', 'contemporary', 'hip', 'trendy', 'culture'
  ],
  business: [
    'business', 'corporate', 'company', 'startup', 'entrepreneur', 'finance',
    'investment', 'profit', 'growth', 'strategy', 'marketing', 'sales',
    'leadership', 'management', 'team', 'professional', 'office', 'work',
    'career', 'success', 'achievement', 'goal', 'target', 'revenue'
  ],
  abstract: [
    'creative', 'art', 'design', 'aesthetic', 'visual', 'inspiration',
    'imagination', 'dream', 'future', 'space', 'universe', 'energy',
    'motion', 'flow', 'pattern', 'texture', 'color', 'light', 'shadow'
  ]
}

// Función principal para seleccionar video de fondo
export function selectBackgroundVideo(tweetText: string, customPath?: string): string {
  if (customPath && fs.existsSync(customPath)) {
    return customPath
  }

  const category = analyzeContentCategory(tweetText)
  const selectedVideo = getRandomVideoFromCategory(category)
  
  logger.info('Video de fondo seleccionado', {
    tweetText: tweetText.substring(0, 50) + '...',
    detectedCategory: category,
    selectedVideo
  })

  return selectedVideo
}

// Análisis inteligente del contenido para determinar categoría
function analyzeContentCategory(text: string): VideoCategory {
  const normalizedText = text.toLowerCase()
  const scores: Record<VideoCategory, number> = {
    tech: 0,
    nature: 0,
    urban: 0,
    business: 0,
    abstract: 0,
    custom: 0
  }

  // Calcular puntuación para cada categoría basado en palabras clave
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      if (normalizedText.includes(keyword)) {
        scores[category as VideoCategory] += 1
        
        // Dar puntuación extra si la palabra aparece al inicio del tweet
        if (normalizedText.indexOf(keyword) < 50) {
          scores[category as VideoCategory] += 0.5
        }
      }
    }
  }

  // Análisis adicional por emojis
  const emojiAnalysis = analyzeEmojis(text)
  for (const [category, weight] of Object.entries(emojiAnalysis)) {
    scores[category as VideoCategory] += weight
  }

  // Análisis de hashtags
  const hashtagAnalysis = analyzeHashtags(text)
  for (const [category, weight] of Object.entries(hashtagAnalysis)) {
    scores[category as VideoCategory] += weight
  }

  // Encontrar la categoría con mayor puntuación
  let bestCategory: VideoCategory = 'abstract' // default
  let bestScore = 0

  for (const [category, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score
      bestCategory = category as VideoCategory
    }
  }

  // Si no hay coincidencias claras, usar análisis de sentiment
  if (bestScore === 0) {
    bestCategory = analyzeSentiment(text)
  }

  return bestCategory
}

// Análisis de emojis para categorización
function analyzeEmojis(text: string): Record<VideoCategory, number> {
  const scores: Record<VideoCategory, number> = {
    tech: 0, nature: 0, urban: 0, business: 0, abstract: 0, custom: 0
  }

  const emojiCategories = {
    tech: ['💻', '🖥️', '📱', '⚡', '🚀', '🤖', '🔬', '⚙️', '🛠️', '💡'],
    nature: ['🌳', '🌲', '🌿', '🌺', '🌸', '🦋', '🐝', '🌅', '🌄', '🌊', '⛰️'],
    urban: ['🏙️', '🌃', '🏢', '🚗', '🚕', '🚇', '🍕', '☕', '🛍️', '🎭'],
    business: ['💼', '📊', '📈', '💰', '💳', '🏦', '🤝', '👔', '📋', '🎯'],
    abstract: ['✨', '🎨', '🌈', '🔮', '💫', '⭐', '🌟', '🎪', '🎭', '🎬']
  }

  for (const [category, emojis] of Object.entries(emojiCategories)) {
    for (const emoji of emojis) {
      if (text.includes(emoji)) {
        scores[category as VideoCategory] += 2 // Los emojis tienen peso alto
      }
    }
  }

  return scores
}

// Análisis de hashtags
function analyzeHashtags(text: string): Record<VideoCategory, number> {
  const scores: Record<VideoCategory, number> = {
    tech: 0, nature: 0, urban: 0, business: 0, abstract: 0, custom: 0
  }

  const hashtags = text.match(/#\w+/g) || []
  
  for (const hashtag of hashtags) {
    const tag = hashtag.toLowerCase()
    
    if (tag.includes('tech') || tag.includes('code') || tag.includes('dev')) {
      scores.tech += 3
    } else if (tag.includes('nature') || tag.includes('eco') || tag.includes('green')) {
      scores.nature += 3
    } else if (tag.includes('city') || tag.includes('urban') || tag.includes('lifestyle')) {
      scores.urban += 3
    } else if (tag.includes('business') || tag.includes('startup') || tag.includes('entrepreneur')) {
      scores.business += 3
    } else if (tag.includes('art') || tag.includes('creative') || tag.includes('design')) {
      scores.abstract += 3
    }
  }

  return scores
}

// Análisis de sentimiento para categorización
function analyzeSentiment(text: string): VideoCategory {
  const positiveWords = ['amazing', 'awesome', 'great', 'fantastic', 'wonderful', 'excited', 'love']
  const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'disappointed']
  const calmWords = ['peaceful', 'calm', 'relax', 'meditation', 'zen']
  const energeticWords = ['energy', 'power', 'dynamic', 'fast', 'speed', 'action']

  const normalizedText = text.toLowerCase()
  
  let positiveScore = 0
  let negativeScore = 0
  let calmScore = 0
  let energeticScore = 0

  for (const word of positiveWords) {
    if (normalizedText.includes(word)) positiveScore++
  }
  for (const word of negativeWords) {
    if (normalizedText.includes(word)) negativeScore++
  }
  for (const word of calmWords) {
    if (normalizedText.includes(word)) calmScore++
  }
  for (const word of energeticWords) {
    if (normalizedText.includes(word)) energeticScore++
  }

  // Seleccionar categoría basada en sentimiento
  if (calmScore > 0) return 'nature'
  if (energeticScore > 0) return 'urban'
  if (positiveScore > negativeScore) return 'abstract'
  
  return 'abstract' // default
}

// Seleccionar video aleatorio de una categoría
function getRandomVideoFromCategory(category: VideoCategory): string {
  let videos = videoBank[category] || []
  
  // Si la categoría está vacía o es custom, cargar videos dinámicamente
  if (videos.length === 0 || category === 'custom') {
    videos = loadVideosFromCategory(category)
  }

  // Si aún no hay videos, usar abstract como fallback
  if (videos.length === 0) {
    logger.warn(`No hay videos en categoría ${category}, usando abstract`)
    videos = videoBank.abstract
  }

  // Seleccionar video aleatorio
  const randomIndex = Math.floor(Math.random() * videos.length)
  const selectedVideo = videos[randomIndex]

  // Verificar que el archivo existe
  if (fs.existsSync(selectedVideo) && !fs.existsSync(selectedVideo)) {
    logger.warn(`Video no encontrado: ${selectedVideo}, intentando con otro`)
    
    // Filtrar videos que existen
    const existingVideos = videos.filter(video => fs.existsSync(video))
    
    if (existingVideos.length > 0) {
      return existingVideos[Math.floor(Math.random() * existingVideos.length)]
    } else {
      // Último recurso: usar un video de otra categoría
      return findAnyExistingVideo()
    }
  }

  return selectedVideo
}

// Cargar videos de una categoría dinámicamente
function loadVideosFromCategory(category: VideoCategory): string[] {
  try {
    const categoryPath = `videos/${category}`
    const files = fs.readdirSync(categoryPath)
    
    const videoFiles = files
      .filter(file => file.match(/\.(mp4|mov|avi|mkv|webm)$/i))
      .map(file => path.join(categoryPath, file))

    // Actualizar el banco de videos
    videoBank[category] = videoFiles
    
    logger.info(`Cargados ${videoFiles.length} videos para categoría ${category}`)
    
    return videoFiles
  } catch (error) {
    logger.warn(`Error cargando videos de ${category}:`, error)
    return []
  }
}

// Encontrar cualquier video existente como último recurso
function findAnyExistingVideo(): string {
  for (const [category, videos] of Object.entries(videoBank)) {
    for (const video of videos) {
      if (fs.existsSync(video)) {
        logger.info(`Usando video de fallback de ${category}: ${video}`)
        return video
      }
    }
  }

  // Si llegamos aquí, no hay videos disponibles
  throw new Error('No hay videos de fondo disponibles')
}

// Obtener lista de todos los videos disponibles
export async function getAllAvailableVideos(): Promise<BackgroundVideo[]> {
  const allVideos: BackgroundVideo[] = []

  for (const category of Object.keys(videoBank) as VideoCategory[]) {
    const videos = loadVideosFromCategory(category)
    
    for (const videoPath of videos) {
      try {
        const stats = await fsPromises.stat(videoPath)
        const fileName = path.basename(videoPath)
        
        allVideos.push({
          name: fileName,
          url: `${process.env.PUBLIC_URL}/${videoPath}`,
          category,
          fileSize: `${(stats.size / (1024 * 1024)).toFixed(2)}MB`
        })
      } catch (error) {
        logger.warn(`Error obteniendo info de ${videoPath}:`, error)
      }
    }
  }

  return allVideos
}

// Obtener videos por categoría específica
export async function getVideosByCategory(category: VideoCategory): Promise<BackgroundVideo[]> {
  const videos = loadVideosFromCategory(category)
  const categoryVideos: BackgroundVideo[] = []

  for (const videoPath of videos) {
    try {
      const stats = await fsPromises.stat(videoPath)
      const fileName = path.basename(videoPath)
      
      categoryVideos.push({
        name: fileName,
        url: `${process.env.PUBLIC_URL}/${videoPath}`,
        category,
        fileSize: `${(stats.size / (1024 * 1024)).toFixed(2)}MB`
      })
    } catch (error) {
      logger.warn(`Error obteniendo info de ${videoPath}:`, error)
    }
  }

  return categoryVideos
}

// Función para sugerir videos basados en contenido
export function suggestVideosForContent(tweetText: string, count: number = 3): BackgroundVideo[] {
  const category = analyzeContentCategory(tweetText)
  const videos = loadVideosFromCategory(category)
  
  // Seleccionar videos aleatorios de la categoría
  const shuffled = [...videos].sort(() => 0.5 - Math.random())
  const selected = shuffled.slice(0, count)

  return selected.map(videoPath => ({
    name: path.basename(videoPath),
    url: `${process.env.PUBLIC_URL}/${videoPath}`,
    category,
    fileSize: 'Unknown' // Se calcularía en una implementación real
  }))
}

// Función para analizar y reportar estadísticas de uso
export function getUsageStatistics(): {
  totalVideos: number
  categoryCounts: Record<VideoCategory, number>
  mostUsedCategory: VideoCategory
  recommendations: string[]
} {
  const categoryCounts: Record<VideoCategory, number> = {
    tech: 0, nature: 0, urban: 0, business: 0, abstract: 0, custom: 0
  }

  let totalVideos = 0

  for (const [category, videos] of Object.entries(videoBank)) {
    const count = loadVideosFromCategory(category as VideoCategory).length
    categoryCounts[category as VideoCategory] = count
    totalVideos += count
  }

  // Encontrar categoría más poblada
  const mostUsedCategory = Object.entries(categoryCounts)
    .reduce((a, b) => categoryCounts[a[0] as VideoCategory] > categoryCounts[b[0] as VideoCategory] ? a : b)[0] as VideoCategory

  const recommendations = []
  
  if (categoryCounts.tech < 3) recommendations.push('Agregar más videos de tecnología')
  if (categoryCounts.nature < 3) recommendations.push('Agregar más videos de naturaleza')
  if (categoryCounts.business < 3) recommendations.push('Agregar más videos corporativos')
  if (totalVideos < 15) recommendations.push('Expandir la biblioteca de videos')

  return {
    totalVideos,
    categoryCounts,
    mostUsedCategory,
    recommendations
  }
}