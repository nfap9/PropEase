
import * as React from 'react';

import { cn } from '../../lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';

export interface PageSectionProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** 区块标题。 */
  title?: React.ReactNode;
  /** 区块描述。 */
  description?: React.ReactNode;
  /** 区块头部右侧操作。 */
  actions?: React.ReactNode;
  /** 是否使用卡片外观。 */
  surface?: 'plain' | 'card';
  /** 主体区域类名。 */
  contentClassName?: string;
}

/**
 * 页面内容区块。
 *
 * 适用于页面中的主内容块、筛选区块或次级信息块。
 * 默认使用轻量 `div` 容器；当需要更明确的分组边界时，可切换为 `card` 外观。
 */
export function PageSection({
  title,
  description,
  actions,
  surface = 'plain',
  className,
  contentClassName,
  children,
  ...props
}: PageSectionProps) {
  if (surface === 'card') {
    return (
      <Card className={className} {...props}>
        {title || description || actions ? (
          <CardHeader className="border-border/60 from-primary/[0.03] gap-4 border-b bg-gradient-to-r to-transparent pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              {title ? <CardTitle>{title}</CardTitle> : null}
              {description ? <CardDescription>{description}</CardDescription> : null}
            </div>
            {actions ? <div className="shrink-0">{actions}</div> : null}
          </CardHeader>
        ) : null}
        <CardContent className={cn('p-5 sm:p-6', contentClassName)}>{children}</CardContent>
      </Card>
    );
  }

  return (
    <section className={cn('space-y-4', className)} {...props}>
      {title || description || actions ? (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            {title ? <h3 className="text-lg font-semibold">{title}</h3> : null}
            {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
      ) : null}
      <div className={contentClassName}>{children}</div>
    </section>
  );
}
