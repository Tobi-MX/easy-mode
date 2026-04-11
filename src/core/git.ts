import { simpleGit } from 'simple-git';
import type { SimpleGit } from 'simple-git';

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
    async getSessionDiff(count: number): Promise<string> {
        await this.checkEnv();

        // Safety check: Don't request more commits than the history has
        const log = await this.git.log();
        const safeCount = Math.min(count, log.all.length);

        // Extracts cumulative changes from N commits ago to the current state
        const diff = await this.git.diff([`HEAD~${safeCount}`, 'HEAD']);

        // Cap length to 4000 chars to stay within LLM context efficiency
        return diff.length > 4000 ? diff.substring(0, 4000) + "... [Truncated]" : diff;
    }
}