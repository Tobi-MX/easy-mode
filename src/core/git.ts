import { simpleGit } from 'simple-git';
import type { SimpleGit } from 'simple-git';

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

    constructor() {
        this.git = simpleGit();
    }

    /**
     * Validates if the environment is a Git repository.
     */
    async checkEnv(): Promise<void> {
        const isRepo = await this.git.checkIsRepo();
        if (!isRepo) {
            throw new Error('Not a git repository. Run "git init" first.')
        };
    }

    /**
     * Pulls the combined diff for a range of commits.
     * @param count The number of commits to go back from HEAD.
     */
    async getDiffRange(count: number): Promise<string> {
        await this.checkEnv();

        // Safety check: Don't request more commits than the history has
        const log = await this.git.log();
        const safeCount = Math.min(count, log.all.length);

        // Extracts cumulative changes from N commits ago to the current state
        const diff = await this.git.diff([`HEAD~${safeCount}`, 'HEAD']);

        return diff;
    }

    /**
     * Filters the diff by removing NOISY_FILES, Cap length to 8000 chars to stay within LLM context efficiency.
     * @param count The number of commits to go back from HEAD.
     */
    async getFilteredDiff(count: number): Promise<string> {
    const rawDiff = await this.getDiffRange(count);
    
    // Split the diff into individual file blocks
    const fileBlocks = rawDiff.split('diff --git');

    // Filter out blocks that match our "Noisy Files" list
    const cleanBlocks = fileBlocks.filter(block => {
      return !NOISY_FILES.some(noise => block.includes(noise));
    });

    const finalDiff = cleanBlocks.join('diff --git');

    // Senior touch: Smart truncation that doesn't cut in the middle of a word
    return finalDiff.length > 8000 
      ? finalDiff.substring(0, 8000) + "\n... [Diff truncated for quality]" 
      : finalDiff;
  }
}