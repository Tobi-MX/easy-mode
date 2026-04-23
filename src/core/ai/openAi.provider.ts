import OpenAI from "openai";
import type { AIProvider } from "./provider.interface";
import type { ProjectConfig } from "../../config/store";
import type { Mode, Platform, ProjectIdentity } from "../../types/index";
import { APIProviderError } from "../../utils/errors";
import { buildSystemPrompt, buildRefinePrompt } from "./prompts";

export class OpenAIProvider implements AIProvider {
    private client: OpenAI;
    private model: string;

    constructor(apiKey: string, model: string = "gpt-4o") {
        this.client = new OpenAI({ apiKey });
        this.model = model;
    }

    async *generateDraftStream(
        config: ProjectConfig,
        identity: ProjectIdentity,
        branch: string,
        skeleton: string,
        muscle: string,
        platform: Platform,
        mode: Mode
    ): AsyncGenerator<string> {
        const prompt = buildSystemPrompt(config, identity, branch, skeleton, muscle, platform, mode);

        try {
            const stream = await this.client.chat.completions.create({
                model: this.model,
                messages: [
                    { role: "system", content: "You are a helpful assistant." },
                    { role: "user", content: prompt }
                ],
                stream: true,
            });

            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || "";
                if (content) yield content;
            }
        } catch (error: any) {
            throw new APIProviderError(`OpenAI Stream Error: ${error.message}`);
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
        feedback: string,
        mode: Mode
    ): Promise<string> {
        const prompt = buildRefinePrompt(config, identity, branch, skeleton, muscle, platform, currentDraft, feedback, mode);
        try {
            const response = await this.client.chat.completions.create({
                model: this.model,
                messages: [
                    { role: "system", content: "You are a helpful assistant." },
                    { role: "user", content: prompt }
                ],
            });
            return response.choices[0]?.message?.content || "";
        } catch (error: any) {
            throw new APIProviderError(`OpenAI Refinement failed: ${error.message}`);
        }
    }
}
