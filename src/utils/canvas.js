"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
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
// src/utils/canvas.ts - Utilidades para manejo de Canvas
var canvas_1 = require("canvas");
var promises_1 = require("fs/promises");
var path_1 = require("path");
const winston = require('winston');
var logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'logs/canvas.log' })
    ]
});
// Generar overlay glassmorphism para videos
function generateGlassmorphismOverlay(tweetData, options, requestId) {
    return __awaiter(this, void 0, void 0, function () {
        var canvas, ctx, glassConfig, fileName, outputPath, buffer, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    logger.info("[".concat(requestId, "] Generando overlay glassmorphism"));
                    canvas = (0, canvas_1.createCanvas)(options.width, options.height);
                    ctx = canvas.getContext('2d');
                    glassConfig = getGlassmorphismConfig(tweetData.theme || 'dark');
                    // Limpiar canvas con transparencia
                    ctx.clearRect(0, 0, options.width, options.height);
                    // Dibujar contenido del tweet con glassmorphism
                    return [4 /*yield*/, drawTweetOverlay(ctx, tweetData, options, glassConfig, requestId)
                        // Guardar como PNG con transparencia
                    ];
                case 1:
                    // Dibujar contenido del tweet con glassmorphism
                    _a.sent();
                    fileName = "overlay-".concat(requestId, ".png");
                    outputPath = path_1.default.join('temp', fileName);
                    // Asegurar que existe el directorio temp
                    return [4 /*yield*/, promises_1.default.mkdir('temp', { recursive: true })];
                case 2:
                    // Asegurar que existe el directorio temp
                    _a.sent();
                    buffer = canvas.toBuffer('image/png');
                    return [4 /*yield*/, promises_1.default.writeFile(outputPath, buffer)];
                case 3:
                    _a.sent();
                    logger.info("[".concat(requestId, "] Overlay guardado: ").concat(outputPath, " (").concat(buffer.length, " bytes)"));
                    return [2 /*return*/, outputPath];
                case 4:
                    error_1 = _a.sent();
                    logger.error("[".concat(requestId, "] Error generando overlay:"), error_1);
                    throw new Error("Error generando overlay glassmorphism: ".concat(error_1.message));
                case 5: return [2 /*return*/];
            }
        });
    });
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
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        textColor: '#ffffff',
        secondaryTextColor: 'rgba(255, 255, 255, 0.7)',
        backdropBlur: 12,
        borderRadius: 20,
        opacity: 0.9
    };
}
function drawTweetOverlay(ctx, data, options, config, requestId) {
    return __awaiter(this, void 0, void 0, function () {
        var centerX, centerY, containerWidth, containerHeight, padding, contentStartY, avatarSize, avatarX, avatarY, avatarImage, avatarError_1, userInfoX, currentY, nameWidth, textMaxWidth, lineHeight, textLines, _i, textLines_1, line, statsY, statsSpacing, statsStartX, stats;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    centerX = options.width / 2;
                    centerY = options.height / 2;
                    containerWidth = Math.min(options.width * 0.85, 800);
                    containerHeight = Math.min(options.height * 0.5, 400);
                    // Dibujar contenedor glassmorphism
                    drawGlassmorphismContainer(ctx, centerX, centerY, containerWidth, containerHeight, config);
                    padding = 40;
                    contentStartY = centerY - containerHeight / 2 + padding;
                    avatarSize = 50;
                    avatarX = centerX - containerWidth / 2 + padding + avatarSize / 2;
                    avatarY = contentStartY + avatarSize / 2 + 10;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 6]);
                    if (!data.avatar) return [3 /*break*/, 3];
                    return [4 /*yield*/, (0, canvas_1.loadImage)(data.avatar)
                        // Crear máscara circular para avatar
                    ];
                case 2:
                    avatarImage = _a.sent();
                    // Crear máscara circular para avatar
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2);
                    ctx.clip();
                    ctx.drawImage(avatarImage, avatarX - avatarSize / 2, avatarY - avatarSize / 2, avatarSize, avatarSize);
                    ctx.restore();
                    logger.info("[".concat(requestId, "] Avatar cargado en overlay"));
                    return [3 /*break*/, 4];
                case 3:
                    // Avatar por defecto con inicial
                    ctx.fillStyle = '#1DA1F2';
                    ctx.beginPath();
                    ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = 'white';
                    ctx.font = 'bold 20px TwitterChirp-Bold, Arial, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(data.displayName.charAt(0).toUpperCase(), avatarX, avatarY);
                    _a.label = 4;
                case 4: return [3 /*break*/, 6];
                case 5:
                    avatarError_1 = _a.sent();
                    logger.warn("[".concat(requestId, "] Error cargando avatar en overlay:"), avatarError_1);
                    // Fallback: avatar con inicial
                    ctx.fillStyle = '#1DA1F2';
                    ctx.beginPath();
                    ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = 'white';
                    ctx.font = 'bold 20px TwitterChirp-Bold, Arial, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(data.displayName.charAt(0).toUpperCase(), avatarX, avatarY);
                    return [3 /*break*/, 6];
                case 6:
                    userInfoX = avatarX + avatarSize / 2 + 15;
                    currentY = contentStartY + 15;
                    // Nombre de usuario
                    ctx.fillStyle = config.textColor;
                    ctx.font = 'bold 24px TwitterChirp-Bold, Arial, sans-serif';
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'top';
                    ctx.fillText(data.displayName, userInfoX, currentY);
                    // Checkmark de verificación
                    if (data.verified) {
                        nameWidth = ctx.measureText(data.displayName).width;
                        ctx.fillStyle = '#1DA1F2';
                        ctx.font = '20px Arial, sans-serif';
                        ctx.fillText('✓', userInfoX + nameWidth + 8, currentY);
                    }
                    currentY += 30;
                    // Username y timestamp
                    ctx.fillStyle = config.secondaryTextColor;
                    ctx.font = '18px TwitterChirp, Arial, sans-serif';
                    ctx.fillText("".concat(data.username, " \u00B7 ").concat(data.timestamp), userInfoX, currentY);
                    currentY += 45;
                    // Texto del tweet
                    ctx.fillStyle = config.textColor;
                    ctx.font = '22px TwitterChirp, Arial, sans-serif';
                    textMaxWidth = containerWidth - (padding * 2);
                    lineHeight = 28;
                    textLines = wrapText(ctx, data.text, textMaxWidth, lineHeight);
                    for (_i = 0, textLines_1 = textLines; _i < textLines_1.length; _i++) {
                        line = textLines_1[_i];
                        if (currentY > centerY + containerHeight / 2 - 80)
                            break; // Evitar overflow
                        ctx.fillText(line, centerX - containerWidth / 2 + padding, currentY);
                        currentY += lineHeight;
                    }
                    statsY = centerY + containerHeight / 2 - 50;
                    statsSpacing = containerWidth / 4;
                    statsStartX = centerX - containerWidth / 2 + padding;
                    ctx.fillStyle = config.secondaryTextColor;
                    ctx.font = '16px TwitterChirp, Arial, sans-serif';
                    stats = [
                        { icon: '💬', value: data.replies || 0 },
                        { icon: '🔄', value: data.retweets },
                        { icon: '❤️', value: data.likes },
                        { icon: '📊', value: Math.floor(Math.random() * 2000) + 500 }
                    ];
                    stats.forEach(function (stat, index) {
                        var x = statsStartX + (index * (statsSpacing * 0.8));
                        ctx.fillText("".concat(stat.icon, " ").concat(stat.value.toLocaleString()), x, statsY);
                    });
                    return [2 /*return*/];
            }
        });
    });
}
// Dibujar contenedor glassmorphism
function drawGlassmorphismContainer(ctx, x, y, width, height, config) {
    var cornerRadius = config.borderRadius || 20;
    // Efecto de sombra/glow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 8;
    // Dibujar contenedor redondeado
    ctx.beginPath();
    drawRoundedRect(ctx, x - width / 2, y - height / 2, width, height, cornerRadius);
    // Rellenar con color glassmorphism
    ctx.fillStyle = config.backgroundColor;
    ctx.fill();
    // Borde
    ctx.strokeStyle = config.borderColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    // Agregar highlight sutil en la parte superior
    var highlightGradient = ctx.createLinearGradient(x - width / 2, y - height / 2, x - width / 2, y - height / 2 + 40);
    highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
    highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = highlightGradient;
    ctx.beginPath();
    drawRoundedRect(ctx, x - width / 2, y - height / 2, width, 40, cornerRadius, true); // Solo top corners
    ctx.fill();
}
// Dibujar rectángulo redondeado
function drawRoundedRect(ctx, x, y, width, height, radius, topOnly) {
    if (topOnly === void 0) { topOnly = false; }
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    // Top right corner
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    if (topOnly) {
        // Si solo queremos esquinas superiores redondeadas
        ctx.lineTo(x + width, y + height);
        ctx.lineTo(x, y + height);
        ctx.lineTo(x, y + radius);
    }
    else {
        // Bottom right corner
        ctx.arcTo(x + width, y + height, x, y + height, radius);
        // Bottom left corner
        ctx.arcTo(x, y + height, x, y, radius);
    }
    // Top left corner
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
}
// Función mejorada para wrap text
function wrapText(ctx, text, maxWidth, lineHeight) {
    var words = text.split(' ');
    var lines = [];
    var currentLine = '';
    for (var i = 0; i < words.length; i++) {
        var word = words[i];
        var testLine = currentLine + (currentLine ? ' ' : '') + word;
        var metrics = ctx.measureText(testLine);
        var testWidth = metrics.width;
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
    return lines;
}
// Función para renderizar texto con efectos
function renderTextWithEffects(ctx, options) {
    ctx.save();
    // Configurar fuente y alineación
    if (options.font)
        ctx.font = options.font;
    if (options.color)
        ctx.fillStyle = options.color;
    if (options.align)
        ctx.textAlign = options.align;
    // Aplicar sombra si está especificada
    if (options.shadow) {
        ctx.shadowColor = options.shadow.color;
        ctx.shadowBlur = options.shadow.blur;
        ctx.shadowOffsetX = options.shadow.offsetX;
        ctx.shadowOffsetY = options.shadow.offsetY;
    }
    // Renderizar texto con wrap si es necesario
    if (options.maxWidth && options.lineHeight) {
        var lines = wrapText(ctx, options.text, options.maxWidth, options.lineHeight);
        lines.forEach(function (line, index) {
            ctx.fillText(line, options.x, options.y + (index * options.lineHeight));
        });
    }
    else {
        ctx.fillText(options.text, options.x, options.y);
    }
    ctx.restore();
}
// Función para crear gradiente dinámico
function createDynamicGradient(ctx, width, height, colors, type) {
    if (type === void 0) { type = 'linear'; }
    var gradient;
    if (type === 'radial') {
        gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) / 2);
    }
    else {
        gradient = ctx.createLinearGradient(0, 0, width, height);
    }
    var step = 1 / (colors.length - 1);
    colors.forEach(function (color, index) {
        gradient.addColorStop(index * step, color);
    });
    return gradient;
}
// Función para aplicar filtros de imagen
function applyImageFilter(ctx, filter, value) {
    switch (filter) {
        case 'blur':
            ctx.filter = "blur(".concat(value, "px)");
            break;
        case 'brightness':
            ctx.filter = "brightness(".concat(value, "%)");
            break;
        case 'contrast':
            ctx.filter = "contrast(".concat(value, "%)");
            break;
        case 'saturate':
            ctx.filter = "saturate(".concat(value, "%)");
            break;
    }
}
// Función para obtener color dominante de una imagen
function getDominantColor(imagePath) {
    return __awaiter(this, void 0, void 0, function () {
        var image, canvas, ctx, imageData, _a, r, g, b, error_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, canvas_1.loadImage)(imagePath)];
                case 1:
                    image = _b.sent();
                    canvas = (0, canvas_1.createCanvas)(1, 1);
                    ctx = canvas.getContext('2d');
                    // Dibujar imagen escalada a 1x1 pixel
                    ctx.drawImage(image, 0, 0, 1, 1);
                    imageData = ctx.getImageData(0, 0, 1, 1);
                    _a = imageData.data, r = _a[0], g = _a[1], b = _a[2];
                    return [2 /*return*/, "rgb(".concat(r, ", ").concat(g, ", ").concat(b, ")")];
                case 2:
                    error_2 = _b.sent();
                    logger.warn('Error obteniendo color dominante:', error_2);
                    return [2 /*return*/, '#1DA1F2']; // Color por defecto
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Función para crear patrón de puntos
function createDotPattern(ctx, width, height, dotSize, spacing, opacity) {
    if (dotSize === void 0) { dotSize = 2; }
    if (spacing === void 0) { spacing = 20; }
    if (opacity === void 0) { opacity = 0.1; }
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.fillStyle = 'white';
    for (var x = 0; x < width; x += spacing) {
        for (var y = 0; y < height; y += spacing) {
            ctx.beginPath();
            ctx.arc(x, y, dotSize, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.restore();
}
// Función para validar dimensiones de canvas
function validateCanvasDimensions(width, height) {
    var warnings = [];
    var adjustedWidth = width;
    var adjustedHeight = height;
    var isValid = true;
    // Límites razonables para canvas
    var MAX_DIMENSION = 4096;
    var MIN_DIMENSION = 100;
    if (width > MAX_DIMENSION) {
        adjustedWidth = MAX_DIMENSION;
        warnings.push("Ancho ajustado de ".concat(width, " a ").concat(MAX_DIMENSION));
    }
    if (height > MAX_DIMENSION) {
        adjustedHeight = MAX_DIMENSION;
        warnings.push("Altura ajustada de ".concat(height, " a ").concat(MAX_DIMENSION));
    }
    if (width < MIN_DIMENSION) {
        adjustedWidth = MIN_DIMENSION;
        warnings.push("Ancho ajustado de ".concat(width, " a ").concat(MIN_DIMENSION));
        isValid = false;
    }
    if (height < MIN_DIMENSION) {
        adjustedHeight = MIN_DIMENSION;
        warnings.push("Altura ajustada de ".concat(height, " a ").concat(MIN_DIMENSION));
        isValid = false;
    }
    // Verificar proporciones extremas
    var aspectRatio = adjustedWidth / adjustedHeight;
    if (aspectRatio > 10 || aspectRatio < 0.1) {
        warnings.push('Proporción de aspecto extrema detectada');
    }
    return {
        isValid: isValid && warnings.length === 0,
        adjustedWidth: adjustedWidth !== width ? adjustedWidth : undefined,
        adjustedHeight: adjustedHeight !== height ? adjustedHeight : undefined,
        warnings: warnings
    };
}
