import { simpleGit } from 'simple-git';
import type { SimpleGit } from 'simple-git';
import { Mode } from '../types';

const NOISY_FILES = [
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    '.map',
    'dist/',
    'build/'
];

/**
 * GitManager: Responsible for extracting the "Muscle"
 * Handles multi-commit diffs with validation.
 */
export class GitManager {
    private git: SimpleGit;
    private readonly HIGH_PRIORITY_CODE = ['.ts', '.js', '.py', '.go', '.rs', '.cpp', '.m', '.swift'];

    constructor() {
        this.git = simpleGit();
    }

    /**
     * Checks if environment is a git repo, then get the current branch name
     */
    async getContext() {
        const isRepo = await this.git.checkIsRepo();
        if (!isRepo) throw new Error('Not a git repository');

        // Get the branch name for the "Meaning Layer"
        const branch = await this.git.revparse(['--abbrev-ref', 'HEAD']);
        return { branch };
    }

    /**
     * SHIPPING: Aggressive compression.
     * We ONLY care about the delta.
     */
    private pruneForShipping(block: string): string {
        const lines = block.split('\n');
        if (lines.length <= 40) return block;

        // Keep the diff headers and ONLY the changed lines (+/-)
        // This is high-signal for "What happened?"
        return lines.filter(line =>
            line.startsWith('diff') ||
            line.startsWith('+++') ||
            line.startsWith('---') ||
            line.startsWith('+') ||
            line.startsWith('-') ||
            line.startsWith('@@')
        ).join('\n');
    }

    /**
     * TEACHING: High fidelity.
     * We keep the surrounding context to explain the logic.
     */
    private pruneForTeaching(block: string): string {
        const lines = block.split('\n');

        // 300 lines is roughly 3-4 standard screen-lengths of code.
        // This is usually enough for a full "Lesson."
        if (lines.length > 300) {
            return lines.slice(0, 300).join('\n') +
                `\n... [Truncated for focus. Total lines: ${lines.length}] ...`;
        }
        return block;
    }

    /**
     * The Master Filter: Mode-Aware & Semantic
     */
    async getFilteredDiff(count: number, mode: Mode): Promise<string> {
        const { branch } = await this.getContext();
        const logs = await this.git.log();
        const safeCount = Math.min(count, logs.all.length);

        // Fetch raw diff
        const rawDiff = await this.git.diff([`HEAD~${safeCount}`, 'HEAD']);

        // 1. Split into file blocks
        const fileBlocks = rawDiff.split('diff --git');

        // 2. Filter & Prune
        const cleanBlocks = fileBlocks
            .filter(block => {
                // Remove Noise (Lockfiles, build artifacts)
                return !NOISY_FILES.some(noise => block.includes(noise));
            })
            .map(block => {
                const header = block.split('\n')[0];
                const isCode = this.HIGH_PRIORITY_CODE.some(ext => header?.includes(ext));
                const isDoc = header?.includes('.md') || header?.includes('.txt');

                // Logic for README Bias: Truncate docs unless it's a doc-only commit
                if (isDoc && fileBlocks.length > 2) {
                    return block.split('\n').slice(0, 10).join('\n') + '\n [Documentation housekeeping...]';
                }

                // Apply Mode-based Pruning
                return mode === 'teach' ? this.pruneForTeaching(block) : this.pruneForShipping(block);
            });

        const finalDiff = cleanBlocks.join('diff --git');

        // If we are teaching, we allow a larger total buffer to Gemini
        const bufferSize = mode === 'teach' ? 20000 : 12000;

        return `Branch: ${branch}\nMode: ${mode}\n\n${finalDiff.slice(0, bufferSize)}`;
    }
}