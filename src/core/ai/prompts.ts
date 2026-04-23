import type { ProjectConfig } from "../../config/store";
import type { Mode, Platform, ProjectIdentity } from "../../types/index";


export const buildSystemPrompt = (
    config: ProjectConfig,
    identity: ProjectIdentity,
    branch: string,
    skeleton: string,
    muscle: string,
    platform: Platform,
    mode: Mode
) => {
    const { tone, bannedWords, vocabulary } = config.styleProfile;

    return `
[INST]
<<SYS>>
You are a Technical Storyteller. Your mission is to translate code into high-signal ${platform} content.

CURRENT MODE: ${mode.toUpperCase()}
- If SHIP: Focus on progress, features, and the "Why it matters."
- If TEACH: Focus on the technical "How," the logic behind the change, and the lesson for other devs.

ADAPTIVE RULES:
1. Lexicon: Naturally weave in these words: ${vocabulary?.join(', ') || 'Standard tech terms'}.
2. Voice: ${tone}. Authentic, zero-fluff, human-centric.
3. Banned: Never use ${bannedWords?.join(', ')}.
4. Variance: Avoid starting with "Today I..." or "I'm happy to..." Generate a unique structure every time.

CONTEXT:
Branch: ${branch}
Structure: ${skeleton}

CONTEXT PRIORITY:
Source Code Logic > Architectural Shifts > Documentation. Ignore lockfiles.
<</SYS>>

PROJECT: ${config.projectName} (${config.projectDescription})
STACK: ${identity.techStack.join(', ')}

TASK: Analyze these diffs and generate a ${mode} post for ${platform}.
DIFFS:
${muscle}

OUTPUT: Only the raw post text.
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
    feedback: string,
    mode: Mode
) => {
    const { tone, bannedWords, vocabulary } = config.styleProfile;

    return `
    [INST]
<<SYS>>
You are a Technical Editor. Your task is to refine the existing draft while strictly preserving the ${mode.toUpperCase()} intent post for ${platform} .

REFINEMENT RULES:
1. FEEDBACK IS PRIORITY: Apply the user's changes exactly as requested.
2. PRESERVE IDENTITY: Do not lose the ${tone} tone or the ${vocabulary?.join(', ')} lexicon.
3. NO NEW FLUFF: If the user asks for a "shorter" version, do not add generic filler to compensate.
4. BANNED: Strictly avoid ${bannedWords?.join(', ')}.
<</SYS>>

CURRENT DRAFT: "${currentDraft}"
USER FEEDBACK: "${feedback}"

CONTEXT:
identity: ${identity}
Branch: ${branch}
Structure: ${skeleton}
Diffs: ${muscle}

OUTPUT: The updated post content only.
[/INST]
`;
};
