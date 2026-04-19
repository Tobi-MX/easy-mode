import { GoogleGenerativeAI, type GenerativeModel } from "@google/generative-ai";
import type { AIProvider } from "./provider.interface";
import type { ProjectConfig } from "../../config/store";
import type { Platform, ProjectIdentity } from "../../types/index";
import { APIProviderError } from "../../utils/errors";
import * as fs from 'fs';
import { buildSystemPrompt, buildRefinePrompt } from "./prompts";

export class GeminiProvider implements AIProvider {
    private model: GenerativeModel;

    constructor(apiKey: string) {
        const genAI = new GoogleGenerativeAI(apiKey);
        this.model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    }

    async *generateDraftStream(
        config: ProjectConfig,
        identity: ProjectIdentity,
        branch: string,
        skeleton: string,
        muscle: string,
        platform: Platform,
        imagePath?: string
    ): AsyncGenerator<string> {
        const prompt = buildSystemPrompt(config, identity, branch, skeleton, muscle, platform);
        const parts: any[] = [{ text: prompt }];

        if (imagePath && fs.existsSync(imagePath)) {
            // Basic dynamic mime detection
            const ext = imagePath.split('.').pop()?.toLowerCase();
            const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

            parts.push({
                inlineData: {
                    data: fs.readFileSync(imagePath).toString("base64"),
                    mimeType,
                },
            });
        }

        try {
            const result = await this.model.generateContentStream(parts);
            for await (const chunk of result.stream) {
                const text = chunk.text();
                if (text) yield text;
            }
        } catch (error: any) {
            throw new APIProviderError(`Gemini Stream Error: ${error.message}`);
        }
    }

    async refineDraft(
        config: ProjectConfig,
        identity: ProjectIdentity,
        branch: string,
        skeleton: string,
        muscle: string,
        platform: Platform,
        currentDraft: string,
        feedback: string
    ): Promise<string> {
        const prompt = buildRefinePrompt(config, identity, branch, skeleton, muscle, platform, currentDraft, feedback);
        try {
            const result = await this.model.generateContent(prompt);
            return result.response.text();
        } catch (error: any) {
            throw new APIProviderError("Refinement failed.");
        }
    }
}