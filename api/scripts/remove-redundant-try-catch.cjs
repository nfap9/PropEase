const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, '..', 'src', 'routes');

function processFile(filePath) {
  if (filePath.includes('.test.')) {
    return false;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const original = content;

  // 单行 try-catch: try { ... } catch (e) { next(e); }
  // 使用 [\s\S]*? 来匹配包括换行符在内的所有字符
  let result = content.replace(
    /try\s*\{([\s\S]*?)\}\s*catch\s*\(\s*e\s*\)\s*\{\s*next\s*\(\s*e\s*\)\s*;?\s*\}/g,
    '$1'
  );

  // 多行 try-catch: } catch (e) { next(e); } 模式（单独一行）
  // 这种情况下 try { 在前一行，} 在当前行
  result = result.replace(
    /(\n\s*)?try\s*\{([\s\S]*?)^\s*\}\s*catch\s*\(\s*e\s*\)\s*\{\s*next\s*\(\s*e\s*\)\s*;?\s*\}/gm,
    '$2'
  );

  // 清理可能的多余空行
  result = result.replace(/\n{3,}/g, '\n\n');

  if (result !== original) {
    fs.writeFileSync(filePath, result, 'utf-8');
    return true;
  }
  return false;
}

function walkDir(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkDir(fullPath));
    } else if (entry.name.endsWith('.ts')) {
      files.push(fullPath);
    }
  }
  return files;
}

const files = walkDir(routesDir);
let modifiedCount = 0;

for (const file of files) {
  if (processFile(file)) {
    console.log('Modified:', path.relative(routesDir, file));
    modifiedCount++;
  }
}

console.log(`\nTotal: ${modifiedCount} files modified`);
