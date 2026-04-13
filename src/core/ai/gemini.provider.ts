import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AIProvider } from "./provider.interface.js";
import type { ProjectConfig } from "../../config/store.js";
import type { Platform } from "../../types/index.js";

export class GeminiProvider implements AIProvider {
    private model: any;

    constructor(apiKey: string) {
        const genAI = new GoogleGenerativeAI(apiKey);
        // 1.5 Flash is great for high-volume technical diffs
        this.model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    }

    async generateDraft(
        config: ProjectConfig,
        branch: string,
        skeleton: string,
        muscle: string,
        platform: Platform
    ): Promise<string> {
        const prompt = this.buildPrompt(config, branch, skeleton, muscle, platform);
        const result = await this.model.generateContent(prompt);
        return result.response.text();
    }

    private buildPrompt(
        config: ProjectConfig,
        branch: string,
        skeleton: string,
        muscle: string,
        platform: Platform
    ) {
        return `Identify as: Senior Software Founder. 
    Project: ${config.projectName} (${config.projectDescription}). 
    Context: ${branch}. 
    Structure: ${skeleton}. 
    Changes: ${muscle}.
    Task: Analyze these technical changes and write a high-signal ${platform} post focused on value and progress.
    POST GUIDELINES:
      - Do not just list files. Explain the logic and the "Why".
      - Tone: Professional builder. Confident but not arrogant.
      - X (Twitter): Punchy, focused on shipping, under 280 chars.
      - LinkedIn: Insightful, milestone-driven, formatted for readability.
      - Output ONLY the post content.`;
    }
}