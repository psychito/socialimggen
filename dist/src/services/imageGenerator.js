"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSocialImage = generateSocialImage;
exports.generateImageWithTemplate = generateImageWithTemplate;
exports.generateCustomSizeImage = generateCustomSizeImage;
exports.generateMultipleFormats = generateMultipleFormats;
exports.processAvatarImage = processAvatarImage;
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const canvas_1 = require("canvas");
const winston_1 = __importDefault(require("winston"));
const types_1 = require("../types");
const canvas_2 = require("../utils/canvas");
const child_process_1 = require("child_process");
const logger = winston_1.default.createLogger({
    level: 'info',
    format: winston_1.default.format.json(),
    transports: [
        new winston_1.default.transports.File({ filename: 'logs/image-generator.log' })
    ]
});
async function initializeFonts() {
    try {
        const fontsDir = 'fonts';
        const fontFiles = await promises_1.default.readdir(fontsDir).catch(() => []);
        for (const fontFile of fontFiles) {
            if (fontFile.endsWith('.otf') || fontFile.endsWith('.ttf')) {
                try {
                    const fontPath = path_1.default.join(fontsDir, fontFile);
                    const fontFamily = fontFile.includes('Bold') ? 'TwitterChirp-Bold' : 'TwitterChirp';
                    const weight = fontFile.includes('Bold') ? 'bold' : 'normal';
                    (0, canvas_1.registerFont)(fontPath, { family: fontFamily, weight });
                    logger.info(`Fuente registrada: ${fontFamily} (${weight})`);
                }
                catch (fontError) {
                    logger.warn(`Error registrando fuente ${fontFile}:`, fontError);
                }
            }
        }
    }
    catch (error) {
        logger.warn('Error inicializando fuentes, usando fuentes del sistema:', error);
    }
}
initializeFonts();
let commentIcon, retweetIcon, heartIcon, statsIcon;
let iconsLoaded = false;
async function loadIcons() {
    if (!iconsLoaded) {
        [commentIcon, retweetIcon, heartIcon, statsIcon] = await Promise.all([
            (0, canvas_1.loadImage)('src/icons/comment.svg'),
            (0, canvas_1.loadImage)('src/icons/retweet.svg'),
            (0, canvas_1.loadImage)('src/icons/heart.svg'),
            (0, canvas_1.loadImage)('src/icons/stats.svg')
        ]);
        iconsLoaded = true;
    }
}
async function extractFrameFromVideo(videoPath, width, height, requestId) {
    const outputPath = `temp/frame-bg-${requestId}.png`;
    try {
        await promises_1.default.mkdir('temp', { recursive: true });
        await promises_1.default.access(videoPath);
        const command = `ffmpeg -y -i "${videoPath}" -vf "scale=${width}:${height}:force_original_aspect_ratio=decrease" -vframes 1 "${outputPath}"`;
        logger.info(`[${requestId}] Ejecutando comando FFmpeg: ${command}`);
        (0, child_process_1.execSync)(command, {
            stdio: 'pipe'
        });
        const stats = await promises_1.default.stat(outputPath);
        if (stats.size === 0) {
            throw new Error('El archivo de frame generado está vacío');
        }
        logger.info(`[${requestId}] Frame extraído exitosamente: ${outputPath} (${stats.size} bytes)`);
        return outputPath;
    }
    catch (error) {
        logger.error(`[${requestId}] Error extrayendo frame de video: ${error.message}`);
        logger.error(`[${requestId}] Video path: ${videoPath}`);
        throw error;
    }
}
async function generateSocialImage(tweetData, options, requestId) {
    const startTime = Date.now();
    let width = options.width || 1200;
    let height = options.height || 630;
    if (options.aspectRatio && typeof options.aspectRatio === 'string' && options.aspectRatio.includes(':')) {
        const [w, h] = options.aspectRatio.split(':').map(Number);
        if (w > 0 && h > 0) {
            width = options.width || 1200;
            height = Math.round(width * h / w);
        }
    }
    try {
        logger.info(`[${requestId}] Iniciando generación de imagen`, {
            username: tweetData.username,
            dimensions: `${width}x${height}`,
            format: options.format,
            theme: options.theme
        });
        const canvas = (0, canvas_1.createCanvas)(width, height);
        const ctx = canvas.getContext('2d');
        let glassConfig = getGlassmorphismConfig(tweetData.theme || options.theme || 'dark');
        if ((options.backgroundType === 'blue' || options.backgroundType === 'gradient') && !options.enableOverlay) {
            glassConfig = {
                ...glassConfig,
                textColor: '#fff',
                secondaryTextColor: 'rgba(255,255,255,0.7)'
            };
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        await drawBackground(ctx, canvas.width, canvas.height, options.backgroundType || 'blue', options.backgroundVideo, requestId);
        if (options.enableOverlay) {
            await drawTweetContentWithOverlay(ctx, tweetData, canvas.width, canvas.height, glassConfig, requestId);
        }
        else {
            await drawTweetContentDirect(ctx, tweetData, canvas.width, canvas.height, glassConfig, requestId);
        }
        const outputPath = await saveImage(canvas, options, requestId);
        const fileName = path_1.default.basename(outputPath);
        const publicUrl = `${process.env.PUBLIC_URL}/output/${fileName}`;
        const processingTime = Date.now() - startTime;
        logger.info(`[${requestId}] Imagen generada exitosamente`, {
            outputPath,
            processingTime: `${processingTime}ms`
        });
        return {
            success: true,
            imageUrl: publicUrl
        };
    }
    catch (error) {
        const processingTime = Date.now() - startTime;
        logger.error(`[${requestId}] Error generando imagen después de ${processingTime}ms`, {
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
}
function getGlassmorphismConfig(theme) {
    if (theme === 'light') {
        return {
            backgroundColor: 'rgba(255, 255, 255, 0.25)',
            borderColor: 'rgba(255, 255, 255, 0.35)',
            textColor: '#000000',
            secondaryTextColor: '#657786',
            backdropBlur: 15,
            borderRadius: 24,
            opacity: 0.95
        };
    }
    return {
        ...types_1.DEFAULT_GLASSMORPHISM_CONFIG,
        backgroundColor: 'rgba(0, 0, 0, 0.25)',
        borderColor: 'rgba(255, 255, 255, 0.15)',
        textColor: '#ffffff',
        secondaryTextColor: 'rgba(255, 255, 255, 0.7)'
    };
}
async function drawBackground(ctx, width, height, backgroundType = 'blue', backgroundVideo, requestId) {
    switch (backgroundType) {
        case 'white':
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
            break;
        case 'blue':
            const blueGradient = ctx.createLinearGradient(0, 0, width, height);
            blueGradient.addColorStop(0, '#1DA1F2');
            blueGradient.addColorStop(0.5, '#0d7cb5');
            blueGradient.addColorStop(1, '#0a5a8a');
            ctx.fillStyle = blueGradient;
            ctx.fillRect(0, 0, width, height);
            break;
        case 'gradient':
            const gradient = ctx.createLinearGradient(0, 0, width, height);
            gradient.addColorStop(0, '#667eea');
            gradient.addColorStop(0.5, '#764ba2');
            gradient.addColorStop(1, '#f093fb');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
            break;
        case 'video-frame':
            if (backgroundVideo && requestId) {
                try {
                    let bgPath = backgroundVideo;
                    if (bgPath.startsWith('/videos/')) {
                        const pathModule = require('path');
                        bgPath = pathModule.join(process.cwd(), bgPath.replace(/^\//, ''));
                    }
                    if (bgPath.match(/\.(mp4|mov|avi|webm|mkv)$/i)) {
                        logger.info(`[${requestId}] Extrayendo frame de video: ${bgPath}`);
                        bgPath = await extractFrameFromVideo(bgPath, width, height, requestId);
                    }
                    const img = await (0, canvas_1.loadImage)(bgPath);
                    const scale = Math.max(width / img.width, height / img.height);
                    const scaledWidth = img.width * scale;
                    const scaledHeight = img.height * scale;
                    const x = (width - scaledWidth) / 2;
                    const y = (height - scaledHeight) / 2;
                    ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
                    return;
                }
                catch (e) {
                    console.warn('No se pudo cargar el frame del video, usando fondo azul', e);
                    const fallbackGradient = ctx.createLinearGradient(0, 0, width, height);
                    fallbackGradient.addColorStop(0, '#1DA1F2');
                    fallbackGradient.addColorStop(0.5, '#0d7cb5');
                    fallbackGradient.addColorStop(1, '#0a5a8a');
                    ctx.fillStyle = fallbackGradient;
                    ctx.fillRect(0, 0, width, height);
                }
            }
            break;
        default:
            const defaultGradient = ctx.createLinearGradient(0, 0, width, height);
            defaultGradient.addColorStop(0, '#1DA1F2');
            defaultGradient.addColorStop(0.5, '#0d7cb5');
            defaultGradient.addColorStop(1, '#0a5a8a');
            ctx.fillStyle = defaultGradient;
            ctx.fillRect(0, 0, width, height);
    }
}
async function drawTweetContentWithOverlay(ctx, data, width, height, config, requestId) {
    await loadIcons();
    const isVertical = height / width > 1.2;
    const isFourFive = Math.abs(width / height - 0.8) < 0.05;
    const isNineSixteen = Math.abs(width / height - 9 / 16) < 0.05;
    const isThreeFour = Math.abs(width / height - 0.75) < 0.05;
    const isOneOne = Math.abs(width / height - 1) < 0.05;
    let overlayWidth;
    if (isOneOne) {
        overlayWidth = width * 0.9;
    }
    else if (isFourFive || isThreeFour) {
        overlayWidth = width * 0.8;
    }
    else if (isNineSixteen || isVertical) {
        overlayWidth = width * 0.75;
    }
    else {
        overlayWidth = width * 0.7;
    }
    let overlayMaxHeight;
    if (isOneOne) {
        overlayMaxHeight = height * 0.85;
    }
    else if (isVertical || isNineSixteen || isFourFive || isThreeFour) {
        overlayMaxHeight = height * 0.6;
    }
    else {
        overlayMaxHeight = height * 0.8;
    }
    const baseWidth = 900;
    const widthScale = overlayWidth / baseWidth;
    let scale = widthScale;
    let fontBoost = 1;
    if (isVertical || isNineSixteen)
        fontBoost = 1.35;
    if (height / width > 1.7 || isNineSixteen)
        fontBoost = 1.7;
    if (isFourFive)
        fontBoost *= 1.1;
    if (isThreeFour)
        fontBoost *= 1.05;
    if (isOneOne)
        fontBoost *= 1.1;
    const paddingX = 40 * scale * fontBoost;
    const paddingY = 32 * scale * fontBoost;
    const avatarSize = 80 * scale * fontBoost;
    const textLength = data.text.length;
    let baseFontSize = 32 * scale * fontBoost;
    if (textLength > 200)
        baseFontSize *= 0.9;
    else if (textLength > 100)
        baseFontSize *= 0.95;
    else if (textLength < 50)
        baseFontSize *= 1.1;
    let tweetFontSize = baseFontSize;
    let lineHeight = tweetFontSize * 1.2;
    let headerHeight = avatarSize + 18 + 44 * scale * fontBoost + 54 * scale * fontBoost;
    let statsHeight = 60 * scale * fontBoost;
    let textMaxWidth = overlayWidth - (paddingX * 2);
    ctx.font = `${Math.round(tweetFontSize)}px TwitterChirp, Arial, sans-serif`;
    let textLines = (0, canvas_2.wrapText)(ctx, data.text, textMaxWidth, lineHeight);
    let tweetTextHeight = textLines.length * lineHeight;
    let minHeight = headerHeight + tweetTextHeight + statsHeight + (paddingY * 2);
    let containerHeight = Math.min(minHeight, overlayMaxHeight);
    for (let shrink = 0; shrink < 30; shrink++) {
        if (tweetTextHeight <= containerHeight - headerHeight - statsHeight - (paddingY * 2) || tweetFontSize < 14)
            break;
        tweetFontSize *= 0.94;
        lineHeight = tweetFontSize * 1.2;
        ctx.font = `${Math.round(tweetFontSize)}px TwitterChirp, Arial, sans-serif`;
        textLines = (0, canvas_2.wrapText)(ctx, data.text, textMaxWidth, lineHeight);
        tweetTextHeight = textLines.length * lineHeight;
        minHeight = headerHeight + tweetTextHeight + statsHeight + (paddingY * 2);
        containerHeight = Math.min(minHeight, overlayMaxHeight);
    }
    const avatarAndPadding = avatarSize + paddingX + 22;
    ctx.font = `bold ${Math.round(32 * scale * fontBoost)}px TwitterChirp-Bold, Arial, sans-serif`;
    const nameWidth = ctx.measureText(data.displayName).width;
    ctx.font = `${Math.round(18 * scale * fontBoost)}px TwitterChirp, Arial, sans-serif`;
    const userWidth = ctx.measureText(data.username || '').width;
    const nameUserWidth = Math.max(nameWidth, userWidth);
    const headerContentWidth = avatarAndPadding + nameUserWidth;
    const tweetLineWidths = textLines.map(line => {
        ctx.font = `${Math.round(tweetFontSize)}px TwitterChirp, Arial, sans-serif`;
        return ctx.measureText(line).width;
    });
    const textContentWidth = Math.max(...tweetLineWidths, 0);
    const minContentWidth = Math.max(headerContentWidth, textContentWidth, 320 * scale);
    let containerWidth = Math.min(minContentWidth + (paddingX * 2), overlayWidth);
    textMaxWidth = containerWidth - (paddingX * 2);
    ctx.font = `${Math.round(tweetFontSize)}px TwitterChirp, Arial, sans-serif`;
    textLines = (0, canvas_2.wrapText)(ctx, data.text, textMaxWidth, lineHeight);
    tweetTextHeight = textLines.length * lineHeight;
    minHeight = headerHeight + tweetTextHeight + statsHeight + (paddingY * 2);
    containerHeight = Math.min(minHeight, overlayMaxHeight);
    const centerX = width / 2;
    const centerY = height / 2;
    (0, canvas_2.drawGlassmorphismContainer)(ctx, centerX, centerY, containerWidth, containerHeight, config);
    const contentStartY = centerY - containerHeight / 2 + paddingY;
    let avatarX = centerX - containerWidth / 2 + paddingX + avatarSize / 2;
    let avatarY = contentStartY + avatarSize / 2 + 10;
    try {
        let avatarPath = data.avatar;
        if (avatarPath && avatarPath.startsWith('/uploads/')) {
            const path = require('path');
            avatarPath = path.join(process.cwd(), avatarPath.replace(/^\//, ''));
        }
        if (avatarPath) {
            const avatarImage = await (0, canvas_1.loadImage)(avatarPath);
            const sourceSize = Math.min(avatarImage.width, avatarImage.height);
            const sourceX = (avatarImage.width - sourceSize) / 2;
            const sourceY = (avatarImage.height - sourceSize) / 2;
            ctx.save();
            ctx.beginPath();
            ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(avatarImage, sourceX, sourceY, sourceSize, sourceSize, avatarX - avatarSize / 2, avatarY - avatarSize / 2, avatarSize, avatarSize);
            ctx.restore();
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
        logger.warn(`[${requestId}] Error cargando avatar:`, avatarError);
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
    ctx.font = `bold ${Math.round(32 * scale * fontBoost)}px TwitterChirp-Bold, Arial, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(data.displayName, userInfoX, currentY);
    if (data.verified) {
        const nameWidth2 = ctx.measureText(data.displayName).width;
        ctx.fillStyle = '#1DA1F2';
        ctx.font = `${Math.round(18 * scale * fontBoost)}px Arial, sans-serif`;
        ctx.fillText('✓', userInfoX + nameWidth2 + 10, currentY);
    }
    currentY += 44 * scale * fontBoost;
    ctx.fillStyle = config.secondaryTextColor;
    ctx.font = `${Math.round(18 * scale * fontBoost)}px TwitterChirp, Arial, sans-serif`;
    ctx.fillText(`${data.username} · ${data.timestamp}`, userInfoX, currentY);
    currentY += 54 * scale * fontBoost;
    ctx.fillStyle = config.textColor;
    ctx.font = `${Math.round(tweetFontSize)}px TwitterChirp, Arial, sans-serif`;
    for (const line of textLines) {
        ctx.fillText(line, centerX - containerWidth / 2 + paddingX, currentY);
        currentY += lineHeight;
    }
    const statsY = centerY + containerHeight / 2 - paddingY - 20;
    let statsSpacing = Math.min(90 * scale * fontBoost, (containerWidth - (paddingX * 2)) / 4);
    const stats = [];
    if (typeof data.replies === 'number')
        stats.push({ emoji: '💬', value: data.replies });
    if (typeof data.retweets === 'number')
        stats.push({ emoji: '🔄', value: data.retweets });
    if (typeof data.likes === 'number')
        stats.push({ emoji: '❤️', value: data.likes });
    if (typeof data.views === 'number')
        stats.push({ emoji: '👁️', value: data.views });
    if (stats.length > 3) {
        statsSpacing = Math.min(statsSpacing, (containerWidth - (paddingX * 2)) / stats.length);
    }
    const statsStartX = centerX - containerWidth / 2 + paddingX;
    ctx.fillStyle = config.secondaryTextColor;
    ctx.font = `${Math.round(16 * scale * fontBoost)}px TwitterChirp, Arial, sans-serif`;
    stats.forEach((stat, index) => {
        const x = statsStartX + index * statsSpacing;
        if (typeof stat.value === 'number') {
            ctx.fillText(stat.emoji + ' ' + stat.value.toLocaleString(), x, statsY + 4);
        }
    });
}
async function drawTweetContentDirect(ctx, data, width, height, config, requestId) {
    if (config.textColor === '#ffffff') {
        config = {
            ...config,
            textColor: '#000000',
            secondaryTextColor: '#657786'
        };
    }
    await loadIcons();
    const aspectRatio = width / height;
    const isFourFive = Math.abs(aspectRatio - 0.8) < 0.05;
    const isNineSixteen = Math.abs(aspectRatio - 9 / 16) < 0.05;
    const isThreeFour = Math.abs(aspectRatio - 0.75) < 0.05;
    const isOneOne = Math.abs(aspectRatio - 1) < 0.05;
    const containerWidth = width * 0.8;
    let containerHeight;
    if (isNineSixteen || isFourFive || isThreeFour || aspectRatio < 1) {
        containerHeight = height * 0.9;
    }
    else {
        containerHeight = Math.min(height * 0.8, 500);
    }
    const baseWidth = 900;
    const widthScale = containerWidth / baseWidth;
    let fontBoost = 1;
    if (isNineSixteen)
        fontBoost = 1.7;
    else if (isFourFive)
        fontBoost = 1.3;
    else if (isThreeFour)
        fontBoost = 1.15;
    else if (isOneOne)
        fontBoost = 1.0;
    else if (aspectRatio < 1)
        fontBoost = 1.2;
    const padding = 40 * widthScale * fontBoost;
    let avatarSize = 100 * widthScale * fontBoost;
    const centerX = width / 2;
    const centerY = height / 2;
    let avatarX = centerX;
    let avatarY = centerY - containerHeight / 2 + padding + avatarSize / 2;
    try {
        let avatarPath = data.avatar;
        if (avatarPath && avatarPath.startsWith('/uploads/')) {
            const path = require('path');
            avatarPath = path.join(process.cwd(), avatarPath.replace(/^\//, ''));
        }
        if (avatarPath) {
            const avatarImage = await (0, canvas_1.loadImage)(avatarPath);
            ctx.save();
            ctx.beginPath();
            ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(avatarImage, avatarX - avatarSize / 2, avatarY - avatarSize / 2, avatarSize, avatarSize);
            ctx.restore();
        }
        else {
            ctx.fillStyle = '#1DA1F2';
            ctx.beginPath();
            ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'white';
            ctx.font = `bold ${Math.round(32 * widthScale * fontBoost)}px TwitterChirp-Bold, Arial, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(data.displayName.charAt(0).toUpperCase(), avatarX, avatarY);
        }
    }
    catch (avatarError) {
        logger.warn(`[${requestId}] Error cargando avatar:`, avatarError);
        ctx.fillStyle = '#1DA1F2';
        ctx.beginPath();
        ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.font = `bold ${Math.round(32 * widthScale * fontBoost)}px TwitterChirp-Bold, Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(data.displayName.charAt(0).toUpperCase(), avatarX, avatarY);
    }
    let currentY = avatarY + avatarSize / 2 + 20;
    ctx.fillStyle = config.textColor;
    ctx.font = `bold ${Math.round(36 * widthScale * fontBoost)}px TwitterChirp-Bold, Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(data.displayName, centerX, currentY);
    if (data.verified) {
        const nameWidth = ctx.measureText(data.displayName).width;
        ctx.fillStyle = '#1DA1F2';
        ctx.font = `${Math.round(24 * widthScale * fontBoost)}px Arial, sans-serif`;
        ctx.fillText('✓', centerX + nameWidth / 2 + 16, currentY + 2);
    }
    currentY += 50;
    ctx.fillStyle = config.secondaryTextColor;
    ctx.font = `${Math.round(24 * widthScale * fontBoost)}px TwitterChirp, Arial, sans-serif`;
    ctx.fillText(`${data.username} · ${data.timestamp}`, centerX, currentY);
    currentY += 80;
    ctx.fillStyle = config.textColor;
    ctx.font = `${Math.round(32 * widthScale * fontBoost)}px TwitterChirp, Arial, sans-serif`;
    const textMaxWidth = containerWidth - (padding * 2);
    const lineHeight = 45 * widthScale * fontBoost;
    const textLines = (0, canvas_2.wrapText)(ctx, data.text, textMaxWidth, lineHeight);
    for (const line of textLines) {
        ctx.fillText(line, centerX, currentY);
        currentY += lineHeight;
    }
    currentY += 60;
    const stats = [];
    if (typeof data.replies === 'number')
        stats.push({ emoji: '💬', value: data.replies });
    if (typeof data.retweets === 'number')
        stats.push({ emoji: '🔄', value: data.retweets });
    if (typeof data.likes === 'number')
        stats.push({ emoji: '❤️', value: data.likes });
    if (typeof data.views === 'number')
        stats.push({ emoji: '👁️', value: data.views });
    if (stats.length > 0) {
        const statsSpacing = Math.min(150 * widthScale * fontBoost, textMaxWidth / stats.length);
        const statsStartX = centerX - (stats.length * statsSpacing) / 2 + statsSpacing / 2;
        ctx.fillStyle = config.secondaryTextColor;
        ctx.font = `${Math.round(20 * widthScale * fontBoost)}px TwitterChirp, Arial, sans-serif`;
        stats.forEach((stat, index) => {
            const x = statsStartX + index * statsSpacing;
            if (typeof stat.value === 'number') {
                ctx.fillText(stat.emoji + ' ' + stat.value.toLocaleString(), x, currentY);
            }
        });
    }
}
async function drawTweetContent(ctx, data, width, height, config, requestId) {
    await loadIcons();
    const aspectRatio = width / height;
    const isFourFive = Math.abs(aspectRatio - 0.8) < 0.05;
    const isNineSixteen = Math.abs(aspectRatio - 9 / 16) < 0.05;
    const isThreeFour = Math.abs(aspectRatio - 0.75) < 0.05;
    const isOneOne = Math.abs(aspectRatio - 1) < 0.05;
    const containerWidth = width * 0.7;
    let containerHeight;
    if (isNineSixteen || isFourFive || isThreeFour || aspectRatio < 1) {
        containerHeight = height * 0.75;
    }
    else {
        containerHeight = Math.min(height * 0.7, 400);
    }
    const baseWidth = 900;
    const widthScale = containerWidth / baseWidth;
    let fontBoost = 1;
    if (isNineSixteen)
        fontBoost = 1.7;
    else if (isFourFive)
        fontBoost = 1.3;
    else if (isThreeFour)
        fontBoost = 1.15;
    else if (isOneOne)
        fontBoost = 1.0;
    else if (aspectRatio < 1)
        fontBoost = 1.2;
    const padding = 56 * widthScale * fontBoost;
    let avatarSize = 80 * widthScale * fontBoost;
    const centerX = width / 2;
    const centerY = height / 2;
    let avatarX = centerX;
    let avatarY = centerY - containerHeight / 2 + padding + avatarSize / 2;
    try {
        if (data.avatar) {
            const avatarImage = await (0, canvas_1.loadImage)(data.avatar);
            ctx.save();
            ctx.beginPath();
            ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(avatarImage, avatarX - avatarSize / 2, avatarY - avatarSize / 2, avatarSize, avatarSize);
            ctx.restore();
            logger.info(`[${requestId}] Avatar cargado desde: ${data.avatar}`);
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
        logger.warn(`[${requestId}] Error cargando avatar, usando inicial:`, avatarError);
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
    let currentY = avatarY + avatarSize / 2 + 16;
    ctx.fillStyle = config.textColor;
    ctx.font = 'bold 32px TwitterChirp-Bold, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(data.displayName, centerX, currentY);
    if (data.verified) {
        const nameWidth = ctx.measureText(data.displayName).width;
        ctx.fillStyle = '#1DA1F2';
        ctx.font = '28px Arial, sans-serif';
        ctx.fillText('✓', centerX + nameWidth / 2 + 16, currentY + 2);
    }
    currentY += 40;
    ctx.fillStyle = config.secondaryTextColor;
    ctx.font = '24px TwitterChirp, Arial, sans-serif';
    ctx.fillText(`${data.username} · ${data.timestamp}`, centerX, currentY);
    currentY += 60;
    ctx.fillStyle = config.textColor;
    ctx.font = '28px TwitterChirp, Arial, sans-serif';
    const textMaxWidth = containerWidth - (padding * 2);
    const lineHeight = 40;
    const textLines = (0, canvas_2.wrapText)(ctx, data.text, textMaxWidth, lineHeight);
    for (const line of textLines) {
        ctx.fillText(line, centerX, currentY);
        currentY += lineHeight;
    }
    currentY += 40;
    const stats = [];
    if (typeof data.replies === 'number')
        stats.push({ icon: commentIcon, value: data.replies });
    if (typeof data.retweets === 'number')
        stats.push({ icon: retweetIcon, value: data.retweets });
    if (typeof data.likes === 'number')
        stats.push({ icon: heartIcon, value: data.likes });
}
async function saveImage(canvas, options, requestId) {
    await promises_1.default.mkdir('output', { recursive: true });
    const format = options.format || 'png';
    const fileName = `social-image-${requestId}.${format}`;
    const outputPath = path_1.default.join('output', fileName);
    let buffer;
    switch (format) {
        case 'png':
            buffer = canvas.toBuffer('image/png');
            break;
        case 'jpg':
        case 'jpeg':
            buffer = canvas.toBuffer('image/jpeg', { quality: (options.quality || 85) / 100 });
            break;
        case 'webp':
            buffer = canvas.toBuffer('image/webp', { quality: (options.quality || 85) / 100 });
            break;
        default:
            buffer = canvas.toBuffer('image/png');
            break;
    }
    await promises_1.default.writeFile(outputPath, buffer);
    logger.info(`[${requestId}] Imagen guardada: ${outputPath} (${buffer.length} bytes)`);
    return outputPath;
}
async function generateImageWithTemplate(tweetData, templateName, customOptions = {}, requestId) {
    const templates = {
        'twitter-classic': {
            width: 1200,
            height: 628,
            format: 'png',
            theme: 'dark'
        },
        'minimal-light': {
            width: 1200,
            height: 628,
            format: 'png',
            theme: 'light'
        },
        'instagram-post': {
            width: 1080,
            height: 1080,
            format: 'jpg',
            theme: 'dark'
        },
        'linkedin-post': {
            width: 1200,
            height: 627,
            format: 'png',
            theme: 'light'
        }
    };
    const template = templates[templateName];
    if (!template) {
        throw new Error(`Plantilla no encontrada: ${templateName}`);
    }
    const options = { ...template, ...customOptions };
    return generateSocialImage(tweetData, options, requestId);
}
async function generateCustomSizeImage(tweetData, width, height, requestId) {
    if (width < 200 || width > 4096 || height < 200 || height > 4096) {
        throw new Error('Dimensiones inválidas. Rango permitido: 200-4096 píxeles');
    }
    const options = {
        width,
        height,
        format: 'png',
        quality: 90,
        theme: tweetData.theme || 'dark'
    };
    return generateSocialImage(tweetData, options, requestId);
}
async function generateMultipleFormats(tweetData, baseOptions, requestId) {
    const formats = ['png', 'jpg', 'webp'];
    const results = [];
    for (const format of formats) {
        const options = { ...baseOptions, format };
        const formatRequestId = `${requestId}-${format}`;
        try {
            const result = await generateSocialImage(tweetData, options, formatRequestId);
            results.push({
                ...result,
                format: format || 'png'
            });
        }
        catch (error) {
            results.push({
                success: false,
                error: error.message,
                format: format || 'png'
            });
        }
    }
    return results;
}
async function processAvatarImage(avatarPath, requestId) {
    try {
        const avatarImage = await (0, canvas_1.loadImage)(avatarPath);
        const size = 400;
        const canvas = (0, canvas_1.createCanvas)(size, size);
        const ctx = canvas.getContext('2d');
        const sourceSize = Math.min(avatarImage.width, avatarImage.height);
        const sourceX = (avatarImage.width - sourceSize) / 2;
        const sourceY = (avatarImage.height - sourceSize) / 2;
        ctx.drawImage(avatarImage, sourceX, sourceY, sourceSize, sourceSize, 0, 0, size, size);
        await promises_1.default.mkdir('uploads/avatars', { recursive: true });
        const optimizedPath = path_1.default.join('uploads/avatars', `optimized-${requestId}.png`);
        const buffer = canvas.toBuffer('image/png');
        await promises_1.default.writeFile(optimizedPath, buffer);
        logger.info(`[${requestId}] Avatar optimizado: ${optimizedPath}`);
        return {
            optimizedPath,
            size: `${(buffer.length / 1024).toFixed(1)}KB`
        };
    }
    catch (error) {
        logger.error(`[${requestId}] Error optimizando avatar:`, error);
        throw new Error(`Error procesando avatar: ${error.message}`);
    }
}
//# sourceMappingURL=imageGenerator.js.map