import type { ProjectConfig } from "../../config/store";
import type { Platform, ProjectIdentity } from "../../types/index";

export const buildSystemPrompt = (
    config: ProjectConfig,
    identity: ProjectIdentity,
    branch: string,
    skeleton: string,
    muscle: string,
    platform: Platform
) => {
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
- The post is an update. Choose a natural way to start that fits the ${platform} culture.
- Make sure everything is based on context provided.
- Do not just list files. Explain the logic and the "Why".
- If for X (Twitter): Punchy, quality, under 280 chars.
- If for LinkedIn: Insightful, milestone-driven, quality, formatted for readability.
- Output ONLY the post content.
[/INST]
`;
};

export const buildRefinePrompt = (
    config: ProjectConfig,
    identity: ProjectIdentity,
    branch: string,
    skeleton: string,
    muscle: string,
    platform: Platform,
    currentDraft: string,
    feedback: string
) => {
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
- The post is an update. Choose a natural way to start that fits the ${platform} culture.
- Make sure everything is based on context provided.
- Do not just list files. Explain the logic and the "Why".
- If for X (Twitter): Punchy, quality, under 280 chars.
- If for LinkedIn: Insightful, milestone-driven, quality, formatted for readability.
- Output ONLY the post content.
[/INST]
`;
};
