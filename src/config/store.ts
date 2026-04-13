import * as fs from 'fs';
import * as path from 'path';
import { z } from 'zod';

// User strict schema for project data
export const ProjectConfigSchema = z.object({
    projectName: z.string().min(1, "Project name cannot be empty"),
    projectDescription: z.string().min(10, "Give a bit more detail (min 10 chars)"),
    lastLaunched: z.string().optional(),
});

export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;

export class ConfigStore {
    private static configPath = path.join(process.cwd(), '.easymode.json');

    /**
     * Checks if the project is already initialized
     */
    static exists(): boolean {
        return fs.existsSync(this.configPath);
    }

    /**
     * Retrieves the project "Soul"
     */
    static get(): ProjectConfig | null {
        if (!this.exists()) return null;

        try {
            const raw = fs.readFileSync(this.configPath, 'utf-8');
            return ProjectConfigSchema.parse(JSON.parse(raw));
        } catch (error) {
            // If the file is corrupted, we return null to trigger a re-init
            return null;
        }
    }

    /**
     * Saves the project context to disk
     */
    static save(config: ProjectConfig): void {
        fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
    }
}