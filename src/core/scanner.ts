import * as fs from 'fs';
import * as path from 'path';
import { ProjectIdentity } from '../types';

export class ProjectScanner {

    static getIdentity(): ProjectIdentity {
        const pkgPath = path.join(process.cwd(), 'package.json');
        const readmePath = path.join(process.cwd(), 'README.md');

        let dependencies: string[] = [];
        let version = '0.1.0';

        if (fs.existsSync(pkgPath)) {
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
            dependencies = Object.keys(pkg.dependencies || {});
            version = pkg.version || '0.1.0';
        }

        const readmeContent = fs.existsSync(readmePath)
            ? fs.readFileSync(readmePath, 'utf-8').slice(0, 500) // First 500 chars for context
            : '';

        return {
            techStack: dependencies,
            maturity: version,
            corePurpose: readmeContent
        };
    }

    /**
     * Generates a condensed directory tree.
     * Excludes noisy folders to maximize AI context density.
     */
    static getSkeleton(dir: string = process.cwd(), depth: number = 2): string {
        const EXCLUDED = ['node_modules', 'dist', '.git', 'out', 'build', '.next'];

        const walk = (currentPath: string, currentDepth: number): string => {
            if (currentDepth > depth) return '';

            let lines = '';
            try {
                const items = fs.readdirSync(currentPath);
                items.forEach((item) => {
                    if (EXCLUDED.includes(item) || item.startsWith('.')) return;

                    const fullPath = path.join(currentPath, item);
                    const isDirectory = fs.statSync(fullPath).isDirectory();
                    const prefix = '  '.repeat(currentDepth) + (isDirectory ? '📁 ' : '📄 ');

                    lines += `${prefix}${item}\n`;
                    if (isDirectory) lines += walk(fullPath, currentDepth + 1);
                });
            } catch {
                return '';
            }

            return lines;
        };

        return walk(dir, 0);
    }
}