// src/utils/canvas.ts - Utilidades para manejo de Canvas
import { createCanvas, loadImage, registerFont, CanvasRenderingContext2D } from 'canvas'
import fs from 'fs/promises'
import path from 'path'
import winston from 'winston'
import { 
  TweetData, 
  VideoOptions, 
  GlassmorphismConfig,
  TextRenderOptions,
  RenderContext
} from '../types'
import type { CanvasGradient } from 'canvas'

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/canvas.log' })
  ]
})

// Carga los iconos SVG una sola vez
let commentIcon: any, retweetIcon: any, heartIcon: any
let iconsLoaded = false
async function loadIcons() {
  if (!iconsLoaded) {
    [commentIcon, retweetIcon, heartIcon] = await Promise.all([
      loadImage('src/icons/comment.svg'),
      loadImage('src/icons/retweet.svg'),
      loadImage('src/icons/heart.svg')
    ])
    iconsLoaded = true
  }
}

// Generar overlay glassmorphism para videos
export async function generateGlassmorphismOverlay(
  tweetData: TweetData,
  options: VideoOptions,
  requestId: string
): Promise<string> {
  
  try {
    logger.info(`[${requestId}] Generando overlay glassmorphism`)

    const canvas = createCanvas(options.width, options.height)
    const ctx = canvas.getContext('2d')

    // Configuración del glassmorphism, usando opciones personalizadas si existen
    const glassConfig = getGlassmorphismConfig(
      tweetData.theme || 'dark',
      options.overlayOpacity,
      options.overlayBlur,
      options.overlayColor
    )

    // Limpiar canvas con transparencia
    ctx.clearRect(0, 0, options.width, options.height)

    // Dibujar contenido del tweet con glassmorphism
    await drawTweetOverlay(ctx, tweetData, options, glassConfig, requestId)

    // Guardar como PNG con transparencia
    const fileName = `overlay-${requestId}.png`
    const outputPath = path.join('temp', fileName)
    
    // Asegurar que existe el directorio temp
    await fs.mkdir('temp', { recursive: true })
    
    const buffer = canvas.toBuffer('image/png')
    await fs.writeFile(outputPath, buffer)

    logger.info(`[${requestId}] Overlay guardado: ${outputPath} (${buffer.length} bytes)`)

    return outputPath

  } catch (error: any) {
    logger.error(`[${requestId}] Error generando overlay:`, error)
    throw new Error(`Error generando overlay glassmorphism: ${error.message}`)
  }
}

function getGlassmorphismConfig(
  theme: 'light' | 'dark',
  overlayOpacity?: number,
  overlayBlur?: number,
  overlayColor?: string
): GlassmorphismConfig {
  // Forzar overlay oscuro siempre
  return {
    backgroundColor: overlayColor || 'rgba(0, 0, 0, 0.7)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    textColor: '#ffffff',
    secondaryTextColor: 'rgba(255, 255, 255, 0.7)',
    backdropBlur: overlayBlur ?? 12,
    borderRadius: 20,
    opacity: overlayOpacity ?? 0.9
  }
}

