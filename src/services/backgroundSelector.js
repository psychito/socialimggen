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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectBackgroundVideo = selectBackgroundVideo;
exports.getAllAvailableVideos = getAllAvailableVideos;
exports.getVideosByCategory = getVideosByCategory;
exports.suggestVideosForContent = suggestVideosForContent;
exports.getUsageStatistics = getUsageStatistics;
// src/services/backgroundSelector.ts - Servicio inteligente de selección de fondos
var promises_1 = require("fs/promises");
var path_1 = require("path");
const winston = require('winston');
var logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'logs/background-selector.log' })
    ]
});
// Banco de videos organizados por categoría
var videoBank = {
    tech: [
        'videos/tech/coding-screen.mp4',
        'videos/tech/server-room.mp4',
        'videos/tech/circuit-board.mp4',
        'videos/tech/data-flow.mp4',
        'videos/tech/hologram.mp4'
    ],
    nature: [
        'videos/nature/forest-wind.mp4',
        'videos/nature/ocean-waves.mp4',
        'videos/nature/mountain-vista.mp4',
        'videos/nature/sunrise.mp4',
        'videos/nature/rain-drops.mp4'
    ],
    urban: [
        'videos/urban/city-lights.mp4',
        'videos/urban/traffic-flow.mp4',
        'videos/urban/skyscrapers.mp4',
        'videos/urban/street-night.mp4',
        'videos/urban/urban-rain.mp4'
    ],
    abstract: [
        'videos/abstract/particles.mp4',
        'videos/abstract/geometric-shapes.mp4',
        'videos/abstract/color-waves.mp4',
        'videos/abstract/fluid-motion.mp4',
        'videos/abstract/light-rays.mp4'
    ],
    business: [
        'videos/business/office-space.mp4',
        'videos/business/handshake.mp4',
        'videos/business/charts-growth.mp4',
        'videos/business/meeting-room.mp4',
        'videos/business/corporate.mp4'
    ],
    custom: [] // Se llena dinámicamente
};
// Palabras clave para análisis de contenido
var categoryKeywords = {
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
};
// Función principal para seleccionar video de fondo
function selectBackgroundVideo(tweetText, customPath) {
    if (customPath && promises_1.default.existsSync) {
        return customPath;
    }
    var category = analyzeContentCategory(tweetText);
    var selectedVideo = getRandomVideoFromCategory(category);
    logger.info('Video de fondo seleccionado', {
        tweetText: tweetText.substring(0, 50) + '...',
        detectedCategory: category,
        selectedVideo: selectedVideo
    });
    return selectedVideo;
}
// Análisis inteligente del contenido para determinar categoría
function analyzeContentCategory(text) {
    var normalizedText = text.toLowerCase();
    var scores = {
        tech: 0,
        nature: 0,
        urban: 0,
        business: 0,
        abstract: 0,
        custom: 0
    };
    // Calcular puntuación para cada categoría basado en palabras clave
    for (var _i = 0, _a = Object.entries(categoryKeywords); _i < _a.length; _i++) {
        var _b = _a[_i], category = _b[0], keywords = _b[1];
        for (var _c = 0, keywords_1 = keywords; _c < keywords_1.length; _c++) {
            var keyword = keywords_1[_c];
            if (normalizedText.includes(keyword)) {
                scores[category] += 1;
                // Dar puntuación extra si la palabra aparece al inicio del tweet
                if (normalizedText.indexOf(keyword) < 50) {
                    scores[category] += 0.5;
                }
            }
        }
    }
    // Análisis adicional por emojis
    var emojiAnalysis = analyzeEmojis(text);
    for (var _d = 0, _e = Object.entries(emojiAnalysis); _d < _e.length; _d++) {
        var _f = _e[_d], category = _f[0], weight = _f[1];
        scores[category] += weight;
    }
    // Análisis de hashtags
    var hashtagAnalysis = analyzeHashtags(text);
    for (var _g = 0, _h = Object.entries(hashtagAnalysis); _g < _h.length; _g++) {
        var _j = _h[_g], category = _j[0], weight = _j[1];
        scores[category] += weight;
    }
    // Encontrar la categoría con mayor puntuación
    var bestCategory = 'abstract'; // default
    var bestScore = 0;
    for (var _k = 0, _l = Object.entries(scores); _k < _l.length; _k++) {
        var _m = _l[_k], category = _m[0], score = _m[1];
        if (score > bestScore) {
            bestScore = score;
            bestCategory = category;
        }
    }
    // Si no hay coincidencias claras, usar análisis de sentiment
    if (bestScore === 0) {
        bestCategory = analyzeSentiment(text);
    }
    return bestCategory;
}
// Análisis de emojis para categorización
function analyzeEmojis(text) {
    var scores = {
        tech: 0, nature: 0, urban: 0, business: 0, abstract: 0, custom: 0
    };
    var emojiCategories = {
        tech: ['💻', '🖥️', '📱', '⚡', '🚀', '🤖', '🔬', '⚙️', '🛠️', '💡'],
        nature: ['🌳', '🌲', '🌿', '🌺', '🌸', '🦋', '🐝', '🌅', '🌄', '🌊', '⛰️'],
        urban: ['🏙️', '🌃', '🏢', '🚗', '🚕', '🚇', '🍕', '☕', '🛍️', '🎭'],
        business: ['💼', '📊', '📈', '💰', '💳', '🏦', '🤝', '👔', '📋', '🎯'],
        abstract: ['✨', '🎨', '🌈', '🔮', '💫', '⭐', '🌟', '🎪', '🎭', '🎬']
    };
    for (var _i = 0, _a = Object.entries(emojiCategories); _i < _a.length; _i++) {
        var _b = _a[_i], category = _b[0], emojis = _b[1];
        for (var _c = 0, emojis_1 = emojis; _c < emojis_1.length; _c++) {
            var emoji = emojis_1[_c];
            if (text.includes(emoji)) {
                scores[category] += 2; // Los emojis tienen peso alto
            }
        }
    }
    return scores;
}
// Análisis de hashtags
function analyzeHashtags(text) {
    var scores = {
        tech: 0, nature: 0, urban: 0, business: 0, abstract: 0, custom: 0
    };
    var hashtags = text.match(/#\w+/g) || [];
    for (var _i = 0, hashtags_1 = hashtags; _i < hashtags_1.length; _i++) {
        var hashtag = hashtags_1[_i];
        var tag = hashtag.toLowerCase();
        if (tag.includes('tech') || tag.includes('code') || tag.includes('dev')) {
            scores.tech += 3;
        }
        else if (tag.includes('nature') || tag.includes('eco') || tag.includes('green')) {
            scores.nature += 3;
        }
        else if (tag.includes('city') || tag.includes('urban') || tag.includes('lifestyle')) {
            scores.urban += 3;
        }
        else if (tag.includes('business') || tag.includes('startup') || tag.includes('entrepreneur')) {
            scores.business += 3;
        }
        else if (tag.includes('art') || tag.includes('creative') || tag.includes('design')) {
            scores.abstract += 3;
        }
    }
    return scores;
}
// Análisis de sentimiento para categorización
function analyzeSentiment(text) {
    var positiveWords = ['amazing', 'awesome', 'great', 'fantastic', 'wonderful', 'excited', 'love'];
    var negativeWords = ['bad', 'terrible', 'awful', 'hate', 'disappointed'];
    var calmWords = ['peaceful', 'calm', 'relax', 'meditation', 'zen'];
    var energeticWords = ['energy', 'power', 'dynamic', 'fast', 'speed', 'action'];
    var normalizedText = text.toLowerCase();
    var positiveScore = 0;
    var negativeScore = 0;
    var calmScore = 0;
    var energeticScore = 0;
    for (var _i = 0, positiveWords_1 = positiveWords; _i < positiveWords_1.length; _i++) {
        var word = positiveWords_1[_i];
        if (normalizedText.includes(word))
            positiveScore++;
    }
    for (var _a = 0, negativeWords_1 = negativeWords; _a < negativeWords_1.length; _a++) {
        var word = negativeWords_1[_a];
        if (normalizedText.includes(word))
            negativeScore++;
    }
    for (var _b = 0, calmWords_1 = calmWords; _b < calmWords_1.length; _b++) {
        var word = calmWords_1[_b];
        if (normalizedText.includes(word))
            calmScore++;
    }
    for (var _c = 0, energeticWords_1 = energeticWords; _c < energeticWords_1.length; _c++) {
        var word = energeticWords_1[_c];
        if (normalizedText.includes(word))
            energeticScore++;
    }
    // Seleccionar categoría basada en sentimiento
    if (calmScore > 0)
        return 'nature';
    if (energeticScore > 0)
        return 'urban';
    if (positiveScore > negativeScore)
        return 'abstract';
    return 'abstract'; // default
}
// Seleccionar video aleatorio de una categoría
function getRandomVideoFromCategory(category) {
    var videos = videoBank[category] || [];
    // Si la categoría está vacía o es custom, cargar videos dinámicamente
    if (videos.length === 0 || category === 'custom') {
        videos = loadVideosFromCategory(category);
    }
    // Si aún no hay videos, usar abstract como fallback
    if (videos.length === 0) {
        logger.warn("No hay videos en categor\u00EDa ".concat(category, ", usando abstract"));
        videos = videoBank.abstract;
    }
    // Seleccionar video aleatorio
    var randomIndex = Math.floor(Math.random() * videos.length);
    var selectedVideo = videos[randomIndex];
    // Verificar que el archivo existe
    if (promises_1.default.existsSync && !promises_1.default.existsSync(selectedVideo)) {
        logger.warn("Video no encontrado: ".concat(selectedVideo, ", intentando con otro"));
        // Filtrar videos que existen
        var existingVideos = videos.filter(function (video) { return promises_1.default.existsSync && promises_1.default.existsSync(video); });
        if (existingVideos.length > 0) {
            return existingVideos[Math.floor(Math.random() * existingVideos.length)];
        }
        else {
            // Último recurso: usar un video de otra categoría
            return findAnyExistingVideo();
        }
    }
    return selectedVideo;
}
// Cargar videos de una categoría dinámicamente
function loadVideosFromCategory(category) {
    try {
        var categoryPath_1 = "videos/".concat(category);
        var files = promises_1.default.readdirSync(categoryPath_1);
        var videoFiles = files
            .filter(function (file) { return file.match(/\.(mp4|mov|avi|mkv|webm)$/i); })
            .map(function (file) { return path_1.default.join(categoryPath_1, file); });
        // Actualizar el banco de videos
        videoBank[category] = videoFiles;
        logger.info("Cargados ".concat(videoFiles.length, " videos para categor\u00EDa ").concat(category));
        return videoFiles;
    }
    catch (error) {
        logger.warn("Error cargando videos de ".concat(category, ":"), error);
        return [];
    }
}
// Encontrar cualquier video existente como último recurso
function findAnyExistingVideo() {
    for (var _i = 0, _a = Object.entries(videoBank); _i < _a.length; _i++) {
        var _b = _a[_i], category = _b[0], videos = _b[1];
        for (var _c = 0, videos_1 = videos; _c < videos_1.length; _c++) {
            var video = videos_1[_c];
            if (promises_1.default.existsSync && promises_1.default.existsSync(video)) {
                logger.info("Usando video de fallback de ".concat(category, ": ").concat(video));
                return video;
            }
        }
    }
    // Si llegamos aquí, no hay videos disponibles
    throw new Error('No hay videos de fondo disponibles');
}
// Obtener lista de todos los videos disponibles
function getAllAvailableVideos() {
    return __awaiter(this, void 0, void 0, function () {
        var allVideos, _i, _a, category, videos, _b, videos_2, videoPath, stats, fileName, error_1;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    allVideos = [];
                    _i = 0, _a = Object.keys(videoBank);
                    _c.label = 1;
                case 1:
                    if (!(_i < _a.length)) return [3 /*break*/, 8];
                    category = _a[_i];
                    videos = loadVideosFromCategory(category);
                    _b = 0, videos_2 = videos;
                    _c.label = 2;
                case 2:
                    if (!(_b < videos_2.length)) return [3 /*break*/, 7];
                    videoPath = videos_2[_b];
                    _c.label = 3;
                case 3:
                    _c.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, promises_1.default.stat(videoPath)];
                case 4:
                    stats = _c.sent();
                    fileName = path_1.default.basename(videoPath);
                    allVideos.push({
                        name: fileName,
                        url: "".concat(process.env.PUBLIC_URL, "/").concat(videoPath),
                        category: category,
                        fileSize: "".concat((stats.size / (1024 * 1024)).toFixed(2), "MB")
                    });
                    return [3 /*break*/, 6];
                case 5:
                    error_1 = _c.sent();
                    logger.warn("Error obteniendo info de ".concat(videoPath, ":"), error_1);
                    return [3 /*break*/, 6];
                case 6:
                    _b++;
                    return [3 /*break*/, 2];
                case 7:
                    _i++;
                    return [3 /*break*/, 1];
                case 8: return [2 /*return*/, allVideos];
            }
        });
    });
}
// Obtener videos por categoría específica
function getVideosByCategory(category) {
    return __awaiter(this, void 0, void 0, function () {
        var videos, categoryVideos, _i, videos_3, videoPath, stats, fileName, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    videos = loadVideosFromCategory(category);
                    categoryVideos = [];
                    _i = 0, videos_3 = videos;
                    _a.label = 1;
                case 1:
                    if (!(_i < videos_3.length)) return [3 /*break*/, 6];
                    videoPath = videos_3[_i];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, promises_1.default.stat(videoPath)];
                case 3:
                    stats = _a.sent();
                    fileName = path_1.default.basename(videoPath);
                    categoryVideos.push({
                        name: fileName,
                        url: "".concat(process.env.PUBLIC_URL, "/").concat(videoPath),
                        category: category,
                        fileSize: "".concat((stats.size / (1024 * 1024)).toFixed(2), "MB")
                    });
                    return [3 /*break*/, 5];
                case 4:
                    error_2 = _a.sent();
                    logger.warn("Error obteniendo info de ".concat(videoPath, ":"), error_2);
                    return [3 /*break*/, 5];
                case 5:
                    _i++;
                    return [3 /*break*/, 1];
                case 6: return [2 /*return*/, categoryVideos];
            }
        });
    });
}
// Función para sugerir videos basados en contenido
function suggestVideosForContent(tweetText, count) {
    if (count === void 0) { count = 3; }
    var category = analyzeContentCategory(tweetText);
    var videos = loadVideosFromCategory(category);
    // Seleccionar videos aleatorios de la categoría
    var shuffled = __spreadArray([], videos, true).sort(function () { return 0.5 - Math.random(); });
    var selected = shuffled.slice(0, count);
    return selected.map(function (videoPath) { return ({
        name: path_1.default.basename(videoPath),
        url: "".concat(process.env.PUBLIC_URL, "/").concat(videoPath),
        category: category,
        fileSize: 'Unknown' // Se calcularía en una implementación real
    }); });
}
// Función para analizar y reportar estadísticas de uso
function getUsageStatistics() {
    var categoryCounts = {
        tech: 0, nature: 0, urban: 0, business: 0, abstract: 0, custom: 0
    };
    var totalVideos = 0;
    for (var _i = 0, _a = Object.entries(videoBank); _i < _a.length; _i++) {
        var _b = _a[_i], category = _b[0], videos = _b[1];
        var count = loadVideosFromCategory(category).length;
        categoryCounts[category] = count;
        totalVideos += count;
    }
    // Encontrar categoría más poblada
    var mostUsedCategory = Object.entries(categoryCounts)
        .reduce(function (a, b) { return categoryCounts[a[0]] > categoryCounts[b[0]] ? a : b; })[0];
    var recommendations = [];
    if (categoryCounts.tech < 3)
        recommendations.push('Agregar más videos de tecnología');
    if (categoryCounts.nature < 3)
        recommendations.push('Agregar más videos de naturaleza');
    if (categoryCounts.business < 3)
        recommendations.push('Agregar más videos corporativos');
    if (totalVideos < 15)
        recommendations.push('Expandir la biblioteca de videos');
    return {
        totalVideos: totalVideos,
        categoryCounts: categoryCounts,
        mostUsedCategory: mostUsedCategory,
        recommendations: recommendations
    };
}
