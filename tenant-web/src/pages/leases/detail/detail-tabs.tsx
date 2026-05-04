
import { Tabs } from 'antd';

interface LeaseDetailTabsProps {
  activeTab: 'info' | 'history';
  onTabChange: (tab: 'info' | 'history') => void;
}

export function LeaseDetailTabs({ activeTab, onTabChange }: LeaseDetailTabsProps) {
  return (
    <Tabs
      activeKey={activeTab}
      onChange={(v) => onTabChange(v as typeof activeTab)}
      items={[
        { key: 'info', label: '详情' },
        { key: 'history', label: '变更历史' },
      ]}
    />
  );
}
