
import { Tag } from 'antd';
import { Card } from 'antd';
import type { CardProps } from 'antd';
import { BILL_STATUS_CONFIG, ROOM_STATUS_CONFIG } from '@/utils/status';
import type { DashboardOverview } from '@/types';

const STATUS_VARIANT_MAP: Record<string, string> = {
  default: 'default',
  success: 'green',
  warning: 'orange',
  destructive: 'red',
  outline: 'default',
};

export function ReportsOverviewTab({ overview }: { overview: DashboardOverview | undefined }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card size="small">
          <div className="pb-2">
            <span className="text-sm font-medium text-gray-500">公寓数量</span>
          </div>
          <div className="text-2xl font-bold">{overview?.total_apartments || 0}</div>
        </Card>
        <Card size="small">
          <div className="pb-2">
            <span className="text-sm font-medium text-gray-500">活跃租约</span>
          </div>
          <div className="text-2xl font-bold">{overview?.active_leases || 0}</div>
        </Card>
        <Card size="small">
          <div className="pb-2">
            <span className="text-sm font-medium text-gray-500">租客总数</span>
          </div>
          <div className="text-2xl font-bold">{overview?.total_tenants || 0}</div>
        </Card>
        <Card size="small">
          <div className="pb-2">
            <span className="text-sm font-medium text-gray-500">本月收入</span>
          </div>
          <div className="text-2xl font-bold text-green-600">¥{(overview?.monthly_revenue || 0).toLocaleString()}</div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card size="small" title="账单状态">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>待收账单</span>
              <Tag color={STATUS_VARIANT_MAP[BILL_STATUS_CONFIG.pending.variant] || 'default'}>{overview?.pending_bills || 0} 笔</Tag>
            </div>
            <div className="flex items-center justify-between">
              <span>逾期账单</span>
              <Tag color={STATUS_VARIANT_MAP[BILL_STATUS_CONFIG.overdue.variant] || 'default'}>{overview?.overdue_bills || 0} 笔</Tag>
            </div>
          </div>
        </Card>
        <Card size="small" title="房间状态">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>总房间数</span>
              <Tag>{overview?.total_rooms || 0} 间</Tag>
            </div>
            <div className="flex items-center justify-between">
              <span>已入住房间</span>
              <Tag color={STATUS_VARIANT_MAP[ROOM_STATUS_CONFIG.occupied.variant] || 'green'}>{overview?.occupied_rooms || 0} 间</Tag>
            </div>
            <div className="flex items-center justify-between">
              <span>空置房间</span>
              <Tag color={STATUS_VARIANT_MAP[ROOM_STATUS_CONFIG.available.variant] || 'blue'}>{overview?.available_rooms || 0} 间</Tag>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
