'use client';

import { Badge } from '@apartment-ultra/shared-ui/components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@apartment-ultra/shared-ui/components/ui';
import { BILL_STATUS_CONFIG, ROOM_STATUS_CONFIG } from '@/lib/status-config';
import type { DashboardOverview } from '@/types';

export function ReportsOverviewTab({ overview }: { overview: DashboardOverview | undefined }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">公寓数量</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.total_apartments || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">活跃租约</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.active_leases || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">租客总数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.total_tenants || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">本月收入</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">¥{(overview?.monthly_revenue || 0).toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>账单状态</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>待收账单</span>
                <Badge variant={BILL_STATUS_CONFIG.pending.variant}>{overview?.pending_bills || 0} 笔</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>逾期账单</span>
                <Badge variant={BILL_STATUS_CONFIG.overdue.variant}>{overview?.overdue_bills || 0} 笔</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>房间状态</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>总房间数</span>
                <Badge variant="outline">{overview?.total_rooms || 0} 间</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>已入住房间</span>
                <Badge variant={ROOM_STATUS_CONFIG.occupied.variant}>{overview?.occupied_rooms || 0} 间</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>空置房间</span>
                <Badge variant={ROOM_STATUS_CONFIG.available.variant}>{overview?.available_rooms || 0} 间</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
