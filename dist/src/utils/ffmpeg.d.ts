import { VideoOptions } from '../types';
export declare function combineVideoWithOverlay(backgroundPath: string, overlayPath: string, options: VideoOptions, requestId: string): Promise<string>;
export declare function optimizeBackgroundVideo(inputPath: string, requestId: string): Promise<string>;
export declare function getVideoInfo(videoPath: string): Promise<{
    duration: number;
    width: number;
    height: number;
    fps: number;
    codec: string;
    bitrate: number;
}>;
export declare function generateVideoThumbnail(videoPath: string, outputPath: string, timeOffset?: number): Promise<string>;
export declare function convertVideoToGif(videoPath: string, outputPath: string, options?: {
    width?: number;
    fps?: number;
    duration?: number;
    startTime?: number;
}): Promise<string>;
export declare function validateFFmpegInstallation(): Promise<{
    isInstalled: boolean;
    version?: string;
    features: string[];
    errors: string[];
}>;
export declare function getProcessingStats(): Promise<{
    activeJobs: number;
    queueLength: number;
    averageProcessingTime: number;
    successRate: number;
}>;
export declare function cleanupFFmpegTempFiles(): Promise<number>;
//# sourceMappingURL=ffmpeg.d.ts.map