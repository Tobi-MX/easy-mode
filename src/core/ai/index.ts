import type { AIProvider } from "./provider.interface";
import type { ProjectConfig } from "../../config/store";
import type { Platform, ProjectIdentity } from "../../types/index";
import { APIProviderError } from "../../utils/errors";

export class AIService {
    constructor(private provider: AIProvider) { }

    /**
     * Generates a draft with a simple retry mechanism for rate limiting.
     */
    async *generateWithRetry(
        config: ProjectConfig,
        identity: ProjectIdentity,
        branch: string,
        skeleton: string,
        muscle: string,
        platform: Platform,
        retries = 2
    ): AsyncGenerator<string> {
        try {
            const stream = this.provider.generateDraftStream(config, identity, branch, skeleton, muscle, platform);

            for await (const chunk of stream) {
                yield chunk;
            }

        } catch (error: any) {
            const isRateLimit =
                error?.status === 429 ||
                error?.code === 429 ||
                error?.error?.code === 429 ||
                error?.status === "RESOURCE_EXHAUSTED";

            if (retries > 0 && isRateLimit) {
                console.log("\n⚠️ Rate limit hit. Retrying in 2 seconds...");
                await new Promise(res => setTimeout(res, 2000));
                yield* this.generateWithRetry(config, identity, branch, skeleton, muscle, platform, retries - 1);
            }

            if (isRateLimit) {
                throw new APIProviderError("Rate limit hit permanently. Please try again later.");
            }

            throw new APIProviderError(error.message || "Failed to communicate with the AI provider.");
        }
    }

    /**
     * Refines an existing draft based on user feedback.
     */
    async refine(
        config: ProjectConfig,
        identity: ProjectIdentity,
        branch: string,
        skeleton: string,
        muscle: string,
        platform: Platform,
        currentDraft: string,
        feedback: string): Promise<string> {
        // We could also add retry logic here if needed
        return await this.provider.refineDraft(
            config,
            identity,
            branch,
            skeleton,
            muscle,
            platform,
            currentDraft,
            feedback
        );
    }
}