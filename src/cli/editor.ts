import { spawnSync } from 'child_process';
import * as fs from 'fs';

export async function openInEditor(content: string, tempFile: string) {
    const result = spawnSync('code', ['--wait', tempFile], {
        shell: true,
        stdio: 'inherit'
    });

    if (result.status !== 0) {
        throw new Error('VS Code closed with an error');
    }

    const editedContent = fs.readFileSync(tempFile, 'utf-8');
    content = editedContent.trim();
    fs.unlinkSync(tempFile);
}