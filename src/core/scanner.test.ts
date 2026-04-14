import { describe, it, expect } from 'vitest';
import { ProjectScanner } from './scanner.js';
import * as fs from 'fs';
import * as path from 'path';

describe('ProjectScanner', () => {
  it('should generate a skeleton and exclude noisy directories', () => {
    // Setup: Create a temporary mock directory structure
    const testDir = path.join(process.cwd(), '.test-mock');
    if (!fs.existsSync(testDir)) fs.mkdirSync(testDir);
    
    // Create a good file and a bad file
    fs.writeFileSync(path.join(testDir, 'index.ts'), 'console.log("test")');
    fs.mkdirSync(path.join(testDir, 'node_modules'));
    
    const skeleton = ProjectScanner.getSkeleton(testDir, 1);
    
    // Assertions
    expect(skeleton).toContain('index.ts');
    expect(skeleton).not.toContain('node_modules');
    
    // Cleanup
    fs.rmSync(testDir, { recursive: true, force: true });
  });
});