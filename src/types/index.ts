export type Platform = 'X' | 'LINKEDIN' | 'DISCORD';

export interface ProjectConfig {
    projectName: string;
    projectDescription: string;
}

export interface ExtractionContext {
    branch: string;
    muscle: string;    // The filtered git diff
    skeleton: string;  // The project directory tree
}

export interface ProjectIdentity {
    techStack: string[];
    maturity: string; // Based on version or README length
    corePurpose: string;
}