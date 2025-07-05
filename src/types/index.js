"use strict";
// src/types/index.ts - Definiciones de tipos para el proyecto
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_GLASSMORPHISM_CONFIG = exports.DEFAULT_IMAGE_OPTIONS = exports.DEFAULT_VIDEO_OPTIONS = void 0;
exports.isValidTweetData = isValidTweetData;
exports.isValidVideoOptions = isValidVideoOptions;
exports.DEFAULT_VIDEO_OPTIONS = {
    duration: 10,
    fps: 30,
    width: 1080,
    height: 1920,
    style: 'glassmorphism',
    animation: 'fade',
    quality: 'medium'
};
exports.DEFAULT_IMAGE_OPTIONS = {
    width: 1200,
    height: 630,
    format: 'png',
    quality: 85,
    theme: 'dark'
};
exports.DEFAULT_GLASSMORPHISM_CONFIG = {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderColor: 'rgba(255, 255, 255, 0.25)',
    textColor: '#ffffff',
    secondaryTextColor: 'rgba(255, 255, 255, 0.7)',
    backdropBlur: 10,
    borderRadius: 20,
    opacity: 0.9
};
// Funciones de utilidad para tipos
function isValidTweetData(data) {
    return (typeof data === 'object' &&
        typeof data.username === 'string' &&
        typeof data.displayName === 'string' &&
        typeof data.text === 'string' &&
        typeof data.likes === 'number' &&
        typeof data.retweets === 'number' &&
        typeof data.replies === 'number' &&
        typeof data.timestamp === 'string');
}
function isValidVideoOptions(options) {
    return (typeof options === 'object' &&
        typeof options.duration === 'number' &&
        typeof options.fps === 'number' &&
        typeof options.width === 'number' &&
        typeof options.height === 'number' &&
        ['glassmorphism', 'solid', 'gradient'].includes(options.style));
}
