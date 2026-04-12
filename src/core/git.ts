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
   * Pulls the combined filtered diff for a range of commits.
   * @param count The number of commits to go back from HEAD.
   */
    async getFilteredDiff(count: number): Promise<string> {
        const { branch } = await this.getContext();
        const logs = await this.git.log();
        const safeCount = Math.min(count, logs.all.length);

        const rawDiff = await this.git.diff([`HEAD~${safeCount}`, 'HEAD']);

        // Split by file headers
        const fileBlocks = rawDiff.split('diff --git');

        // Regex Filter
        const cleanBlocks = fileBlocks.filter(block => {
            return !NOISY_FILES.some(noise => {
                const pattern = new RegExp(`(^|/)${noise.replace('.', '\\.')}($|/|\\s)`);
                return pattern.test(block);
            });
        });

        const finalDiff = cleanBlocks.join('diff --git');

        // Return the diff with the branch context prepended
        return `Branch: ${branch}\n\n${finalDiff.slice(0, 8000)}`;
    }
}