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
}