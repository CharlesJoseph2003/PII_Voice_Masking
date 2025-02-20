import { copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Source and destination paths
const sourceDir = __dirname;
const destDir = join(__dirname, 'frontend', 'public');

// Files to copy
const files = ['input.wav', 'final_output.wav'];

// Copy files
files.forEach(file => {
    const sourcePath = join(sourceDir, file);
    const destPath = join(destDir, file);
    
    try {
        copyFileSync(sourcePath, destPath);
        console.log(`Copied ${file} to frontend/public/`);
    } catch (error) {
        console.error(`Error copying ${file}:`, error.message);
    }
});
