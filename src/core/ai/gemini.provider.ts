import { GoogleGenerativeAI, type GenerativeModel } from "@google/generative-ai";
import type { AIProvider } from "./provider.interface";
import type { ProjectConfig } from "../../config/store";
import type { Platform, ProjectIdentity } from "../../types/index";
import { APIProviderError } from "../../utils/errors";
import * as fs from 'fs';

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
        const prompt = this.buildPrompt(config, identity, branch, skeleton, muscle, platform);
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
        identity: ProjectIdentity,
        branch: string,
        skeleton: string,
        muscle: string,
        platform: Platform,
        currentDraft: string,
        feedback: string
    ): Promise<string> {
        const prompt = this.draftPrompt(config, identity, branch, skeleton, muscle, platform, currentDraft, feedback);
        try {
            const result = await this.model.generateContent(prompt);
            return result.response.text();
        } catch (error: any) {
            throw new APIProviderError("Refinement failed.");
        }
    }

    private draftPrompt(
        config: ProjectConfig,
        identity: ProjectIdentity,
        branch: string,
        skeleton: string,
        muscle: string,
        platform: Platform,
        currentDraft: string,
        feedback: string
    ) {
        const { tone, bannedWords, vocabulary } = config.styleProfile;

        return `
    [INST]
    ROLE: Senior Software Architect & Founder.
    PROJECT: ${config.projectName} (${config.projectDescription}).
    TECH STACK: ${identity.techStack.join(', ')}.
    
    Task: CURRENT DRAFT: "${currentDraft}"FEEDBACK: "${feedback}"Rewrite the draft based on the feedback for ${platform}. Output ONLY the new draft. MAKE SURE FEEDBACK IS PRIORITY!!!
    
    INTENT CATEGORIZATION:
    1. LOGIC: What algorithmic or functional changes occurred?
    2. ARCHITECTURE: How does this change the "Skeleton" or system design?
    3. VALUE: Why does this matter to the end user or the business?

    STRICT CONSTRAINTS:
    - VOICE: ${tone}. No corporate jargon. No "AI fluff."
    - ${vocabulary ? `FAVORED TERMS: ${vocabulary.join(', ')}` : ''}
    - ${bannedWords ? `Banned: ${bannedWords.join(', ')}` : ''}
    - AUTHORITY: Match the user's technical density. If the code is complex, the post should be precise.
    
    CONTEXT:
    Branch: ${branch}
    Structure: ${skeleton}
    Diffs: ${muscle}
    
    OUTPUT: A punchy, milestone-driven post focused on technical progress.

    POST GUIDELINES:
      - The post is an update, it should start with update on...
      - Make sure everything is based on context provided.
      - Do not just list files. Explain the logic and the "Why".
      - If for X (Twitter): Punchy, quality, under 280 chars.
      - If for LinkedIn: Insightful, milestone-driven, quality, formatted for readability.
      - Output ONLY the post content.
    [/INST]
    `;
    }

    private buildPrompt(
        config: ProjectConfig,
        identity: ProjectIdentity, // Pass the new identity here
        branch: string,
        skeleton: string,
        muscle: string,
        platform: Platform
    ) {
        const { tone, bannedWords, vocabulary } = config.styleProfile;

        return `
    [INST]
    ROLE: Senior Software Architect & Founder.
    PROJECT: ${config.projectName} (${config.projectDescription}).
    TECH STACK: ${identity.techStack.join(', ')}.
    
    TASK: Analyze the provided Git Diffs and generate a high-signal ${platform} post.
    
    INTENT CATEGORIZATION:
    1. LOGIC: What algorithmic or functional changes occurred?
    2. ARCHITECTURE: How does this change the "Skeleton" or system design?
    3. VALUE: Why does this matter to the end user or the business?

    STRICT CONSTRAINTS:
    - VOICE: ${tone}. No corporate jargon. No "AI fluff."
    - ${vocabulary ? `FAVORED TERMS: ${vocabulary.join(', ')}` : ''}
    - ${bannedWords ? `Banned: ${bannedWords.join(', ')}` : ''}
    - AUTHORITY: Match the user's technical density. If the code is complex, the post should be precise.
    
    CONTEXT:
    Branch: ${branch}
    Structure: ${skeleton}
    Diffs: ${muscle}
    
    OUTPUT: A punchy, milestone-driven post focused on technical progress.

    POST GUIDELINES:
      - The post is an update, it should start with update on...
      - Make sure everything is based on context provided.
      - Do not just list files. Explain the logic and the "Why".
      - If for X (Twitter): Punchy, quality, under 280 chars.
      - If for LinkedIn: Insightful, milestone-driven, quality, formatted for readability.
      - Output ONLY the post content.
    [/INST]
    `;
    }
}