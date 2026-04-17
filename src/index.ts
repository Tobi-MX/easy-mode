import * as p from '@clack/prompts';
import { GitManager } from './core/git';
import { ProjectScanner } from './core/scanner';
import { ConfigStore } from './config/store';
import { AIService } from './core/ai/index';
import { GeminiProvider } from './core/ai/gemini.provider';
import { EasyModeError } from './utils/errors';
import { runSetupWizard } from './cli/setup';
import { Platform } from './types';
import clipboard from 'clipboardy';
import 'dotenv/config';
import { openInEditor } from './cli/editor';

async function main() {
    p.intro('🚀 Easy Mode: High-Signal Shipping');

    // 1. Memory: Load or Initialize Project Context
    let config = ConfigStore.get();

    if (!config) {
        p.log.info("👋 It looks like this is a new project!");
        config = await runSetupWizard(); // The "Wizard" call
        p.log.success("✅ Project context saved to .easymode.json");
    }

    // 2. Muscle: Initialize Git & Commit Selection
    const git = new GitManager();

    const selection = await p.select({
        message: 'How much progress are we summarizing?',
        options: [
            { value: '1', label: 'Last commit only' },
            { value: '3', label: 'Last 3 commits', hint: 'Recommended' },
            { value: '5', label: 'Last 5 commits' },
            { value: 'custom', label: '🔢 Enter custom number' },
        ],
    });

    if (p.isCancel(selection)) {
        p.cancel('Operation cancelled.');
        process.exit(0);
    }

    let commitCount: number;

    if (selection === 'custom') {
        const customCount = await p.text({
            message: 'How many recent commits should I analyze?',
            validate: (value: string | undefined) => {
                if (value) {
                    const num = parseInt(value);
                    if (isNaN(num) || num <= 0) return 'Please enter a valid positive number';
                }
            }
        });

        if (p.isCancel(customCount)) {
            p.cancel('Operation cancelled.');
            process.exit(0);
        }

        commitCount = parseInt(customCount as string);
    } else {
        // Safe to parse, the values are '1', '3', '5'
        commitCount = parseInt(selection as string);
    }

    const platform = await p.select({
        message: 'Select target platform:',
        options: [
            { value: 'X', label: '𝕏 (Twitter)' },
            { value: 'LINKEDIN', label: 'LinkedIn' },
            { value: 'DISCORD', label: 'Discord' }
        ],
    });

    if (p.isCancel(platform)) {
        p.cancel('Operation cancelled.');
        process.exit(0);
    }

    let finalDraft = ''
    const s = p.spinner();
    s.start('Connecting to brain...');

    try {
        // Extraction: Get Branch, Diff, and Skeleton
        const { branch } = await git.getContext();
        const muscle = await git.getFilteredDiff(commitCount as number);
        const skeleton = ProjectScanner.getSkeleton();

        // Brain: Execute AI Generation with Gemini
        const provider = new GeminiProvider(process.env.GEMINI_API_KEY!);
        const ai = new AIService(provider);

        const stream = ai.generateWithRetry(
            config,
            branch,
            skeleton,
            muscle,
            platform as Platform
        );

        //s.stop('Brain Connected. Generating:');
        process.stdout.write('\n');

        for await (const chunk of stream) {
            finalDraft += chunk;
            process.stdout.write(chunk); // character by character stream
        }
        process.stdout.write('\n\n');

        s.stop('Draft Generated!');

        // The Edit Loop
        let userSatisfied = false;
        while (!userSatisfied) {
            const action = await p.select({
                message: 'What is the move?',
                options: [
                    { value: 'ship', label: '🚀 Ship it (Copy to Clipboard)' },
                    { value: 'edit', label: '✍️ Manual Edit' },
                    { value: 'refine', label: '🤖 AI Refine' },
                    { value: 'cancel', label: '❌ Trash it' },
                ]
            });

            if (action === 'ship') {
                clipboard.writeSync(finalDraft);
                p.log.success('📋 Copied to clipboard! Ready to post.');
                userSatisfied = true;

            } else if (action === 'edit') {
                finalDraft = await openInEditor(finalDraft);

            } else if (action === 'refine') {
                const feedback = await p.text({ message: 'What should the AI change?' });
                if (!p.isCancel(feedback)) {
                    s.start('Refining...');
                    finalDraft = await provider.refineDraft(finalDraft, feedback as string);
                    p.note(finalDraft, `Your ${platform} Draft`);
                    s.stop('Refined!');
                }
            } else {
                p.cancel('Build discarded.');
                process.exit(0);
            }
        }

    } catch (err: unknown) {
        s.stop('Extraction failed.');

        if (err instanceof EasyModeError) {
            p.log.error(`❌ ${err.message}`);
            if (err.suggestion) p.log.info(`💡 Tip: ${err.suggestion}`);
        } else {
            p.log.error('An unexpected error occurred!');
            console.error(err);
        }

        process.exit(1);
    }
}

main();