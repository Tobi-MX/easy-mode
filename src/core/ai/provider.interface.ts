import type { ProjectConfig } from '../../config/store';
import type { Platform } from '../../types/index';

export interface AIProvider {
    generateDraft(
        config: ProjectConfig,
        branch: string,
        skeleton: string,
        muscle: string,
        platform: Platform
    ): Promise<string>;
}