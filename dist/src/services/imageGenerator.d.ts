import { TweetData, ImageOptions, GenerationResponse } from '../types';
export declare function generateSocialImage(tweetData: TweetData, options: ImageOptions & {
    backgroundImage?: string;
    aspectRatio?: string;
}, requestId: string): Promise<GenerationResponse>;
export declare function generateImageWithTemplate(tweetData: TweetData, templateName: string, customOptions: Partial<ImageOptions> | undefined, requestId: string): Promise<GenerationResponse>;
export declare function generateCustomSizeImage(tweetData: TweetData, width: number, height: number, requestId: string): Promise<GenerationResponse>;
export declare function generateMultipleFormats(tweetData: TweetData, baseOptions: ImageOptions, requestId: string): Promise<Array<GenerationResponse & {
    format: string;
}>>;
export declare function processAvatarImage(avatarPath: string, requestId: string): Promise<{
    optimizedPath: string;
    size: string;
}>;
//# sourceMappingURL=imageGenerator.d.ts.map