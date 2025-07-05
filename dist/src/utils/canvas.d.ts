import { CanvasRenderingContext2D } from 'canvas';
import { TweetData, VideoOptions, GlassmorphismConfig, TextRenderOptions } from '../types';
import type { CanvasGradient } from 'canvas';
export declare function generateGlassmorphismOverlay(tweetData: TweetData, options: VideoOptions, requestId: string): Promise<string>;
export declare function drawGlassmorphismContainer(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, config: GlassmorphismConfig): void;
export declare function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number, topOnly?: boolean): void;
export declare function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, lineHeight: number): string[];
export declare function renderTextWithEffects(ctx: CanvasRenderingContext2D, options: TextRenderOptions): void;
export declare function createDynamicGradient(ctx: CanvasRenderingContext2D, width: number, height: number, colors: string[], type?: 'linear' | 'radial'): CanvasGradient;
export declare function applyImageFilter(ctx: CanvasRenderingContext2D, filter: 'blur' | 'brightness' | 'contrast' | 'saturate', value: number): void;
export declare function getDominantColor(imagePath: string): Promise<string>;
export declare function createDotPattern(ctx: CanvasRenderingContext2D, width: number, height: number, dotSize?: number, spacing?: number, opacity?: number): void;
export declare function validateCanvasDimensions(width: number, height: number): {
    isValid: boolean;
    adjustedWidth?: number;
    adjustedHeight?: number;
    warnings: string[];
};
//# sourceMappingURL=canvas.d.ts.map