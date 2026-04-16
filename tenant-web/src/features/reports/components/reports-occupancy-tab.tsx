
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@apartment-ultra/shared-ui/components/ui';
import { Skeleton } from '@apartment-ultra/shared-ui/components/ui';
import type { DashboardOverview, OccupancyReport } from '@/types';
import { getRoomsInOtherStatus } from '../reports.utils';

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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">总房间数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.total_rooms || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">已入住房间</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{overview?.occupied_rooms || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">当前入住率</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.occupancy_rate || 0}%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>月度入住率趋势</CardTitle>
          <CardDescription>{selectedYear}年各月入住率变化</CardDescription>
        </CardHeader>
        <CardContent>
          {occupancyLoading ? (
            <Skeleton className="h-[400px]" />
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>房间状态分布</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{overview?.occupied_rooms || 0}</div>
              <div className="text-sm text-muted-foreground">已入住</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{overview?.available_rooms || 0}</div>
              <div className="text-sm text-muted-foreground">空置</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{getRoomsInOtherStatus(overview)}</div>
              <div className="text-sm text-muted-foreground">维修/预订</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{overview?.occupancy_rate || 0}%</div>
              <div className="text-sm text-muted-foreground">入住率</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
