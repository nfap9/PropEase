'use client';

import { Tabs, TabsList, TabsTrigger } from '@apartment-ultra/shared-ui/components/ui';

interface LeaseDetailTabsProps {
  activeTab: 'info' | 'fee-items' | 'history';
  onTabChange: (tab: 'info' | 'fee-items' | 'history') => void;
}

export function LeaseDetailTabs({ activeTab, onTabChange }: LeaseDetailTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as typeof activeTab)}>
      <TabsList>
        <TabsTrigger value="info">详情</TabsTrigger>
        <TabsTrigger value="fee-items">费用项目</TabsTrigger>
        <TabsTrigger value="history">变更历史</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
