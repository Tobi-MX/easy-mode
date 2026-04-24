import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GitManager } from './git';

// 1. Mock simple-git
vi.mock('simple-git', () => ({
    simpleGit: vi.fn(() => ({
        checkIsRepo: vi.fn().mockResolvedValue(true),
        revparse: vi.fn().mockResolvedValue('main'),
        log: vi.fn().mockResolvedValue({
            all: [
                { hash: 'abc', message: 'feat: math logic', date: '2026-04-20' },
                { hash: 'def', message: 'docs: update readme', date: '2026-04-21' }
            ]
        }),
        show: vi.fn().mockImplementation((args: string[]) => {
            const hash = args[0];
            if (hash === 'abc') return 'diff --git a/math.ts\n+ const RK4 = (x) => x * 2;';
            return 'diff --git a/README.md\n+ This is a long documentation file...'.repeat(50);
        })
    }))
}));

describe('GitManager', () => {
    let gitManager: GitManager;

    beforeEach(() => {
        gitManager = new GitManager();
    });

    it('should correctly identify the branch context', async () => {
        const context = await gitManager.getContext();
        expect(context.branch).toBe('main');
    });

    it('should fetch the requested number of recent commits', async () => {
        const commits = await gitManager.getRecentCommits(2);
        expect(commits).toHaveLength(2);
        expect(commits[0]?.hash).toBe('abc');
    });

    describe('Semantic Pruning Logic', () => {
        it('should truncate large README files in Ship mode when code is present', async () => {
            // Mock a selection with 1 code file and 1 large doc file
            const hashes = ['abc', 'def'];
            const result = await gitManager.getFilteredDiffFromHashes(hashes, 'ship');
            
            expect(result).toContain('Branch: main');
            expect(result).toContain('Mode: ship');
            // Should contain our marker from the map logic
            expect(result).toContain('[Documentation housekeeping...]');
        });

        it('should use pruneForShipping (aggressive) in ship mode', async () => {
            const hashes = ['abc'];
            const result = await gitManager.getFilteredDiffFromHashes(hashes, 'ship');
            
            // Should contain the diff hunks
            expect(result).toContain('+ const RK4');
        });

        it('should use pruneForTeaching (generous) in teach mode', async () => {
            const hashes = ['abc'];
            const result = await gitManager.getFilteredDiffFromHashes(hashes, 'teach');
            
            expect(result).toContain('Mode: teach');
            // In teach mode, the buffer slice is larger (20000)
            expect(result.length).toBeGreaterThan(10);
        });
    });

    it('should exclude NOISY_FILES from the final output', async () => {
        // Force a mock response that includes a lockfile
        const mockShow = vi.fn().mockResolvedValue('diff --git a/package-lock.json\n+ contents');
        (gitManager as any).git.show = mockShow;

        const result = await gitManager.getFilteredDiffFromHashes(['xyz'], 'ship');
        expect(result).not.toContain('package-lock.json');
    });
});