async function drawTweetOverlay(
  ctx: CanvasRenderingContext2D,
  data: TweetData,
  options: VideoOptions,
  config: GlassmorphismConfig,
  requestId: string
) {
  // --- Overlay con proporción mejorada basada en aspect ratio ---
  const isVertical = options.height / options.width > 1.2;
  const isFourFive = Math.abs(options.width / options.height - 0.8) < 0.05 || options.aspectRatio === '4:5';
  const isNineSixteen = options.aspectRatio === '9:16' || Math.abs(options.width / options.height - 9/16) < 0.05;
  const isThreeFour = options.aspectRatio === '3:4' || Math.abs(options.width / options.height - 0.75) < 0.05;
  const isOneOne = options.aspectRatio === '1:1' || Math.abs(options.width / options.height - 1) < 0.05;
  const PHI = 1.618;
  let overlayWidth, overlayHeight, overlayMaxWidth, overlayMaxHeight;
  
  // Ancho del overlay basado en aspect ratio
  if (isOneOne) {
    overlayWidth = options.width * 0.85; // Más ancho en 1:1
  } else if (isFourFive || isThreeFour) {
    overlayWidth = options.width * 0.8; // Moderado en ratios intermedios
  } else if (isNineSixteen || isVertical) {
    overlayWidth = options.width * 0.75; // Más estrecho en vertical
  } else {
    overlayWidth = options.width * 0.7; // Horizontal
  }
  
  // OverlayHeight depende de la proporción
  if (isVertical || isNineSixteen || isFourFive || isThreeFour) {
    overlayHeight = options.height * 0.6; // Reducido para mejor proporción
    if (overlayHeight / overlayWidth > PHI) {
      overlayHeight = overlayWidth * PHI;
    }
    overlayMaxWidth = overlayWidth;
    overlayMaxHeight = overlayHeight;
  } else {
    overlayMaxWidth = overlayWidth;
    overlayMaxHeight = options.height * 0.8; // Reducido del 98%
  }

  // Escalado proporcional base
  const baseWidth = 900;
  const widthScale = overlayMaxWidth / baseWidth;
  let scale = widthScale;
  let fontBoost = 1;
  // Ajuste de fuente según proporción
  if (isVertical || isNineSixteen) fontBoost = 1.35;
  if (options.height / options.width > 1.7 || isNineSixteen) fontBoost = 1.7;
  if (isFourFive) fontBoost *= 1.1;
  if (isThreeFour) fontBoost *= 1.05;
  if (isOneOne) fontBoost *= 0.95;
  // Padding: más lateral y superior en vertical, pero consistente entre izquierda y derecha
  const paddingX = (isVertical || isNineSixteen || isFourFive || isThreeFour) ? 40 * scale * fontBoost : 40 * scale * fontBoost;
  const paddingY = (isVertical || isNineSixteen || isFourFive || isThreeFour) ? 32 * scale * fontBoost : 32 * scale * fontBoost;
  const avatarSize = 80 * scale * fontBoost;
  const nameFont = (s: number) => `bold ${Math.round(32 * s)}px TwitterChirp-Bold, Arial, sans-serif`;
  const checkFont = (s: number) => `${Math.round(18 * s)}px Arial, sans-serif`;
  const userFont = (s: number) => `${Math.round(18 * s)}px TwitterChirp, Arial, sans-serif`;
  const statsFont = (s: number) => `${Math.round(16 * s)}px TwitterChirp, Arial, sans-serif`;
  const iconSize = 32 * scale * fontBoost;

  // --- Ajuste dinámico de fontSize/lineHeight mejorado ---
  // Inserta salto de línea después de cada punto y coma para mejorar la visualización automática de listas
  let tweetTextForWrap = data.text.replace(/;/g, ';\n');
  
  // Tamaño de fuente base dinámico según longitud del texto
  const textLength = data.text.length;
  let baseFontSize = 32 * scale * fontBoost;
  if (textLength > 200) baseFontSize *= 0.9; // Texto muy largo
  else if (textLength > 100) baseFontSize *= 0.95; // Texto largo
  else if (textLength < 50) baseFontSize *= 1.1; // Texto corto
  
  let tweetFontSize = baseFontSize;
  let tweetFont = `${Math.round(tweetFontSize)}px TwitterChirp, Arial, sans-serif`;
  let lineHeight = tweetFontSize * 1.2; // Ratio consistente
  let textLines: string[] = [];
  let tweetTextHeight = 0;
  let headerHeight = avatarSize + 18 + 44 * scale * fontBoost + 54 * scale * fontBoost;
  let statsHeight = 60 * scale * fontBoost;
  let minHeight = 0;
  let containerHeight = 0;
  let textMaxWidth = overlayMaxWidth - (paddingX * 2);
  let availableTextHeight = 0;
  
  // Ajustar fontSize/lineHeight hasta que el texto quepa en el espacio disponible
  for (let shrink = 0; shrink < 30; shrink++) {
    ctx.font = `${Math.round(tweetFontSize)}px TwitterChirp, Arial, sans-serif`;
    textLines = wrapText(ctx, tweetTextForWrap, textMaxWidth, lineHeight);
    tweetTextHeight = textLines.length * lineHeight;
    minHeight = headerHeight + tweetTextHeight + statsHeight + (paddingY * 2);
    containerHeight = Math.min(minHeight, overlayMaxHeight);
    availableTextHeight = containerHeight - headerHeight - statsHeight - (paddingY * 2);
    if (tweetTextHeight <= availableTextHeight || tweetFontSize < 14) break; // Límite mínimo de fuente
    // Si no cabe, reduce fontSize y lineHeight proportionalmente
    tweetFontSize *= 0.94;
    lineHeight = tweetFontSize * 1.2;
  }
  tweetFont = `${Math.round(tweetFontSize)}px TwitterChirp, Arial, sans-serif`;

  // El ancho mínimo necesario - mejor cálculo con padding consistente
  ctx.font = nameFont(scale * fontBoost);
  const nameWidth = ctx.measureText(data.displayName).width;
  ctx.font = userFont(scale * fontBoost);
  const userWidth = ctx.measureText('@' + data.username).width;
  ctx.font = tweetFont;
  const tweetLineWidths = textLines.map(line => ctx.measureText(line).width);
  const tweetTextWidth = Math.max(...tweetLineWidths, 0);
  
  // Calcular ancho mínimo considerando avatar, textos y padding adecuado
  const avatarAndPadding = avatarSize + paddingX + 22; // avatar + padding inicial + spacing
  const nameUserWidth = Math.max(nameWidth, userWidth);
  const headerContentWidth = avatarAndPadding + nameUserWidth;
  const textContentWidth = tweetTextWidth;
  
  const minContentWidth = Math.max(headerContentWidth, textContentWidth, 320 * scale);
  let containerWidth = Math.min(minContentWidth + (paddingX * 2), overlayMaxWidth);

  // Recalcular textMaxWidth basado en el containerWidth final y reajustar líneas
  textMaxWidth = containerWidth - (paddingX * 2);
  ctx.font = tweetFont;
  textLines = wrapText(ctx, tweetTextForWrap, textMaxWidth, lineHeight);
  tweetTextHeight = textLines.length * lineHeight;
  
  // Recalcular altura del contenedor con las líneas finales
  minHeight = headerHeight + tweetTextHeight + statsHeight + (paddingY * 2);
  containerHeight = Math.min(minHeight, overlayMaxHeight);

  const centerX = options.width / 2;
  const centerY = options.height / 2;

  // Dibujar contenedor glassmorphism
  drawGlassmorphismContainer(ctx, centerX, centerY, containerWidth, containerHeight, config)

  const contentStartY = centerY - containerHeight / 2 + paddingY;

  // Cargar y dibujar avatar
  let avatarX = centerX - containerWidth / 2 + paddingX + avatarSize / 2;
  let avatarY = contentStartY + avatarSize / 2 + 10;

  try {
    let avatarPath = data.avatar;
    if (avatarPath && avatarPath.startsWith('/uploads/')) {
      avatarPath = path.join(process.cwd(), avatarPath.replace(/^\//, ''));
    }
    if (avatarPath) {
      const avatarImage = await loadImage(avatarPath)
      drawAvatar(ctx, avatarImage, avatarX, avatarY, avatarSize)
      logger.info(`[${requestId}] Avatar cargado en overlay`)
    } else {
      ctx.fillStyle = '#1DA1F2'
      ctx.beginPath()
      ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'white'
      ctx.font = 'bold 28px TwitterChirp-Bold, Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(data.displayName.charAt(0).toUpperCase(), avatarX, avatarY)
    }
  } catch (avatarError) {
    logger.warn(`[${requestId}] Error cargando avatar en overlay:`, avatarError)
    ctx.fillStyle = '#1DA1F2'
    ctx.beginPath()
    ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'white'
    ctx.font = 'bold 28px TwitterChirp-Bold, Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(data.displayName.charAt(0).toUpperCase(), avatarX, avatarY)
  }

  // Información del usuario
  const userInfoX = avatarX + avatarSize / 2 + 22;
  let currentY = contentStartY + 18;

  // Nombre de usuario
  ctx.fillStyle = config.textColor;
  ctx.font = nameFont(scale * fontBoost);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(data.displayName, userInfoX, currentY);

  // Checkmark de verificación
  if (data.verified) {
    const nameWidth2 = ctx.measureText(data.displayName).width;
    ctx.fillStyle = '#1DA1F2';
    ctx.font = checkFont(scale * fontBoost);
    ctx.fillText('✓', userInfoX + nameWidth2 + 10, currentY);
  }

  currentY += 44 * scale * fontBoost;

  // Username y timestamp
  ctx.fillStyle = config.secondaryTextColor;
  ctx.font = userFont(scale * fontBoost);
  ctx.fillText(`${data.username} · ${data.timestamp}`, userInfoX, currentY);

  currentY += 54 * scale * fontBoost;

  // Texto del tweet
  ctx.fillStyle = config.textColor;
  ctx.font = tweetFont;
  for (const line of textLines) {
    ctx.fillText(line, centerX - containerWidth / 2 + paddingX, currentY);
    currentY += lineHeight;
  }

  // --- Stats alineados a la izquierda con espaciado mejorado ---
  await loadIcons().catch(()=>{});
  const statsY = centerY + containerHeight / 2 - paddingY - 20; // Mejor posicionamiento
  let statsSpacing = Math.min(90 * scale * fontBoost, (containerWidth - (paddingX * 2)) / 4); // Espaciado adaptativo
  const stats = [];
  if (typeof data.replies === 'number') stats.push({ icon: commentIcon, emoji: '💬', value: data.replies });
  if (typeof data.retweets === 'number') stats.push({ icon: retweetIcon, emoji: '🔄', value: data.retweets });
  if (typeof data.likes === 'number') stats.push({ icon: heartIcon, emoji: '❤️', value: data.likes });
  if (typeof data.views === 'number') stats.push({ icon: null, emoji: '👁️', value: data.views, label: 'Vistas' });
  
  // Ajustar espaciado si hay muchos stats
  if (stats.length > 3) {
    statsSpacing = Math.min(statsSpacing, (containerWidth - (paddingX * 2)) / stats.length);
  }
  
  const statsStartX = centerX - containerWidth / 2 + paddingX;
  ctx.fillStyle = config.secondaryTextColor;
  ctx.font = statsFont(scale * fontBoost);
  stats.forEach((stat, index) => {
    const x = statsStartX + index * statsSpacing;
    if (typeof stat.value === 'number') {
      if (stat.icon) {
        try {
          ctx.drawImage(stat.icon, x, statsY - iconSize/2, iconSize, iconSize);
        } catch {
          ctx.fillText(stat.emoji, x, statsY + 4);
        }
        ctx.fillText(stat.value.toLocaleString(), x + iconSize + 10, statsY + 4);
      } else {
        ctx.fillText(stat.emoji + ' ' + stat.value.toLocaleString(), x, statsY + 4);
      }
    }
  });
}

// Dibujar contenedor glassmorphism
export function drawGlassmorphismContainer(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  config: GlassmorphismConfig
) {
  const cornerRadius = config.borderRadius || 20

  // Efecto de sombra/glow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
  ctx.shadowBlur = 15
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 8

  // Dibujar contenedor redondeado
  ctx.beginPath()
  drawRoundedRect(ctx, x - width/2, y - height/2, width, height, cornerRadius)
  
  // Rellenar con color glassmorphism
  ctx.fillStyle = config.backgroundColor
  ctx.fill()
  
  // Borde
  ctx.strokeStyle = config.borderColor
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Reset shadow
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0

  // Agregar highlight sutil en la parte superior
  const highlightGradient = ctx.createLinearGradient(x - width/2, y - height/2, x - width/2, y - height/2 + 40)
  highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)')
  highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
  
  ctx.fillStyle = highlightGradient
  ctx.beginPath()
  drawRoundedRect(ctx, x - width/2, y - height/2, width, 40, cornerRadius, true) // Solo top corners
  ctx.fill()
}

// Dibujar rectángulo redondeado
export function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  topOnly: boolean = false
) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  
  // Top right corner
  ctx.arcTo(x + width, y, x + width, y + height, radius)
  
  if (topOnly) {
    // Si solo queremos esquinas superiores redondeadas
    ctx.lineTo(x + width, y + height)
    ctx.lineTo(x, y + height)
    ctx.lineTo(x, y + radius)
  } else {
    // Bottom right corner
    ctx.arcTo(x + width, y + height, x, y + height, radius)
    // Bottom left corner
    ctx.arcTo(x, y + height, x, y, radius)
  }
  
  // Top left corner
  ctx.arcTo(x, y, x + width, y, radius)
  ctx.closePath()
}

