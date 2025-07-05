"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateGlassmorphismOverlay = generateGlassmorphismOverlay;
exports.drawGlassmorphismContainer = drawGlassmorphismContainer;
exports.drawRoundedRect = drawRoundedRect;
exports.wrapText = wrapText;
exports.renderTextWithEffects = renderTextWithEffects;
exports.createDynamicGradient = createDynamicGradient;
exports.applyImageFilter = applyImageFilter;
exports.getDominantColor = getDominantColor;
exports.createDotPattern = createDotPattern;
exports.validateCanvasDimensions = validateCanvasDimensions;
const canvas_1 = require("canvas");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const winston_1 = __importDefault(require("winston"));
const logger = winston_1.default.createLogger({
    level: 'info',
    format: winston_1.default.format.json(),
    transports: [
        new winston_1.default.transports.File({ filename: 'logs/canvas.log' })
    ]
});
let commentIcon, retweetIcon, heartIcon;
let iconsLoaded = false;
async function loadIcons() {
    if (!iconsLoaded) {
        [commentIcon, retweetIcon, heartIcon] = await Promise.all([
            (0, canvas_1.loadImage)('src/icons/comment.svg'),
            (0, canvas_1.loadImage)('src/icons/retweet.svg'),
            (0, canvas_1.loadImage)('src/icons/heart.svg')
        ]);
        iconsLoaded = true;
    }
}
async function generateGlassmorphismOverlay(tweetData, options, requestId) {
    try {
        logger.info(`[${requestId}] Generando overlay glassmorphism`);
        const canvas = (0, canvas_1.createCanvas)(options.width, options.height);
        const ctx = canvas.getContext('2d');
        const glassConfig = getGlassmorphismConfig(tweetData.theme || 'dark', options.overlayOpacity, options.overlayBlur, options.overlayColor);
        ctx.clearRect(0, 0, options.width, options.height);
        await drawTweetOverlay(ctx, tweetData, options, glassConfig, requestId);
        const fileName = `overlay-${requestId}.png`;
        const outputPath = path_1.default.join('temp', fileName);
        await promises_1.default.mkdir('temp', { recursive: true });
        const buffer = canvas.toBuffer('image/png');
        await promises_1.default.writeFile(outputPath, buffer);
        logger.info(`[${requestId}] Overlay guardado: ${outputPath} (${buffer.length} bytes)`);
        return outputPath;
    }
    catch (error) {
        logger.error(`[${requestId}] Error generando overlay:`, error);
        throw new Error(`Error generando overlay glassmorphism: ${error.message}`);
    }
}
function getGlassmorphismConfig(theme, overlayOpacity, overlayBlur, overlayColor) {
    return {
        backgroundColor: overlayColor || 'rgba(0, 0, 0, 0.7)',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        textColor: '#ffffff',
        secondaryTextColor: 'rgba(255, 255, 255, 0.7)',
        backdropBlur: overlayBlur ?? 12,
        borderRadius: 20,
        opacity: overlayOpacity ?? 0.9
    };
}
async function drawTweetOverlay(ctx, data, options, config, requestId) {
    const isVertical = options.height / options.width > 1.2;
    const isFourFive = Math.abs(options.width / options.height - 0.8) < 0.05 || options.aspectRatio === '4:5';
    const isNineSixteen = options.aspectRatio === '9:16' || Math.abs(options.width / options.height - 9 / 16) < 0.05;
    const isThreeFour = options.aspectRatio === '3:4' || Math.abs(options.width / options.height - 0.75) < 0.05;
    const isOneOne = options.aspectRatio === '1:1' || Math.abs(options.width / options.height - 1) < 0.05;
    const PHI = 1.618;
    let overlayWidth, overlayHeight, overlayMaxWidth, overlayMaxHeight;
    if (isOneOne) {
        overlayWidth = options.width * 0.85;
    }
    else if (isFourFive || isThreeFour) {
        overlayWidth = options.width * 0.8;
    }
    else if (isNineSixteen || isVertical) {
        overlayWidth = options.width * 0.75;
    }
    else {
        overlayWidth = options.width * 0.7;
    }
    if (isVertical || isNineSixteen || isFourFive || isThreeFour) {
        overlayHeight = options.height * 0.6;
        if (overlayHeight / overlayWidth > PHI) {
            overlayHeight = overlayWidth * PHI;
        }
        overlayMaxWidth = overlayWidth;
        overlayMaxHeight = overlayHeight;
    }
    else {
        overlayMaxWidth = overlayWidth;
        overlayMaxHeight = options.height * 0.8;
    }
    const baseWidth = 900;
    const widthScale = overlayMaxWidth / baseWidth;
    let scale = widthScale;
    let fontBoost = 1;
    if (isVertical || isNineSixteen)
        fontBoost = 1.35;
    if (options.height / options.width > 1.7 || isNineSixteen)
        fontBoost = 1.7;
    if (isFourFive)
        fontBoost *= 1.1;
    if (isThreeFour)
        fontBoost *= 1.05;
    if (isOneOne)
        fontBoost *= 0.95;
    const paddingX = (isVertical || isNineSixteen || isFourFive || isThreeFour) ? 40 * scale * fontBoost : 40 * scale * fontBoost;
    const paddingY = (isVertical || isNineSixteen || isFourFive || isThreeFour) ? 32 * scale * fontBoost : 32 * scale * fontBoost;
    const avatarSize = 80 * scale * fontBoost;
    const nameFont = (s) => `bold ${Math.round(32 * s)}px TwitterChirp-Bold, Arial, sans-serif`;
    const checkFont = (s) => `${Math.round(18 * s)}px Arial, sans-serif`;
    const userFont = (s) => `${Math.round(18 * s)}px TwitterChirp, Arial, sans-serif`;
    const statsFont = (s) => `${Math.round(16 * s)}px TwitterChirp, Arial, sans-serif`;
    const iconSize = 32 * scale * fontBoost;
    let tweetTextForWrap = data.text.replace(/;/g, ';\n');
    const textLength = data.text.length;
    let baseFontSize = 32 * scale * fontBoost;
    if (textLength > 200)
        baseFontSize *= 0.9;
    else if (textLength > 100)
        baseFontSize *= 0.95;
    else if (textLength < 50)
        baseFontSize *= 1.1;
    let tweetFontSize = baseFontSize;
    let tweetFont = `${Math.round(tweetFontSize)}px TwitterChirp, Arial, sans-serif`;
    let lineHeight = tweetFontSize * 1.2;
    let textLines = [];
    let tweetTextHeight = 0;
    let headerHeight = avatarSize + 18 + 44 * scale * fontBoost + 54 * scale * fontBoost;
    let statsHeight = 60 * scale * fontBoost;
    let minHeight = 0;
    let containerHeight = 0;
    let textMaxWidth = overlayMaxWidth - (paddingX * 2);
    let availableTextHeight = 0;
    for (let shrink = 0; shrink < 30; shrink++) {
        ctx.font = `${Math.round(tweetFontSize)}px TwitterChirp, Arial, sans-serif`;
        textLines = wrapText(ctx, tweetTextForWrap, textMaxWidth, lineHeight);
        tweetTextHeight = textLines.length * lineHeight;
        minHeight = headerHeight + tweetTextHeight + statsHeight + (paddingY * 2);
        containerHeight = Math.min(minHeight, overlayMaxHeight);
        availableTextHeight = containerHeight - headerHeight - statsHeight - (paddingY * 2);
        if (tweetTextHeight <= availableTextHeight || tweetFontSize < 14)
            break;
        tweetFontSize *= 0.94;
        lineHeight = tweetFontSize * 1.2;
    }
    tweetFont = `${Math.round(tweetFontSize)}px TwitterChirp, Arial, sans-serif`;
    ctx.font = nameFont(scale * fontBoost);
    const nameWidth = ctx.measureText(data.displayName).width;
    ctx.font = userFont(scale * fontBoost);
    const userWidth = ctx.measureText('@' + data.username).width;
    ctx.font = tweetFont;
    const tweetLineWidths = textLines.map(line => ctx.measureText(line).width);
    const tweetTextWidth = Math.max(...tweetLineWidths, 0);
    const avatarAndPadding = avatarSize + paddingX + 22;
    const nameUserWidth = Math.max(nameWidth, userWidth);
    const headerContentWidth = avatarAndPadding + nameUserWidth;
    const textContentWidth = tweetTextWidth;
    const minContentWidth = Math.max(headerContentWidth, textContentWidth, 320 * scale);
    let containerWidth = Math.min(minContentWidth + (paddingX * 2), overlayMaxWidth);
    textMaxWidth = containerWidth - (paddingX * 2);
    ctx.font = tweetFont;
    textLines = wrapText(ctx, tweetTextForWrap, textMaxWidth, lineHeight);
    tweetTextHeight = textLines.length * lineHeight;
    minHeight = headerHeight + tweetTextHeight + statsHeight + (paddingY * 2);
    containerHeight = Math.min(minHeight, overlayMaxHeight);
    const centerX = options.width / 2;
    const centerY = options.height / 2;
    drawGlassmorphismContainer(ctx, centerX, centerY, containerWidth, containerHeight, config);
    const contentStartY = centerY - containerHeight / 2 + paddingY;
    let avatarX = centerX - containerWidth / 2 + paddingX + avatarSize / 2;
    let avatarY = contentStartY + avatarSize / 2 + 10;
    try {
        let avatarPath = data.avatar;
        if (avatarPath && avatarPath.startsWith('/uploads/')) {
            avatarPath = path_1.default.join(process.cwd(), avatarPath.replace(/^\//, ''));
        }
        if (avatarPath) {
            const avatarImage = await (0, canvas_1.loadImage)(avatarPath);
            drawAvatar(ctx, avatarImage, avatarX, avatarY, avatarSize);
            logger.info(`[${requestId}] Avatar cargado en overlay`);
        }
        else {
            ctx.fillStyle = '#1DA1F2';
            ctx.beginPath();
            ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'white';
            ctx.font = 'bold 28px TwitterChirp-Bold, Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(data.displayName.charAt(0).toUpperCase(), avatarX, avatarY);
        }
    }
    catch (avatarError) {
        logger.warn(`[${requestId}] Error cargando avatar en overlay:`, avatarError);
        ctx.fillStyle = '#1DA1F2';
        ctx.beginPath();
        ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.font = 'bold 28px TwitterChirp-Bold, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(data.displayName.charAt(0).toUpperCase(), avatarX, avatarY);
    }
    const userInfoX = avatarX + avatarSize / 2 + 22;
    let currentY = contentStartY + 18;
    ctx.fillStyle = config.textColor;
    ctx.font = nameFont(scale * fontBoost);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(data.displayName, userInfoX, currentY);
    if (data.verified) {
        const nameWidth2 = ctx.measureText(data.displayName).width;
        ctx.fillStyle = '#1DA1F2';
        ctx.font = checkFont(scale * fontBoost);
        ctx.fillText('✓', userInfoX + nameWidth2 + 10, currentY);
    }
    currentY += 44 * scale * fontBoost;
    ctx.fillStyle = config.secondaryTextColor;
    ctx.font = userFont(scale * fontBoost);
    ctx.fillText(`${data.username} · ${data.timestamp}`, userInfoX, currentY);
    currentY += 54 * scale * fontBoost;
    ctx.fillStyle = config.textColor;
    ctx.font = tweetFont;
    for (const line of textLines) {
        ctx.fillText(line, centerX - containerWidth / 2 + paddingX, currentY);
        currentY += lineHeight;
    }
    await loadIcons().catch(() => { });
    const statsY = centerY + containerHeight / 2 - paddingY - 20;
    let statsSpacing = Math.min(90 * scale * fontBoost, (containerWidth - (paddingX * 2)) / 4);
    const stats = [];
    if (typeof data.replies === 'number')
        stats.push({ icon: commentIcon, emoji: '💬', value: data.replies });
    if (typeof data.retweets === 'number')
        stats.push({ icon: retweetIcon, emoji: '🔄', value: data.retweets });
    if (typeof data.likes === 'number')
        stats.push({ icon: heartIcon, emoji: '❤️', value: data.likes });
    if (typeof data.views === 'number')
        stats.push({ icon: null, emoji: '👁️', value: data.views, label: 'Vistas' });
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
                    ctx.drawImage(stat.icon, x, statsY - iconSize / 2, iconSize, iconSize);
                }
                catch {
                    ctx.fillText(stat.emoji, x, statsY + 4);
                }
                ctx.fillText(stat.value.toLocaleString(), x + iconSize + 10, statsY + 4);
            }
            else {
                ctx.fillText(stat.emoji + ' ' + stat.value.toLocaleString(), x, statsY + 4);
            }
        }
    });
}
function drawGlassmorphismContainer(ctx, x, y, width, height, config) {
    const cornerRadius = config.borderRadius || 20;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 8;
    ctx.beginPath();
    drawRoundedRect(ctx, x - width / 2, y - height / 2, width, height, cornerRadius);
    ctx.fillStyle = config.backgroundColor;
    ctx.fill();
    ctx.strokeStyle = config.borderColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    const highlightGradient = ctx.createLinearGradient(x - width / 2, y - height / 2, x - width / 2, y - height / 2 + 40);
    highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
    highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = highlightGradient;
    ctx.beginPath();
    drawRoundedRect(ctx, x - width / 2, y - height / 2, width, 40, cornerRadius, true);
    ctx.fill();
}
function drawRoundedRect(ctx, x, y, width, height, radius, topOnly = false) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    if (topOnly) {
        ctx.lineTo(x + width, y + height);
        ctx.lineTo(x, y + height);
        ctx.lineTo(x, y + radius);
    }
    else {
        ctx.arcTo(x + width, y + height, x, y + height, radius);
        ctx.arcTo(x, y + height, x, y, radius);
    }
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
}
function wrapText(ctx, text, maxWidth, lineHeight) {
    const rawLines = text.split('\n');
    const lines = [];
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
            }
            else {
                currentLine = testLine;
            }
        }
        if (currentLine) {
            lines.push(currentLine);
        }
    }
    return lines;
}
function renderTextWithEffects(ctx, options) {
    ctx.save();
    if (options.font)
        ctx.font = options.font;
    if (options.color)
        ctx.fillStyle = options.color;
    if (options.align)
        ctx.textAlign = options.align;
    if (options.shadow) {
        ctx.shadowColor = options.shadow.color;
        ctx.shadowBlur = options.shadow.blur;
        ctx.shadowOffsetX = options.shadow.offsetX;
        ctx.shadowOffsetY = options.shadow.offsetY;
    }
    if (options.maxWidth && options.lineHeight) {
        const lines = wrapText(ctx, options.text, options.maxWidth, options.lineHeight);
        lines.forEach((line, index) => {
            ctx.fillText(line, options.x, options.y + (index * options.lineHeight));
        });
    }
    else {
        ctx.fillText(options.text, options.x, options.y);
    }
    ctx.restore();
}
function createDynamicGradient(ctx, width, height, colors, type = 'linear') {
    let gradient;
    if (type === 'radial') {
        gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) / 2);
    }
    else {
        gradient = ctx.createLinearGradient(0, 0, width, height);
    }
    const step = 1 / (colors.length - 1);
    colors.forEach((color, index) => {
        gradient.addColorStop(index * step, color);
    });
    return gradient;
}
function applyImageFilter(ctx, filter, value) {
}
async function getDominantColor(imagePath) {
    try {
        const image = await (0, canvas_1.loadImage)(imagePath);
        const canvas = (0, canvas_1.createCanvas)(1, 1);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0, 1, 1);
        const imageData = ctx.getImageData(0, 0, 1, 1);
        const [r, g, b] = imageData.data;
        return `rgb(${r}, ${g}, ${b})`;
    }
    catch (error) {
        logger.warn('Error obteniendo color dominante:', error);
        return '#1DA1F2';
    }
}
function createDotPattern(ctx, width, height, dotSize = 2, spacing = 20, opacity = 0.1) {
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.fillStyle = 'white';
    for (let x = 0; x < width; x += spacing) {
        for (let y = 0; y < height; y += spacing) {
            ctx.beginPath();
            ctx.arc(x, y, dotSize, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.restore();
}
function validateCanvasDimensions(width, height) {
    const warnings = [];
    let adjustedWidth = width;
    let adjustedHeight = height;
    let isValid = true;
    const MAX_DIMENSION = 4096;
    const MIN_DIMENSION = 100;
    if (width > MAX_DIMENSION) {
        adjustedWidth = MAX_DIMENSION;
        warnings.push(`Ancho ajustado de ${width} a ${MAX_DIMENSION}`);
    }
    if (height > MAX_DIMENSION) {
        adjustedHeight = MAX_DIMENSION;
        warnings.push(`Altura ajustada de ${height} a ${MAX_DIMENSION}`);
    }
    if (width < MIN_DIMENSION) {
        adjustedWidth = MIN_DIMENSION;
        warnings.push(`Ancho ajustado de ${width} a ${MIN_DIMENSION}`);
        isValid = false;
    }
    if (height < MIN_DIMENSION) {
        adjustedHeight = MIN_DIMENSION;
        warnings.push(`Altura ajustada de ${height} a ${MIN_DIMENSION}`);
        isValid = false;
    }
    const aspectRatio = adjustedWidth / adjustedHeight;
    if (aspectRatio > 10 || aspectRatio < 0.1) {
        warnings.push('Proporción de aspecto extrema detectada');
    }
    return {
        isValid: isValid && warnings.length === 0,
        adjustedWidth: adjustedWidth !== width ? adjustedWidth : undefined,
        adjustedHeight: adjustedHeight !== height ? adjustedHeight : undefined,
        warnings
    };
}
async function drawAvatar(ctx, avatarImg, x, y, size) {
    const sourceSize = Math.min(avatarImg.width, avatarImg.height);
    const sourceX = (avatarImg.width - sourceSize) / 2;
    const sourceY = (avatarImg.height - sourceSize) / 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatarImg, sourceX, sourceY, sourceSize, sourceSize, x - size / 2, y - size / 2, size, size);
    ctx.restore();
}
//# sourceMappingURL=canvas.js.map