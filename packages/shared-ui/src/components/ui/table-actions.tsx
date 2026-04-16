
import * as React from 'react';
import { MoreHorizontal } from 'lucide-react';

import { useMediaQuery } from '../../hooks/use-mobile';
import { Button } from './button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';

/**
 * 表格操作项定义。
 * 用于统一列表页中“编辑 / 删除 / 查看详情 / 更多操作”等行级动作。
 */
export interface TableAction {
  /** 操作文案。 */
  label: string;
  /** 操作图标。 */
  icon?: React.ElementType;
  /** 点击回调。 */
  onClick: () => void;
  /** 操作语义，用于控制颜色。 */
  variant?: 'default' | 'destructive';
  /** 是否展示该操作。 */
  show?: boolean;
  /** 测试标识。 */
  testId?: string;
}

export interface TableActionsProps {
  /** 操作项列表。 */
  actions: TableAction[];
  /** 桌面端最多直接展示几个按钮。 */
  maxInline?: number;
  /** “更多操作”按钮无障碍文案。 */
  moreLabel?: string;
}

/**
 * 通用表格操作组件。
 *
 * 设计目标：
 * 1. 桌面端优先展示高频动作，低频动作收进菜单；
 * 2. 移动端统一收敛为菜单，避免行内按钮过多导致拥挤；
 * 3. 保持交互与视觉风格统一，减少各列表页重复实现。
 */
export function TableActions({ actions, maxInline = 2, moreLabel = '更多操作' }: TableActionsProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const visibleActions = actions.filter((action) => action.show !== false);
  const inlineActions = visibleActions.slice(0, maxInline);
  const menuActions = visibleActions.slice(maxInline);

  if (visibleActions.length === 0) {
    return null;
  }

  if (!isDesktop) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={moreLabel}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {visibleActions.map((action, index) => (
            <DropdownMenuItem
              key={`${action.label}-${index}`}
              onClick={action.onClick}
              className={action.variant === 'destructive' ? 'text-destructive' : ''}
              data-testid={action.testId}
            >
              {action.icon ? <action.icon className="mr-2 h-4 w-4" /> : null}
              {action.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex items-center justify-start gap-1">
        {inlineActions.map((action, index) => (
          <Tooltip key={`${action.label}-${index}`}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={action.onClick}
                className={action.variant === 'destructive' ? 'h-8 px-2 gap-1 text-destructive hover:bg-destructive/10' : 'h-8 px-2 gap-1'}
                data-testid={action.testId}
              >
                {action.icon ? <action.icon className="h-4 w-4" /> : null}
                <span className="ml-1 hidden lg:inline">{action.label}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">{action.label}</TooltipContent>
          </Tooltip>
        ))}

        {menuActions.length > 0 ? (
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" aria-label={moreLabel}>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="top">{moreLabel}</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end">
              {menuActions.map((action, index) => (
                <DropdownMenuItem
                  key={`${action.label}-${index}`}
                  onClick={action.onClick}
                  className={action.variant === 'destructive' ? 'text-destructive' : ''}
                  data-testid={action.testId}
                >
                  {action.icon ? <action.icon className="mr-2 h-4 w-4" /> : null}
                  {action.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    </TooltipProvider>
  );
}