// Función mejorada para wrap text
export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  lineHeight: number
): string[] {
  // Primero, dividir el texto en líneas explícitas por salto de línea
  const rawLines = text.split('\n');
  const lines: string[] = [];

  for (const rawLine of rawLines) {
    const words = rawLine.split(' ');
    let currentLine = '';
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && currentLine !== '') {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
  }
  return lines;
}

// Función para renderizar texto con efectos
export function renderTextWithEffects(
  ctx: CanvasRenderingContext2D,
  options: TextRenderOptions
) {
  ctx.save()

  // Configurar fuente y alineación
  if (options.font) ctx.font = options.font
  if (options.color) ctx.fillStyle = options.color
  if (options.align) ctx.textAlign = options.align

  // Aplicar sombra si está especificada
  if (options.shadow) {
    ctx.shadowColor = options.shadow.color
    ctx.shadowBlur = options.shadow.blur
    ctx.shadowOffsetX = options.shadow.offsetX
    ctx.shadowOffsetY = options.shadow.offsetY
  }

  // Renderizar texto con wrap si es necesario
  if (options.maxWidth && options.lineHeight) {
    const lines = wrapText(ctx, options.text, options.maxWidth, options.lineHeight)
    lines.forEach((line, index) => {
      ctx.fillText(line, options.x, options.y + (index * options.lineHeight!))
    })
  } else {
    ctx.fillText(options.text, options.x, options.y)
  }

  ctx.restore()
}

