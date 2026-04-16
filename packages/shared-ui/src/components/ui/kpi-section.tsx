
import * as React from 'react';

import { PageSection, type PageSectionProps } from './page-section';
import { StatGrid } from './stat-grid';

export interface KpiSectionProps extends Omit<PageSectionProps, 'contentClassName'> {
  /** 指标网格列数。 */
  columns?: 2 | 3 | 4 | 6;
  /** 指标网格类名。 */
  gridClassName?: string;
}

/**
 * 指标区组合层。
 *
 * 用于“区块标题 + KPI 网格”的标准场景，
 * 内部组合 `PageSection` 与 `StatGrid`，减少页面重复样板代码。
 */
export function KpiSection({
  title,
  description,
  actions,
  surface = 'plain',
  className,
  columns = 4,
  gridClassName,
  children,
  ...props
}: KpiSectionProps) {
  return (
    <PageSection
      title={title}
      description={description}
      actions={actions}
      surface={surface}
      className={className}
      {...props}
    >
      <StatGrid columns={columns} className={gridClassName}>
        {children}
      </StatGrid>
    </PageSection>
  );
}
