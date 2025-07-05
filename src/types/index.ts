// src/types/index.ts - Definiciones de tipos para el proyecto

import type { CanvasRenderingContext2D, CanvasGradient } from 'canvas'

export interface TweetData {
  username: string
  displayName: string
  text: string
  avatar?: string
  likes?: number
  retweets?: number
  replies?: number
  timestamp: string
  verified?: boolean
  theme?: 'light' | 'dark'
  views?: number
}

export interface VideoOptions {
  fps: number
  width: number
  height: number
  backgroundVideo?: string
  style: 'glassmorphism' | 'solid' | 'gradient'
  animation?: 'fade' | 'slide' | 'zoom' | 'none'
  quality?: 'low' | 'medium' | 'high' | 'ultra'
  overlayOpacity?: number
  overlayBlur?: number
  overlayColor?: string
  aspectRatio?: string
  backgroundPlaybackRate?: number
  duration?: number
}

export interface ImageOptions {
  width?: number
  height?: number
  format?: 'png' | 'jpg' | 'jpeg' | 'webp'
  quality?: number
  theme?: 'light' | 'dark'
  backgroundType?: 'white' | 'blue' | 'gradient' | 'video-frame'
  backgroundVideo?: string
  enableOverlay?: boolean
  aspectRatio?: string
}

export interface GlassmorphismConfig {
  backgroundColor: string
  borderColor: string
  textColor: string
  secondaryTextColor: string
  backdropBlur?: number
  borderRadius?: number
  opacity?: number
}

export interface BackgroundVideo {
  name: string
  url: string
  category: VideoCategory
  duration?: number
  resolution?: string
  fileSize?: string
}

export type VideoCategory = 'tech' | 'nature' | 'urban' | 'abstract' | 'business' | 'custom'

export interface GenerationResponse {
  success: boolean
  url?: string
  videoUrl?: string
  imageUrl?: string
  duration?: number
  size?: string
  format?: string
  error?: string
  details?: string
}

export interface UploadResponse {
  success: boolean
  videoPath?: string
  fileName?: string
  fileSize?: string
  duration?: number
  resolution?: string
  error?: string
  details?: string
  message?: string
}

export interface ApiError {
  error: string
  details?: string
  code?: string
  timestamp?: string
}

export interface HealthCheckResponse {
  status: 'OK' | 'ERROR'
  timestamp: string
  version: string
  environment: string
  uptime: number
  memory: {
    used: number
    total: number
    external: number
  }
  directories: Record<string, 'OK' | 'MISSING'>
  config: {
    maxVideoDuration: string
    defaultFPS: string
    uploadMaxSize: string
    rateLimitMax: string
  }
}

export interface FFmpegOptions {
  inputPath: string
  outputPath: string
  width: number
  height: number
  fps: number
  duration: number
  quality: 'low' | 'medium' | 'high' | 'ultra'
  enableGPU?: boolean
  preset?: 'ultrafast' | 'fast' | 'medium' | 'slow' | 'veryslow'
}

export interface CanvasDrawOptions {
  width: number
  height: number
  backgroundColor?: string
  fontFamily?: string
  fontSize?: number
  textColor?: string
  padding?: number
}

export interface AnimationConfig {
  type: 'fade' | 'slide' | 'zoom' | 'none'
  duration: number
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'
  delay?: number
}

export interface VideoProcessingProgress {
  stage: 'preparing' | 'generating-overlay' | 'processing-video' | 'finalizing' | 'complete' | 'error'
  percentage: number
  message: string
  timeElapsed?: number
  estimatedTimeRemaining?: number
}

export interface SystemMetrics {
  cpuUsage: number
  memoryUsage: number
  diskUsage: number
  activeJobs: number
  queueLength: number
  timestamp: string
}

export interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  timestamp: string
  service: string
  requestId?: string
  userId?: string
  metadata?: Record<string, any>
}

export interface RateLimitInfo {
  limit: number
  remaining: number
  resetTime: number
  windowMs: number
}

// Extensiones de Express para TypeScript
declare global {
  namespace Express {
    interface Request {
      startTime?: number
      requestId?: string
      rateLimitInfo?: RateLimitInfo
    }
  }
}