// Función para crear gradiente dinámico
export function createDynamicGradient(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  colors: string[],
  type: 'linear' | 'radial' = 'linear'
): CanvasGradient {
  
  let gradient: CanvasGradient

  if (type === 'radial') {
    gradient = ctx.createRadialGradient(
      width / 2, height / 2, 0,
      width / 2, height / 2, Math.max(width, height) / 2
    )
  } else {
    gradient = ctx.createLinearGradient(0, 0, width, height)
  }

  const step = 1 / (colors.length - 1)
  colors.forEach((color, index) => {
    gradient.addColorStop(index * step, color)
  })

  return gradient
}

// Función para aplicar filtros de imagen
export function applyImageFilter(
  ctx: CanvasRenderingContext2D,
  filter: 'blur' | 'brightness' | 'contrast' | 'saturate',
  value: number
) {
  // En la función applyImageFilter, elimina o comenta las líneas que asignan ctx.filter, ya que no existe en node-canvas.
}

// Función para obtener color dominante de una imagen
export async function getDominantColor(imagePath: string): Promise<string> {
  try {
    const image = await loadImage(imagePath)
    const canvas = createCanvas(1, 1)
    const ctx = canvas.getContext('2d')
    
    // Dibujar imagen escalada a 1x1 pixel
    ctx.drawImage(image, 0, 0, 1, 1)
    
    // Obtener datos del pixel
    const imageData = ctx.getImageData(0, 0, 1, 1)
    const [r, g, b] = imageData.data
    
    return `rgb(${r}, ${g}, ${b})`
  } catch (error) {
    logger.warn('Error obteniendo color dominante:', error)
    return '#1DA1F2' // Color por defecto
  }
}

