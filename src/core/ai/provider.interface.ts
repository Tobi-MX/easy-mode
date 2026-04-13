import type { ProjectConfig } from '../../config/store.js';
import type { Platform } from '../../types/index.js';

export interface AIProvider {
    generateDraft(
        config: ProjectConfig,
        branch: string,
        skeleton: string,
        muscle: string,
        platform: Platform
    ): Promise<string>;
}