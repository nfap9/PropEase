const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, '..', 'src', 'routes');

// 这个脚本将未使用的 next 参数改名为 _next

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  const original = content;

  const lines = content.split('\n');
  const result = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 检测是否是路由处理器定义：包含 (req, res, next) 或类似模式
    // 匹配: async (req, res, next: NextFunction) => 或 function(req, res, next)
    const routeMatch = line.match(/(async\s*)?\([^)]*,\s*[^)]*,\s*next\s*:\s*NextFunction[^)]*\)\s*=>/);
    const funcMatch = line.match(/function\s+\w+\([^)]*,\s*[^)]*,\s*next\s*:\s*NextFunction[^)]*\)/);

    if (routeMatch || funcMatch) {
      // 检查这个函数是否使用了 next
      // 收集函数体
      let braceCount = 0;
      let funcStart = i;
      let funcEnd = i;
      let inFunc = false;

      for (let j = i; j < lines.length; j++) {
        const l = lines[j];
        if (l.includes('=>') || l.includes('function')) {
          inFunc = true;
        }
        if (inFunc) {
          for (const ch of l) {
            if (ch === '{') braceCount++;
            if (ch === '}') braceCount--;
          }
          if (braceCount === 0 && j > i) {
            funcEnd = j;
            break;
          }
        }
      }

      const funcBody = lines.slice(funcStart, funcEnd + 1).join('\n');

      // 检查函数体是否使用了 next( (排除参数定义中的 next)
      // 移除参数部分
      const bodyWithoutParams = funcBody.replace(/\([^)]*next[^)]*\)/g, '(...)');
      const usesNext = /next\s*\(/.test(bodyWithoutParams);

      if (!usesNext) {
        // 把 next: NextFunction 改成 _next: NextFunction
        const newLine = line.replace(/next\s*:/, '_next:');
        result.push(newLine);
      } else {
        result.push(line);
      }
    } else {
      result.push(line);
    }
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
