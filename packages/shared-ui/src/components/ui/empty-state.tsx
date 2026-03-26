import * as React from 'react';
import { Card, CardContent } from './card';
import { Button } from './button';
import { cn } from '../../lib/utils';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 图标，可以是React节点或Lucide图标 */
  icon?: React.ReactNode;
  /** 主标题 */
  title: string;
  /** 描述文案 */
  description?: string;
  /** 操作按钮 */
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * 统一的空状态组件
 * 用于列表为空、加载失败等场景的友好提示
 */
export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, icon, title, description, action, ...props }, ref) => {
    return (
      <Card
        ref={ref}
        className={cn('border-dashed', className)}
        {...props}
      >
        <CardContent className="flex flex-col items-center justify-center py-12">
          {icon && (
            <div className="mb-4 text-muted-foreground">
              {icon}
            </div>
          )}
          <h3 className="mb-2 text-lg font-medium">{title}</h3>
          {description && (
            <p className="mb-4 text-sm text-muted-foreground text-center max-w-sm">
              {description}
            </p>
          )}
          {action && (
            <Button onClick={action.onClick} className="mt-2">
              {action.label}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }
);
EmptyState.displayName = 'EmptyState';
