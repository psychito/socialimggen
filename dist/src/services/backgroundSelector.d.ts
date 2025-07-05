import { VideoCategory, BackgroundVideo } from '../types';
export declare function selectBackgroundVideo(tweetText: string, customPath?: string): string;
export declare function getAllAvailableVideos(): Promise<BackgroundVideo[]>;
export declare function getVideosByCategory(category: VideoCategory): Promise<BackgroundVideo[]>;
export declare function suggestVideosForContent(tweetText: string, count?: number): BackgroundVideo[];
export declare function getUsageStatistics(): {
    totalVideos: number;
    categoryCounts: Record<VideoCategory, number>;
    mostUsedCategory: VideoCategory;
    recommendations: string[];
};
//# sourceMappingURL=backgroundSelector.d.ts.map