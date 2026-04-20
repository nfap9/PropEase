/**
 * 主题切换按钮组件
 */
import { Dropdown, Button } from 'antd';
import type { MenuProps } from 'antd';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';
import { adminMessages } from '@/i18n';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const ThemeIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;

  const menuItems: MenuProps['items'] = [
    {
      key: 'light',
      icon: <Sun className="h-4 w-4" />,
      label: adminMessages.theme.light,
      onClick: () => setTheme('light'),
    },
    {
      key: 'dark',
      icon: <Moon className="h-4 w-4" />,
      label: adminMessages.theme.dark,
      onClick: () => setTheme('dark'),
    },
    {
      key: 'system',
      icon: <Monitor className="h-4 w-4" />,
      label: adminMessages.theme.system,
      onClick: () => setTheme('system'),
    },
  ];

  return (
    <Dropdown menu={{ items: menuItems }} placement="bottomRight" trigger={['click']}>
      <Button type="text">
        <ThemeIcon className="h-4 w-4" />
      </Button>
    </Dropdown>
  );
}
