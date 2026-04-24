const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, '..', 'src', 'routes');

// 匹配 async (req, res, next) 中的 next，但只在同一行中检查它是否被使用
// 这个脚本找出所有路由处理器中 next 未使用的情况

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  const original = content;

  // 找出所有路由处理函数定义
  // 匹配: async (req, res, next: NextFunction) => {
  // 或者: async functionName(req, res, next: NextFunction) {

  // 对于每一行，检查是否是路由处理器定义，且 next 未使用
  const lines = content.split('\n');
  const result = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // 检查是否是路由处理器定义（包含 async (req, res, next) 或类似模式）
    const routeMatch = line.match(/(async\s*)?\([^)]*,\s*[^)]*,\s*(next|NextFunction)[^)]*\)\s*=>/);
    const funcMatch = line.match(/function\s+\w+\([^)]*,\s*(next|NextFunction)[^)]*\)/);

    if (routeMatch || funcMatch) {
      // 这是一个路由处理器，检查后续内容是否使用了 next
      const funcStart = i;
      let funcEnd = i;
      let braceCount = 0;
      let inFunction = false;

      // 找到函数体范围
      for (let j = i; j < lines.length; j++) {
        if (lines[j].includes('=>') && !inFunction) {
          inFunction = true;
        }
        if (inFunction) {
          for (const ch of lines[j]) {
            if (ch === '{') braceCount++;
            if (ch === '}') braceCount--;
          }
          if (braceCount === 0 && j > i) {
            funcEnd = j;
            break;
          }
        }
      }

      // 收集函数体内容
      const funcBody = lines.slice(funcStart, funcEnd + 1).join('\n');

      // 检查函数体是否使用了 next（排除参数定义）
      // 移除参数部分，只看函数体
      const bodyWithoutParams = funcBody.replace(/\([^)]*next[^)]*\)/g, '');

      // 检查是否真的没有使用 next
      if (!/next\s*\(/.test(bodyWithoutParams)) {
        // 把 (req, res, next) 改成 (req, res) 或者 _next
        const newLine = line.replace(/,\s*(next|NextFunction)/g, '');
        result.push(newLine);
        i++;
        continue;
      }
    }

    result.push(line);
    i++;
  }

  const newContent = result.join('\n');
  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent, 'utf-8');
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
