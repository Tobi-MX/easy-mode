import type { AIProvider } from "./provider.interface";
import type { ProjectConfig } from "../../config/store";
import type { Platform } from "../../types/index";
import { APIProviderError } from "../../utils/errors";

export class AIService {
    constructor(private provider: AIProvider) { }

    /**
     * Generates a draft with a simple retry mechanism for rate limiting.
     */
    async *generateWithRetry(config: ProjectConfig,
        branch: string,
        skeleton: string,
        muscle: string,
        platform: Platform,
        retries = 2
    ): AsyncGenerator<string> {
        try {
            const stream = this.provider.generateDraftStream(config, branch, skeleton, muscle, platform);

            for await (const chunk of stream) {
                yield chunk;
            }

        } catch (error: any) {
            if (retries > 0 && error.status === 429) {
                console.log("\n⚠️ Rate limit hit. Retrying in 2 seconds...");
                await new Promise(res => setTimeout(res, 2000));
                yield* this.generateWithRetry(config, branch, skeleton, muscle, platform, retries - 1);
            }

            if (error.status === 429) {
                throw new APIProviderError("Rate limit hit permanently. Please try again later.");
            }

            throw new APIProviderError(error.message || "Failed to communicate with the AI provider.");
        }
    }

    /**
     * Refines an existing draft based on user feedback.
     */
    async refine(currentDraft: string, feedback: string): Promise<string> {
        // We could also add retry logic here if needed
        return await this.provider.refineDraft(currentDraft, feedback);
    }
}