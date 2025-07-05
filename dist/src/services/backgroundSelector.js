"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectBackgroundVideo = selectBackgroundVideo;
exports.getAllAvailableVideos = getAllAvailableVideos;
exports.getVideosByCategory = getVideosByCategory;
exports.suggestVideosForContent = suggestVideosForContent;
exports.getUsageStatistics = getUsageStatistics;
const fs = __importStar(require("fs"));
const fsPromises = __importStar(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const winston_1 = __importDefault(require("winston"));
const logger = winston_1.default.createLogger({
    level: 'info',
    format: winston_1.default.format.json(),
    transports: [
        new winston_1.default.transports.File({ filename: 'logs/background-selector.log' })
    ]
});
const videoBank = {
    tech: [],
    nature: [],
    urban: [],
    abstract: [],
    business: [],
    custom: []
};
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
};
function selectBackgroundVideo(tweetText, customPath) {
    if (customPath && fs.existsSync(customPath)) {
        return customPath;
    }
    const category = analyzeContentCategory(tweetText);
    const selectedVideo = getRandomVideoFromCategory(category);
    logger.info('Video de fondo seleccionado', {
        tweetText: tweetText.substring(0, 50) + '...',
        detectedCategory: category,
        selectedVideo
    });
    return selectedVideo;
}
function analyzeContentCategory(text) {
    const normalizedText = text.toLowerCase();
    const scores = {
        tech: 0,
        nature: 0,
        urban: 0,
        business: 0,
        abstract: 0,
        custom: 0
    };
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
        for (const keyword of keywords) {
            if (normalizedText.includes(keyword)) {
                scores[category] += 1;
                if (normalizedText.indexOf(keyword) < 50) {
                    scores[category] += 0.5;
                }
            }
        }
    }
    const emojiAnalysis = analyzeEmojis(text);
    for (const [category, weight] of Object.entries(emojiAnalysis)) {
        scores[category] += weight;
    }
    const hashtagAnalysis = analyzeHashtags(text);
    for (const [category, weight] of Object.entries(hashtagAnalysis)) {
        scores[category] += weight;
    }
    let bestCategory = 'abstract';
    let bestScore = 0;
    for (const [category, score] of Object.entries(scores)) {
        if (score > bestScore) {
            bestScore = score;
            bestCategory = category;
        }
    }
    if (bestScore === 0) {
        bestCategory = analyzeSentiment(text);
    }
    return bestCategory;
}
function analyzeEmojis(text) {
    const scores = {
        tech: 0, nature: 0, urban: 0, business: 0, abstract: 0, custom: 0
    };
    const emojiCategories = {
        tech: ['💻', '🖥️', '📱', '⚡', '🚀', '🤖', '🔬', '⚙️', '🛠️', '💡'],
        nature: ['🌳', '🌲', '🌿', '🌺', '🌸', '🦋', '🐝', '🌅', '🌄', '🌊', '⛰️'],
        urban: ['🏙️', '🌃', '🏢', '🚗', '🚕', '🚇', '🍕', '☕', '🛍️', '🎭'],
        business: ['💼', '📊', '📈', '💰', '💳', '🏦', '🤝', '👔', '📋', '🎯'],
        abstract: ['✨', '🎨', '🌈', '🔮', '💫', '⭐', '🌟', '🎪', '🎭', '🎬']
    };
    for (const [category, emojis] of Object.entries(emojiCategories)) {
        for (const emoji of emojis) {
            if (text.includes(emoji)) {
                scores[category] += 2;
            }
        }
    }
    return scores;
}
function analyzeHashtags(text) {
    const scores = {
        tech: 0, nature: 0, urban: 0, business: 0, abstract: 0, custom: 0
    };
    const hashtags = text.match(/#\w+/g) || [];
    for (const hashtag of hashtags) {
        const tag = hashtag.toLowerCase();
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
function analyzeSentiment(text) {
    const positiveWords = ['amazing', 'awesome', 'great', 'fantastic', 'wonderful', 'excited', 'love'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'disappointed'];
    const calmWords = ['peaceful', 'calm', 'relax', 'meditation', 'zen'];
    const energeticWords = ['energy', 'power', 'dynamic', 'fast', 'speed', 'action'];
    const normalizedText = text.toLowerCase();
    let positiveScore = 0;
    let negativeScore = 0;
    let calmScore = 0;
    let energeticScore = 0;
    for (const word of positiveWords) {
        if (normalizedText.includes(word))
            positiveScore++;
    }
    for (const word of negativeWords) {
        if (normalizedText.includes(word))
            negativeScore++;
    }
    for (const word of calmWords) {
        if (normalizedText.includes(word))
            calmScore++;
    }
    for (const word of energeticWords) {
        if (normalizedText.includes(word))
            energeticScore++;
    }
    if (calmScore > 0)
        return 'nature';
    if (energeticScore > 0)
        return 'urban';
    if (positiveScore > negativeScore)
        return 'abstract';
    return 'abstract';
}
function getRandomVideoFromCategory(category) {
    let videos = videoBank[category] || [];
    if (videos.length === 0 || category === 'custom') {
        videos = loadVideosFromCategory(category);
    }
    if (videos.length === 0) {
        logger.warn(`No hay videos en categoría ${category}, usando abstract`);
        videos = videoBank.abstract;
    }
    const randomIndex = Math.floor(Math.random() * videos.length);
    const selectedVideo = videos[randomIndex];
    if (fs.existsSync(selectedVideo) && !fs.existsSync(selectedVideo)) {
        logger.warn(`Video no encontrado: ${selectedVideo}, intentando con otro`);
        const existingVideos = videos.filter(video => fs.existsSync(video));
        if (existingVideos.length > 0) {
            return existingVideos[Math.floor(Math.random() * existingVideos.length)];
        }
        else {
            return findAnyExistingVideo();
        }
    }
    return selectedVideo;
}
function loadVideosFromCategory(category) {
    try {
        const categoryPath = `videos/${category}`;
        const files = fs.readdirSync(categoryPath);
        const videoFiles = files
            .filter(file => file.match(/\.(mp4|mov|avi|mkv|webm)$/i))
            .map(file => path_1.default.join(categoryPath, file));
        videoBank[category] = videoFiles;
        logger.info(`Cargados ${videoFiles.length} videos para categoría ${category}`);
        return videoFiles;
    }
    catch (error) {
        logger.warn(`Error cargando videos de ${category}:`, error);
        return [];
    }
}
function findAnyExistingVideo() {
    for (const [category, videos] of Object.entries(videoBank)) {
        for (const video of videos) {
            if (fs.existsSync(video)) {
                logger.info(`Usando video de fallback de ${category}: ${video}`);
                return video;
            }
        }
    }
    throw new Error('No hay videos de fondo disponibles');
}
async function getAllAvailableVideos() {
    const allVideos = [];
    for (const category of Object.keys(videoBank)) {
        const videos = loadVideosFromCategory(category);
        for (const videoPath of videos) {
            try {
                const stats = await fsPromises.stat(videoPath);
                const fileName = path_1.default.basename(videoPath);
                allVideos.push({
                    name: fileName,
                    url: `${process.env.PUBLIC_URL}/${videoPath}`,
                    category,
                    fileSize: `${(stats.size / (1024 * 1024)).toFixed(2)}MB`
                });
            }
            catch (error) {
                logger.warn(`Error obteniendo info de ${videoPath}:`, error);
            }
        }
    }
    return allVideos;
}
async function getVideosByCategory(category) {
    const videos = loadVideosFromCategory(category);
    const categoryVideos = [];
    for (const videoPath of videos) {
        try {
            const stats = await fsPromises.stat(videoPath);
            const fileName = path_1.default.basename(videoPath);
            categoryVideos.push({
                name: fileName,
                url: `${process.env.PUBLIC_URL}/${videoPath}`,
                category,
                fileSize: `${(stats.size / (1024 * 1024)).toFixed(2)}MB`
            });
        }
        catch (error) {
            logger.warn(`Error obteniendo info de ${videoPath}:`, error);
        }
    }
    return categoryVideos;
}
function suggestVideosForContent(tweetText, count = 3) {
    const category = analyzeContentCategory(tweetText);
    const videos = loadVideosFromCategory(category);
    const shuffled = [...videos].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, count);
    return selected.map(videoPath => ({
        name: path_1.default.basename(videoPath),
        url: `${process.env.PUBLIC_URL}/${videoPath}`,
        category,
        fileSize: 'Unknown'
    }));
}
function getUsageStatistics() {
    const categoryCounts = {
        tech: 0, nature: 0, urban: 0, business: 0, abstract: 0, custom: 0
    };
    let totalVideos = 0;
    for (const [category, videos] of Object.entries(videoBank)) {
        const count = loadVideosFromCategory(category).length;
        categoryCounts[category] = count;
        totalVideos += count;
    }
    const mostUsedCategory = Object.entries(categoryCounts)
        .reduce((a, b) => categoryCounts[a[0]] > categoryCounts[b[0]] ? a : b)[0];
    const recommendations = [];
    if (categoryCounts.tech < 3)
        recommendations.push('Agregar más videos de tecnología');
    if (categoryCounts.nature < 3)
        recommendations.push('Agregar más videos de naturaleza');
    if (categoryCounts.business < 3)
        recommendations.push('Agregar más videos corporativos');
    if (totalVideos < 15)
        recommendations.push('Expandir la biblioteca de videos');
    return {
        totalVideos,
        categoryCounts,
        mostUsedCategory,
        recommendations
    };
}
//# sourceMappingURL=backgroundSelector.js.map