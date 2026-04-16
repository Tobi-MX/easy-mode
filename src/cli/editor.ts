import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export async function openInEditor(content: string): Promise<string> {
    const tempFile = path.join(os.tmpdir(), `easymode-edit-${Date.now()}.txt`);
    fs.writeFileSync(tempFile, content);

    const editor = process.env.EDITOR || 'nano';

    return new Promise((resolve, reject) => {
        const child = spawn(editor, [tempFile], { stdio: 'inherit' });

        child.on('exit', () => {
            const editedContent = fs.readFileSync(tempFile, 'utf-8');
            fs.unlinkSync(tempFile);
            resolve(editedContent.trim());
        });

        child.on('error', reject);
    });
}