// Configuración del servidor
export interface ServerConfig {
  port: number
  nodeEnv: string
  publicUrl: string
  frontendUrl: string
  allowedOrigins: string[]
  uploadMaxSize: number
  maxOutputFiles: number
  cleanupTempFiles: boolean
  cleanupIntervalHours: number
  defaultVideoDuration: number
  defaultFPS: number
  maxVideoDuration: number
  videoQuality: string
  enableHardwareAcceleration: boolean
  rateLimitWindowMs: number
  rateLimitMaxRequests: number
  enableCors: boolean
  trustProxy: boolean
  logLevel: string
  logMaxFiles: number
  logMaxSize: string
}

// Tipos para Canvas y renderizado
export interface RenderContext {
  canvas: any
  ctx: CanvasRenderingContext2D
  width: number
  height: number
}

export interface TextRenderOptions {
  text: string
  x: number
  y: number
  maxWidth?: number
  lineHeight?: number
  align?: 'left' | 'center' | 'right'
  font?: string
  color?: string
  shadow?: {
    color: string
    blur: number
    offsetX: number
    offsetY: number
  }
}

export interface ImageAsset {
  path: string
  width: number
  height: number
  format: string
  cached?: boolean
}

// Utilidades para validación
export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings?: string[]
}

export interface FileValidationOptions {
  maxSize: number
  allowedFormats: string[]
  minDuration?: number
  maxDuration?: number
  minResolution?: { width: number; height: number }
  maxResolution?: { width: number; height: number }
}

// Tipos para analytics (opcional)
export interface UsageAnalytics {
  totalRequests: number
  successfulGenerations: number
  failedGenerations: number
  averageProcessingTime: number
  popularStyles: Record<string, number>
  popularCategories: Record<VideoCategory, number>
  lastUpdated: string
}

// Configuración de temas
export interface ThemeConfig {
  name: string
  colors: {
    primary: string
    secondary: string
    background: string
    text: string
    accent: string
  }
  glassmorphism: GlassmorphismConfig
  fonts: {
    primary: string
    secondary: string
    weights: number[]
  }
}

// Presets predefinidos
export interface VideoPreset {
  name: string
  description: string
  options: VideoOptions
  theme: ThemeConfig
  backgroundCategory: VideoCategory
}

export const DEFAULT_VIDEO_OPTIONS: VideoOptions = {
  duration: 10,
  fps: 30,
  width: 1080,
  height: 1920,
  style: 'glassmorphism',
  animation: 'fade',
  quality: 'high' // Mejorado de 'medium' a 'high'
}

export const DEFAULT_IMAGE_OPTIONS: ImageOptions = {
  width: 1200,
  height: 630,
  format: 'png',
  quality: 85,
  theme: 'dark',
  backgroundType: 'blue',
  enableOverlay: true
}

export const DEFAULT_GLASSMORPHISM_CONFIG: GlassmorphismConfig = {
  backgroundColor: 'rgba(255, 255, 255, 0.15)',
  borderColor: 'rgba(255, 255, 255, 0.25)',
  textColor: '#ffffff',
  secondaryTextColor: 'rgba(255, 255, 255, 0.7)',
  backdropBlur: 10,
  borderRadius: 20,
  opacity: 0.9
}

// Funciones de utilidad para tipos
export function isValidTweetData(data: any): data is TweetData {
  return (
    typeof data === 'object' &&
    typeof data.username === 'string' &&
    typeof data.displayName === 'string' &&
    typeof data.text === 'string' &&
    typeof data.timestamp === 'string' &&
    (data.likes === undefined || typeof data.likes === 'number') &&
    (data.retweets === undefined || typeof data.retweets === 'number') &&
    (data.replies === undefined || typeof data.replies === 'number')
  )
}

export function isValidVideoOptions(options: any): options is VideoOptions {
  return (
    typeof options === 'object' &&
    typeof options.duration === 'number' &&
    typeof options.fps === 'number' &&
    typeof options.width === 'number' &&
    typeof options.height === 'number' &&
    ['glassmorphism', 'solid', 'gradient'].includes(options.style)
  )
}