// Función para crear patrón de puntos
export function createDotPattern(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  dotSize: number = 2,
  spacing: number = 20,
  opacity: number = 0.1
) {
  ctx.save()
  ctx.globalAlpha = opacity
  ctx.fillStyle = 'white'

  for (let x = 0; x < width; x += spacing) {
    for (let y = 0; y < height; y += spacing) {
      ctx.beginPath()
      ctx.arc(x, y, dotSize, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  ctx.restore()
}

// Función para validar dimensiones de canvas
export function validateCanvasDimensions(width: number, height: number): {
  isValid: boolean
  adjustedWidth?: number
  adjustedHeight?: number
  warnings: string[]
} {
  const warnings: string[] = []
  let adjustedWidth = width
  let adjustedHeight = height
  let isValid = true

  // Límites razonables para canvas
  const MAX_DIMENSION = 4096
  const MIN_DIMENSION = 100

  if (width > MAX_DIMENSION) {
    adjustedWidth = MAX_DIMENSION
    warnings.push(`Ancho ajustado de ${width} a ${MAX_DIMENSION}`)
  }

  if (height > MAX_DIMENSION) {
    adjustedHeight = MAX_DIMENSION
    warnings.push(`Altura ajustada de ${height} a ${MAX_DIMENSION}`)
  }

  if (width < MIN_DIMENSION) {
    adjustedWidth = MIN_DIMENSION
    warnings.push(`Ancho ajustado de ${width} a ${MIN_DIMENSION}`)
    isValid = false
  }

  if (height < MIN_DIMENSION) {
    adjustedHeight = MIN_DIMENSION
    warnings.push(`Altura ajustada de ${height} a ${MIN_DIMENSION}`)
    isValid = false
  }

  // Verificar proporciones extremas
  const aspectRatio = adjustedWidth / adjustedHeight
  if (aspectRatio > 10 || aspectRatio < 0.1) {
    warnings.push('Proporción de aspecto extrema detectada')
  }

  return {
    isValid: isValid && warnings.length === 0,
    adjustedWidth: adjustedWidth !== width ? adjustedWidth : undefined,
    adjustedHeight: adjustedHeight !== height ? adjustedHeight : undefined,
    warnings
  }
}

// --- NUEVO: Recorte cuadrado y centrado del avatar ---
async function drawAvatar(ctx: CanvasRenderingContext2D, avatarImg: any, x: number, y: number, size: number) {
  // Recorta la región central cuadrada del avatar
  const sourceSize = Math.min(avatarImg.width, avatarImg.height);
  const sourceX = (avatarImg.width - sourceSize) / 2;
  const sourceY = (avatarImg.height - sourceSize) / 2;
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, size / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(
    avatarImg,
    sourceX, sourceY, sourceSize, sourceSize, // recorte origen
    x - size / 2, y - size / 2, size, size   // destino en canvas
  );
  ctx.restore();
}