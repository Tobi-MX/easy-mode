import type { ProjectConfig } from '../../config/store';
import type { Mode, Platform, ProjectIdentity } from '../../types/index';

export interface AIProvider {
    generateDraftStream(
        config: ProjectConfig,
        identity: ProjectIdentity,
        branch: string,
        skeleton: string,
        muscle: string,
        platform: Platform,
        mode: Mode
    ): AsyncGenerator<string, any, any>;

    refineDraft(
        config: ProjectConfig,
        identity: ProjectIdentity,
        branch: string,
        skeleton: string,
        muscle: string,
        platform: Platform,
        currentDraft: string, 
        feedback: string,
        mode: Mode
    ): Promise<string>;
}