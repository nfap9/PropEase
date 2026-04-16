/**
 * CSS 变量生成器
 *
 * 根据颜色令牌生成 CSS 变量字符串
 */

import { themes, type ThemeColors } from './colors';

/**
 * 将 HSL 对象转换为 CSS 字符串
 */
function hslToString(h: number, s: number, l: number): string {
  return `${h} ${s}% ${l}%`;
}

/**
 * 生成单个主题的 CSS 变量
 */
function generateThemeVariables(colors: ThemeColors): string {
  const lines: string[] = [];

  for (const [name, value] of Object.entries(colors)) {
    const varName = `--${name}`;

    // 处理特殊变量
    if (name === 'card-shadow') {
      lines.push(`  ${varName}: 0 18px 40px -24px rgba(15, 23, 42, 0.22);`);
      continue;
    }

    if (name === 'sidebar-shadow') {
      lines.push(`  ${varName}: 20 20 40;`);
      continue;
    }

    if (name === 'radius') {
      lines.push(`  ${varName}: 0.875rem;`);
      continue;
    }

    lines.push(`  ${varName}: ${hslToString(value.h, value.s, value.l)};`);
  }

  return lines.join('\n');
}

/**
 * 生成完整的 CSS 变量文件内容
 */
export function generateThemeCSS(): string {
  const lightVars = generateThemeVariables(themes.light.colors);
  const darkVars = generateThemeVariables(themes.dark.colors);

  return `/* 由 tokens/css-generator.ts 自动生成 - 请勿手动修改 */

/* 浅色主题变量 */
:root {
${lightVars}
}

/* 暗色主题变量 */
.dark {
${darkVars}
}
`;
}

/**
 * 生成所有主题的 CSS 变量
 */
export const themeCSS = generateThemeCSS();
