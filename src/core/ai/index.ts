import type { AIProvider } from "./provider.interface.js";
import type { ProjectConfig } from "../../config/store.js";
import type { Platform } from "../../types/index.js";
import { APIProviderError } from "../../utils/error.js";

export class AIService {
    constructor(private provider: AIProvider) { }

    /**
     * Generates a draft with a simple retry mechanism for rate limiting.
     */
    async generateWithRetry(config: ProjectConfig, branch: string, skeleton: string, muscle: string, platform: Platform, retries = 2): Promise<string> {
        try {
            return await this.provider.generateDraft(config, branch, skeleton, muscle, platform);
        } catch (error: any) {
            if (retries > 0 && error.status === 429) {
                console.log("\n⚠️ Rate limit hit. Retrying in 2 seconds...");
                await new Promise(res => setTimeout(res, 2000));
                return this.generateWithRetry(config, branch, skeleton, muscle, platform, retries - 1);
            }

            if (error.status === 429) {
                throw new APIProviderError("Rate limit hit permanently. Please try again later.");
            }

            throw new APIProviderError(error.message || "Failed to communicate with the AI provider.");
        }
    }
}