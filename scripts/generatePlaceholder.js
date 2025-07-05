// Script para generar imagen placeholder por defecto
const { createCanvas } = require('canvas')
const fs = require('fs')
const path = require('path')

function createPlaceholderImage() {
  // Crear canvas 1200x630 (proporción Twitter/LinkedIn)
  const canvas = createCanvas(1200, 630)
  const ctx = canvas.getContext('2d')

  // Fondo con gradiente azul elegante
  const gradient = ctx.createLinearGradient(0, 0, 1200, 630)
  gradient.addColorStop(0, '#1DA1F2')
  gradient.addColorStop(0.5, '#0d7cb5')
  gradient.addColorStop(1, '#0a5a8a')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 1200, 630)

  // Overlay sutil con glassmorphism
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
  ctx.fillRect(100, 100, 1000, 430)

  // Borde del contenedor
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
  ctx.lineWidth = 2
  ctx.strokeRect(100, 100, 1000, 430)

  // Texto principal
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 48px Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('Social Image Generator', 600, 260)

  // Subtítulo
  ctx.font = '24px Arial, sans-serif'
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
  ctx.fillText('Crea tu imagen o video personalizado', 600, 320)

  // Instrucciones
  ctx.font = '18px Arial, sans-serif'
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
  ctx.fillText('Completa el formulario y presiona "Generar" para comenzar', 600, 380)

  // Logo/Icono simple
  ctx.beginPath()
  ctx.arc(600, 180, 30, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
  ctx.fill()
  
  // Icono dentro del círculo
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 24px Arial, sans-serif'
  ctx.fillText('📱', 600, 180)

  return canvas
}

// Generar y guardar la imagen
const canvas = createPlaceholderImage()
const buffer = canvas.toBuffer('image/png')

// Asegurar que existen los directorios
const publicDir = path.join(__dirname, '..', 'client', 'public')
const outputDir = path.join(__dirname, '..', 'output')

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true })
}

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

// Guardar en public (para el frontend) y output (para la API)
const publicPath = path.join(publicDir, 'placeholder.png')
const outputPath = path.join(outputDir, 'placeholder.png')

fs.writeFileSync(publicPath, buffer)
fs.writeFileSync(outputPath, buffer)

console.log('✅ Imagen placeholder creada:')
console.log('  - Frontend:', publicPath)
console.log('  - API:', outputPath)
console.log('  - Tamaño:', Math.round(buffer.length / 1024), 'KB')