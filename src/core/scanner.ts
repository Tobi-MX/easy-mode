import * as fs from 'fs';
import * as path from 'path';

export class ProjectScanner {
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