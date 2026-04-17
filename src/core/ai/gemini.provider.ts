import { GoogleGenerativeAI, type GenerativeModel } from "@google/generative-ai";
import type { AIProvider } from "./provider.interface";
import type { ProjectConfig } from "../../config/store";
import type { Platform } from "../../types/index";
import { APIProviderError } from "../../utils/errors";
import * as fs from 'fs';

export class GeminiProvider implements AIProvider {
    private model: GenerativeModel;

    constructor(apiKey: string) {
        const genAI = new GoogleGenerativeAI(apiKey);
        this.model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    }

    async *generateDraftStream(
        config: ProjectConfig,
        branch: string,
        skeleton: string,
        muscle: string,
        platform: Platform,
        imagePath?: string
    ): AsyncGenerator<string> {
        const prompt = this.buildPrompt(config, branch, skeleton, muscle, platform);
        const parts: any[] = [{ text: prompt }];

        if (imagePath && fs.existsSync(imagePath)) {
            parts.push({
                inlineData: {
                    data: fs.readFileSync(imagePath).toString("base64"),
                    mimeType: "image/png", // Should be dynamic in production
                },
            });
        }
        try {
            const result = await this.model.generateContentStream(parts);
            for await (const chunk of result.stream) {
                yield chunk.text();
            }
        } catch (error: any) {
            throw new APIProviderError(`Gemini Stream Error: ${error.message}`);
        }
    }

    /**
     * Used for the "Refine" feature in the Edit Loop.
     */
    async refineDraft(
        config: ProjectConfig,
        branch: string,
        skeleton: string,
        muscle: string,
        platform: Platform,
        currentDraft: string,
        feedback: string
    ): Promise<string> {
        const prompt = this.draftPrompt(config, branch, skeleton, muscle, platform, currentDraft, feedback);
        try {
            const result = await this.model.generateContent(prompt);
            return result.response.text();
        } catch (error: any) {
            throw new APIProviderError("Refinement failed.");
        }
    }

    private draftPrompt(
        config: ProjectConfig,
        branch: string,
        skeleton: string,
        muscle: string,
        platform: Platform,
        currentDraft: string,
        feedback: string
    ) {
        return `Identify as: Senior Software Founder. 
    Project: ${config.projectName} (${config.projectDescription}). 
    Context: ${branch}. 
    Structure: ${skeleton}. 
    Changes: ${muscle}.
    Task: CURRENT DRAFT: "${currentDraft}"FEEDBACK: "${feedback}"Rewrite the draft based on the feedback for a ${platform}. Output ONLY the new draft.
    POST GUIDELINES:
      - Make sure everything is based on context provided.
      - Do not just list files. Explain the logic and the "Why".
      - Tone: Professional builder. Confident but not arrogant.
      - If for X (Twitter): Punchy, focused on shipping, under 280 chars.
      - If for LinkedIn: Insightful, milestone-driven, formatted for readability.
      - Output ONLY the post content.`;
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
      - Make sure everything is based on context provided.
      - Do not just list files. Explain the logic and the "Why".
      - Tone: Professional builder. Confident but not arrogant.
      - If for X (Twitter): Punchy, focused on shipping, under 280 chars.
      - If for LinkedIn: Insightful, milestone-driven, formatted for readability.
      - Output ONLY the post content.`;
    }
}