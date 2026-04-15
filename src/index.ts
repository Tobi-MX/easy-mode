import * as p from '@clack/prompts';
import { GitManager } from './core/git';
import { ProjectScanner } from './core/scanner';
import { ConfigStore } from './config/store';
import { AIService } from './core/ai/index';
import { GeminiProvider } from './core/ai/gemini.provider';
import { EasyModeError } from './utils/errors';
import { runSetupWizard } from './cli/setup';
import 'dotenv/config';

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
}

main();