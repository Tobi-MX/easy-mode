import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AIProvider } from "./provider.interface";
import type { ProjectConfig } from "../../config/store";
import type { Platform } from "../../types/index";
import { APIProviderError } from "../../utils/errors";

export class GeminiProvider implements AIProvider {
    private model: any;

    constructor(apiKey: string) {
        const genAI = new GoogleGenerativeAI(apiKey);
        this.model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    }

    async generateDraft(
        config: ProjectConfig,
        branch: string,
        skeleton: string,
        muscle: string,
        platform: Platform
    ): Promise<string> {
        const prompt = this.buildPrompt(config, branch, skeleton, muscle, platform);
        try {
            const result = await this.model.generateContent(prompt);
            return result.response.text();
        } catch (error: any) {
            // Log the actual error for debugging behind the scenes
            console.error("Gemini API Error details:", error.message);

            // Throw our custom error so the CLI UI handles it gracefully
            throw new APIProviderError("Failed to communicate with Google Gemini.");
        }
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
      - If for X (Twitter): Punchy, focused on shipping, under 280 chars.
      - If for LinkedIn: Insightful, milestone-driven, formatted for readability.
      - Output ONLY the post content.`;
    }
}