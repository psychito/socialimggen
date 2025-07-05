import { TweetData, VideoOptions, GenerationResponse } from '../types';
export declare function generateVideo(tweetData: TweetData, options: VideoOptions, requestId: string): Promise<GenerationResponse>;
export declare function checkSystemCapacity(): Promise<{
    canProcess: boolean;
    reason?: string;
}>;
export declare function getProcessingStats(): Promise<{
    activeJobs: number;
    completedToday: number;
    averageProcessingTime: number;
    systemLoad: {
        memory: number;
        cpu: number;
    };
}>;
export declare function generateAdvancedVideo(tweetData: TweetData, options: VideoOptions & {
    watermark?: string;
    intro?: {
        duration: number;
        text: string;
    };
    outro?: {
        duration: number;
        text: string;
    };
    transitions?: Array<{
        type: string;
        duration: number;
    }>;
}, requestId: string): Promise<GenerationResponse>;
export declare function generateVideoVariations(tweetData: TweetData, baseOptions: VideoOptions, variations: Array<Partial<VideoOptions>>, requestId: string): Promise<Array<GenerationResponse & {
    variation: string;
}>>;
export declare function scheduleVideoGeneration(tweetData: TweetData, options: VideoOptions, scheduleTime: Date): Promise<{
    success: boolean;
    jobId: string;
    scheduledFor: string;
}>;
export declare function cancelVideoGeneration(requestId: string): {
    success: boolean;
    message: string;
};
export declare function getGenerationProgress(requestId: string): {
    stage: string;
    percentage: number;
    message: string;
    estimatedTimeRemaining?: number;
};
//# sourceMappingURL=videoGenerator.d.ts.map