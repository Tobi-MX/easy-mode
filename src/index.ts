#!/usr/bin/env node

import * as p from '@clack/prompts';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

import 'dotenv/config';

import { GitManager } from './core/git';
import { ProjectScanner } from './core/scanner';
import { ConfigStore } from './config/store';
import { AIService } from './core/ai/index';
import { GeminiProvider } from './core/ai/gemini.provider';
import { EasyModeError } from './utils/errors';
import { runSetupWizard } from './cli/setup';
import { Platform } from './types';
import clipboard from 'clipboardy';
import { openInEditor } from './cli/editor';

async function main() {
    p.intro('🚀 Easy Mode: High-Signal Shipping');

    const args = process.argv.slice(2);

    if (args.includes('--setup')) {
        await runSetupWizard();
        return;
    }

    let mode: 'ship' | 'teach';

    if (args.includes('--teach')) {
        mode = 'teach';
    } else if (args.includes('--ship')) {
        mode = 'ship';
    } else {
        // Only ask if no flag was provided (Sensible Defaults!)
        const selection = await p.select({
            message: 'What is the intent of this update?',
            options: [
                { value: 'ship', label: '🚀 Shipping (Features, Fixes, Wins)' },
                { value: 'teach', label: '🧠 Teaching (Concepts, Logic, How-to)' },
            ],
        });

        if (p.isCancel(selection)) process.exit(0);
        mode = selection as 'ship' | 'teach';
    }

    // 1. Memory: Load or Initialize Project Context
    let config = ConfigStore.get() || ConfigStore.getDefaults();

    if (!ConfigStore.get()) {
        p.log.info('💡 Identity detected. Using Senior Builder defaults.');
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
        const muscle = await git.getFilteredDiff(commitCount as number, mode);
        const skeleton = ProjectScanner.getSkeleton();
        const identity = ProjectScanner.getIdentity();

        // Brain: Execute AI Generation with Gemini
        const provider = new GeminiProvider(process.env.GEMINI_API_KEY!);
        const ai = new AIService(provider);

        const stream = ai.generateWithRetry(
            config,
            identity,
            branch,
            skeleton,
            muscle,
            platform as Platform,
            mode
        );

        s.stop('Brain Connected. Generating:');
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
                const tempFile = path.join(os.tmpdir(), `easymode-${Date.now()}.txt`);
                fs.writeFileSync(tempFile, finalDraft);

                p.log.info('Opening VS Code... Save and CLOSE the tab to continue.');

                try {
                    await openInEditor(finalDraft, tempFile)
                    p.log.success('Draft updated from VS Code!');
                } catch (err) {
                    p.log.error('Could not sync with VS Code. Try the AI Refine instead.');
                    // Fallback: don't crash, just keep the old draft
                }

            } else if (action === 'refine') {
                const feedback = await p.text({ message: 'What should the AI change?' });
                if (!p.isCancel(feedback)) {
                    s.start('Refining...');
                    finalDraft = await ai.refine(
                        config,
                        identity,
                        branch,
                        skeleton,
                        muscle,
                        platform,
                        finalDraft,
                        feedback as string,
                        mode
                    );
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