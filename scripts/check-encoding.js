import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const TARGET_DIRS = ['src', 'public'];
const EXTENSIONS = ['.ts', '.js', '.css', '.html', '.json', '.yml'];

function checkAndFixFile(filePath) {
  const buffer = fs.readFileSync(filePath);
  
  // Check for BOM (UTF-16 or UTF-8 with BOM)
  if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
    console.log(`[FIX] Removing BOM from ${path.relative(rootDir, filePath)}`);
    fs.writeFileSync(filePath, buffer.slice(3), 'utf8');
    return true;
  }
  
  if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
    console.log(`[FIX] Converting UTF-16LE to UTF-8: ${path.relative(rootDir, filePath)}`);
    const content = buffer.toString('utf16le');
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }

  // Try decoding as UTF-8
  try {
    const content = buffer.toString('utf8');
    // Basic valid UTF-8 check (Node.js decoder is fairly lenient but we can force rewrite to ensure clean UTF-8)
    // If we suspect corruption, we can use a more rigorous check.
    // For now, let's just ensure we save it back as clean UTF-8 if we suspect any issues or just to be safe.
    // fs.writeFileSync(filePath, content, 'utf8');
  } catch (e) {
    console.error(`[ERROR] Invalid UTF-8 in ${path.relative(rootDir, filePath)}: ${e.message}`);
    process.exit(1);
  }
  return false;
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && !file.startsWith('.')) {
        walkDir(fullPath);
      }
    } else if (EXTENSIONS.includes(path.extname(file))) {
      checkAndFixFile(fullPath);
    }
  }
}

console.log('--- Checking File Encodings ---');
TARGET_DIRS.forEach(dir => {
  const fullPath = path.join(rootDir, dir);
  if (fs.existsSync(fullPath)) {
    walkDir(fullPath);
  }
});

// Also check root yml files (.github/workflows)
const githubWorkflows = path.join(rootDir, '.github', 'workflows');
if (fs.existsSync(githubWorkflows)) {
  walkDir(githubWorkflows);
}

console.log('--- Encoding Check Completed ---');
