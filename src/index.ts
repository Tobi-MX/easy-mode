import * as p from '@clack/prompts';
import { GitManager } from './core/git';
import { ProjectScanner } from './core/scanner';
import { ConfigStore } from './config/store';
import { AIService } from './core/ai/index';
import { GeminiProvider } from './core/ai/gemini.provider';
import { EasyModeError } from './utils/errors';
import 'dotenv/config';

async function main() {
    p.intro('🚀 Easy Mode: High-Signal Shipping');

    // 1. Memory: Load or Initialize Project Context
    let config = ConfigStore.get();
    if (!config) {
        p.log.warn('No project context found.');
        // calling setup wizard here
        p.cancel('Please run setup first or create .easymode.json');
        return process.exit(0);
    }
}

main();