import * as React from 'react';
import { useTheme } from './theme-provider';
import { Monitor, Moon, Sun } from 'lucide-react';

import { Button } from '../shadcn/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../shadcn/dropdown-menu';

export interface ThemeToggleLabels {
  toggle: string;
  light: string;
  dark: string;
  system: string;
}

export interface ThemeToggleProps {
  /** 自定义文案，便于不同端接入本地化。 */
  labels?: Partial<ThemeToggleLabels>;
}

const DEFAULT_LABELS: ThemeToggleLabels = {
  toggle: '切换主题',
  light: '亮色',
  dark: '深色',
  system: '跟随系统',
};

/**
 * 统一主题切换组件。
 * 通过 `labels` 支持轻量本地化，同时保持视觉与交互一致。
 */
export function ThemeToggle({ labels }: ThemeToggleProps) {
  const resolvedLabels = { ...DEFAULT_LABELS, ...labels };
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" aria-label={resolvedLabels.toggle}>
        <Sun className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={resolvedLabels.toggle}>
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">{resolvedLabels.toggle}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          <Sun className="mr-2 h-4 w-4" />
          <span>{resolvedLabels.light}</span>
          {theme === 'light' ? <span className="text-primary ml-auto">✓</span> : null}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          <Moon className="mr-2 h-4 w-4" />
          <span>{resolvedLabels.dark}</span>
          {theme === 'dark' ? <span className="text-primary ml-auto">✓</span> : null}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          <Monitor className="mr-2 h-4 w-4" />
          <span>{resolvedLabels.system}</span>
          {theme === 'system' ? <span className="text-primary ml-auto">✓</span> : null}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
