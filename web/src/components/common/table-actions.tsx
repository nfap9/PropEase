'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MoreHorizontal } from 'lucide-react';
import { useMediaQuery } from '@/hooks/use-mobile';

export interface TableAction {
  label: string;
  icon?: React.ElementType;
  onClick: () => void;
  variant?: 'default' | 'destructive';
  show?: boolean;
}

interface TableActionsProps {
  actions: TableAction[];
  maxInline?: number;
}

export function TableActions({ actions, maxInline = 2 }: TableActionsProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const visibleActions = actions.filter((a) => a.show !== false);
  const inlineActions = visibleActions.slice(0, maxInline);
  const menuActions = visibleActions.slice(maxInline);

  if (visibleActions.length === 0) {
    return null;
  }

  // 移动端全部放入菜单
  if (!isDesktop) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="更多操作">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {visibleActions.map((action, i) => (
            <DropdownMenuItem
              key={i}
              onClick={action.onClick}
              className={action.variant === 'destructive' ? 'text-destructive' : ''}
            >
              {action.icon && <action.icon className="mr-2 h-4 w-4" />}
              {action.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // 桌面端直接显示部分按钮，hover 显示操作名称
  return (
    <TooltipProvider>
      <div className="flex items-center justify-end gap-1">
        {inlineActions.map((action, i) => (
          <Tooltip key={i}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={action.onClick}
                className={
                  action.variant === 'destructive' ? 'text-destructive hover:text-destructive' : ''
                }
              >
                {action.icon && <action.icon className="h-4 w-4" />}
                <span className="ml-1 hidden lg:inline">{action.label}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">{action.label}</TooltipContent>
          </Tooltip>
        ))}
        {menuActions.length > 0 && (
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" aria-label="更多操作">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="top">更多操作</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end">
              {menuActions.map((action, i) => (
                <DropdownMenuItem
                  key={i}
                  onClick={action.onClick}
                  className={action.variant === 'destructive' ? 'text-destructive' : ''}
                >
                  {action.icon && <action.icon className="mr-2 h-4 w-4" />}
                  {action.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </TooltipProvider>
  );
}
