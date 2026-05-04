
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, Skeleton } from 'antd';
import type { DashboardOverview, OccupancyReport } from '@/types';
import { getRoomsInOtherStatus } from '@/utils/reports';

export function ReportsOccupancyTab({
  selectedYear,
  overview,
  occupancyReport,
  occupancyLoading,
}: {
  selectedYear: number;
  overview: DashboardOverview | undefined;
  occupancyReport: OccupancyReport[] | undefined;
  occupancyLoading: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card size="small">
          <div className="pb-2">
            <span className="text-sm font-medium text-gray-500">总房间数</span>
          </div>
          <div className="text-2xl font-bold">{overview?.total_rooms || 0}</div>
        </Card>
        <Card size="small">
          <div className="pb-2">
            <span className="text-sm font-medium text-gray-500">已入住房间</span>
          </div>
          <div className="text-2xl font-bold text-green-600">{overview?.occupied_rooms || 0}</div>
        </Card>
        <Card size="small">
          <div className="pb-2">
            <span className="text-sm font-medium text-gray-500">当前入住率</span>
          </div>
          <div className="text-2xl font-bold">{overview?.occupancy_rate || 0}%</div>
        </Card>
      </div>

      <Card size="small" title="月度入住率趋势" extra={<span className="text-sm text-gray-500">{selectedYear}年各月入住率变化</span>}>
        {occupancyLoading ? (
          <Skeleton active paragraph={{ rows: 10 }} />
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={occupancyReport || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value) => `${Number(value) ?? 0}%`} />
              <Legend />
              <Line type="monotone" dataKey="occupancy_rate" name="入住率" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card size="small" title="房间状态分布">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{overview?.occupied_rooms || 0}</div>
            <div className="text-sm text-gray-500">已入住</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{overview?.available_rooms || 0}</div>
            <div className="text-sm text-gray-500">空置</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">{getRoomsInOtherStatus(overview)}</div>
            <div className="text-sm text-gray-500">维修/预订</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{overview?.occupancy_rate || 0}%</div>
            <div className="text-sm text-gray-500">入住率</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
