import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GitManager } from './git.js';

const mockGitMethods = {
    checkIsRepo: vi.fn(),
    revparse: vi.fn(),
    log: vi.fn(),
    diff: vi.fn(),
};

vi.mock('simple-git', () => ({
    simpleGit: vi.fn(() => mockGitMethods),
}));

import { simpleGit } from 'simple-git';

describe('GitManager', () => {
    let gitManager: GitManager;

    beforeEach(() => {
        vi.clearAllMocks();
        gitManager = new GitManager();
    });

    it('should throw error if not a git repository', async () => {
        mockGitMethods.checkIsRepo.mockResolvedValue(false);
        await expect(gitManager.getContext()).rejects.toThrow('Not a git repository');
    });

    it('should return branch name if it is a git repository', async () => {
        mockGitMethods.checkIsRepo.mockResolvedValue(true);
        mockGitMethods.revparse.mockResolvedValue('main');

        const context = await gitManager.getContext();
        expect(context.branch).toBe('main');
        expect(mockGitMethods.revparse).toHaveBeenCalledWith(['--abbrev-ref', 'HEAD']);
    });

    it('should fetch and filter diffs correctly', async () => {
        mockGitMethods.checkIsRepo.mockResolvedValue(true);
        mockGitMethods.revparse.mockResolvedValue('main');
        mockGitMethods.log.mockResolvedValue({ all: [{ hash: '1' }, { hash: '2' }] });

        const rawDiff = `diff --git a/index.ts b/index.ts
index 123..456 100644
--- a/index.ts
+++ b/index.ts
@@ -1 +1 @@
-old
+new
diff --git a/package-lock.json b/package-lock.json
index 789..012 100644
--- a/package-lock.json
+++ b/package-lock.json
@@ -1 +1 @@
-something`;

        mockGitMethods.diff.mockResolvedValue(rawDiff);

        const filteredDiff = await gitManager.getFilteredDiff(2, "teach");

        expect(filteredDiff).toContain('Branch: main');
        expect(filteredDiff).toContain('index.ts');
        expect(filteredDiff).not.toContain('package-lock.json');
    });
});
