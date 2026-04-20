
/**
 * 主题切换按钮组件
 *
 * 点击可在深色/浅色模式间切换
 * 使用 antd 的 Dropdown 替代 DropdownMenu
 */
import { useState } from 'react';
import { Dropdown, Button } from 'antd';
import type { MenuProps } from 'antd';
import { Moon, Sun, Monitor } from 'lucide-react';

type Theme = 'light' | 'dark' | 'system';

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme') as Theme | null;
    return stored || 'system';
  });

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    // 应用主题到 document
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // system
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  const ThemeIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;

  const items: MenuProps['items'] = [
    {
      key: 'light',
      label: (
        <span className="flex items-center gap-2">
          <Sun className="h-4 w-4" />
          浅色
        </span>
      ),
      onClick: () => handleThemeChange('light'),
    },
    {
      key: 'dark',
      label: (
        <span className="flex items-center gap-2">
          <Moon className="h-4 w-4" />
          深色
        </span>
      ),
      onClick: () => handleThemeChange('dark'),
    },
    {
      key: 'system',
      label: (
        <span className="flex items-center gap-2">
          <Monitor className="h-4 w-4" />
          跟随系统
        </span>
      ),
      onClick: () => handleThemeChange('system'),
    },
  ];

  return (
    <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
      <Button type="text" icon={<ThemeIcon className="h-4 w-4" />} />
    </Dropdown>
  );
}
