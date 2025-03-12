/**
 * 图片生成器的配置选项
 */
export interface ImageGeneratorConfig {
    apiKey?: string;
    [key: string]: any;
}

/**
 * 图片生成结果
 */
export interface ImageGenerationResult {
    images: string[];
    metadata?: Record<string, any>;
}

/**
 * 抽象图片生成器基类
 */
export abstract class BaseImageGenerator {
    /**
     * 获取API提供者名称
     */
    protected abstract readonly providerName: string;

    protected config: ImageGeneratorConfig;

    constructor(config: ImageGeneratorConfig) {
        this.validateConfig(config);
        this.config = config;
    }

    /**
     * 验证配置
     * @param config - 配置选项
     */
    protected abstract validateConfig(config: ImageGeneratorConfig): void;

    /**
     * 生成图片
     * @param prompt - 图片生成提示词
     * @returns 生成的图片URL数组
     */
    public abstract createImage(prompt: string): Promise<string[]>;

    /**
     * 处理API响应
     * @param response - API响应
     */
    protected abstract handleResponse(response: any): Promise<ImageGenerationResult>;

    /**
     * 错误处理
     * @param error - 错误信息
     */
    protected handleError(error: any): never {
        throw new Error(`图片生成失败: ${error.message || error}`);
    }
}