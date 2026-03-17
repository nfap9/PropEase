'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/main-layout';
import { PermissionPageGuard } from '@/components/layout/permission-page-guard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@apartment-ultra/shared-ui/components/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@apartment-ultra/shared-ui/components/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@apartment-ultra/shared-ui/components/ui';
import { Skeleton } from '@apartment-ultra/shared-ui/components/ui';
import { Badge } from '@apartment-ultra/shared-ui/components/ui';
import { BILL_STATUS_CONFIG, ROOM_STATUS_CONFIG } from '@/lib/status-config';
import { reportsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth/context';
import { IncomeReport } from '@/types';
import { Building2 } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// 注意: 实际使用时从 testids 导入 REPORTS 常量
const REPORTS = {
  HEADING: 'reports-heading',
  YEAR_SELECT: 'reports-year-select',
  INCOME_TAB: 'reports-income-tab',
  OCCUPANCY_TAB: 'reports-occupancy-tab',
  OVERVIEW_TAB: 'reports-overview-tab',
} as const;

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function ReportsPage() {
  const { organization, isLoading: authLoading } = useAuth();
  const orgId = organization?.id;

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const { data: overview } = useQuery({
    queryKey: ['dashboard-overview', orgId],
    queryFn: () => reportsApi.getOverview(orgId!),
    enabled: !!orgId,
  });

  const { data: incomeReport, isLoading: incomeLoading } = useQuery({
    queryKey: ['income-report', orgId, selectedYear],
    queryFn: () => reportsApi.getIncome(orgId!, selectedYear),
    enabled: !!orgId,
  });

  const { data: occupancyReport, isLoading: occupancyLoading } = useQuery({
    queryKey: ['occupancy-report', orgId, selectedYear],
    queryFn: () => reportsApi.getOccupancy(orgId!, selectedYear),
    enabled: !!orgId,
  });

  if (authLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-96" />
        </div>
      </MainLayout>
    );
  }

  // 无组织时的提示
  if (!orgId) {
    return (
      <MainLayout>
        <div className="flex h-full flex-col items-center justify-center space-y-4">
          <Building2 className="h-16 w-16 text-muted-foreground" />
          <h2 className="text-xl font-semibold">请先创建或加入组织</h2>
          <p className="text-muted-foreground">在顶部导航栏选择或创建一个组织开始使用</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <PermissionPageGuard>
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold" data-testid={REPORTS.HEADING}>经营分析</h1>
            <Select
              value={selectedYear.toString()}
              onValueChange={(value) => setSelectedYear(Number(value))}
              data-testid={REPORTS.YEAR_SELECT}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026].map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}年
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="income" className="space-y-4">
            <TabsList>
              <TabsTrigger value="income" data-testid={REPORTS.INCOME_TAB}>收入分析</TabsTrigger>
              <TabsTrigger value="occupancy" data-testid={REPORTS.OCCUPANCY_TAB}>入住率</TabsTrigger>
              <TabsTrigger value="overview" data-testid={REPORTS.OVERVIEW_TAB}>总览</TabsTrigger>
            </TabsList>

            <TabsContent value="income" className="space-y-4">
              {/* Income Summary Cards */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">年度总收入</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ¥
                      {incomeReport
                        ?.reduce((sum: number, r: IncomeReport) => sum + r.total_amount, 0)
                        .toLocaleString() || 0}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">已收款</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      ¥
                      {incomeReport
                        ?.reduce((sum: number, r: IncomeReport) => sum + r.collected_amount, 0)
                        .toLocaleString() || 0}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">待收款</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      ¥
                      {(
                        (incomeReport?.reduce(
                          (sum: number, r: IncomeReport) => sum + r.total_amount,
                          0
                        ) || 0) -
                        (incomeReport?.reduce(
                          (sum: number, r: IncomeReport) => sum + r.collected_amount,
                          0
                        ) || 0)
                      ).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">平均回款率</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {incomeReport && incomeReport.length > 0
                        ? (
                            incomeReport.reduce(
                              (sum: number, r: IncomeReport) => sum + r.collection_rate,
                              0
                            ) / incomeReport.length
                          ).toFixed(1)
                        : 0}
                      %
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Income Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>月度收入趋势</CardTitle>
                  <CardDescription>{selectedYear}年各月收入与回款情况</CardDescription>
                </CardHeader>
                <CardContent>
                  {incomeLoading ? (
                    <Skeleton className="h-[400px]" />
                  ) : (
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={incomeReport || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />
                        <YAxis />
                        <Tooltip
                          formatter={(value: number | undefined) =>
                            `¥${(value ?? 0).toLocaleString()}`
                          }
                        />
                        <Legend />
                        <Bar dataKey="total_amount" name="应收金额" fill="#8884d8" />
                        <Bar dataKey="collected_amount" name="实收金额" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Income by Category */}
              <Card>
                <CardHeader>
                  <CardTitle>收入构成</CardTitle>
                  <CardDescription>各类型收入占比</CardDescription>
                </CardHeader>
                <CardContent>
                  {incomeLoading ? (
                    <Skeleton className="h-[300px]" />
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={[
                              {
                                name: '租金',
                                value:
                                  incomeReport?.reduce(
                                    (sum: number, r: IncomeReport) => sum + r.total_rent,
                                    0
                                  ) || 0,
                              },
                              {
                                name: '水费',
                                value:
                                  incomeReport?.reduce(
                                    (sum: number, r: IncomeReport) => sum + r.total_water,
                                    0
                                  ) || 0,
                              },
                              {
                                name: '电费',
                                value:
                                  incomeReport?.reduce(
                                    (sum: number, r: IncomeReport) => sum + r.total_electricity,
                                    0
                                  ) || 0,
                              },
                              {
                                name: '其他',
                                value:
                                  incomeReport?.reduce(
                                    (sum: number, r: IncomeReport) => sum + r.total_other,
                                    0
                                  ) || 0,
                              },
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }: { name?: string; percent?: number }) =>
                              `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`
                            }
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {COLORS.map((color, index) => (
                              <Cell key={`cell-${index}`} fill={color} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number | undefined) =>
                              `¥${(value ?? 0).toLocaleString()}`
                            }
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ background: COLORS[0] }}
                            />
                            租金
                          </span>
                          <span>
                            ¥
                            {incomeReport
                              ?.reduce((sum: number, r: IncomeReport) => sum + r.total_rent, 0)
                              .toLocaleString() || 0}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ background: COLORS[1] }}
                            />
                            水费
                          </span>
                          <span>
                            ¥
                            {incomeReport
                              ?.reduce((sum: number, r: IncomeReport) => sum + r.total_water, 0)
                              .toLocaleString() || 0}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ background: COLORS[2] }}
                            />
                            电费
                          </span>
                          <span>
                            ¥
                            {incomeReport
                              ?.reduce(
                                (sum: number, r: IncomeReport) => sum + r.total_electricity,
                                0
                              )
                              .toLocaleString() || 0}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ background: COLORS[3] }}
                            />
                            其他
                          </span>
                          <span>
                            ¥
                            {incomeReport
                              ?.reduce((sum: number, r: IncomeReport) => sum + r.total_other, 0)
                              .toLocaleString() || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="occupancy" className="space-y-4">
              {/* Occupancy Summary */}
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
                    <div className="text-2xl font-bold text-green-600">
                      {overview?.occupied_rooms || 0}
                    </div>
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

              {/* Occupancy Chart */}
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
                        <Tooltip formatter={(value: number | undefined) => `${value ?? 0}%`} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="occupancy_rate"
                          name="入住率"
                          stroke="#8884d8"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Room Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>房间状态分布</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {overview?.occupied_rooms || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">已入住</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {overview?.available_rooms || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">空置</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600">
                        {(overview?.total_rooms || 0) -
                          (overview?.occupied_rooms || 0) -
                          (overview?.available_rooms || 0)}
                      </div>
                      <div className="text-sm text-muted-foreground">维修/预订</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold">{overview?.occupancy_rate || 0}%</div>
                      <div className="text-sm text-muted-foreground">入住率</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="overview" className="space-y-4">
              {/* Overview Stats */}
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
                    <div className="text-2xl font-bold text-green-600">
                      ¥{(overview?.monthly_revenue || 0).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Stats */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>账单状态</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span>待收账单</span>
                        <Badge variant={BILL_STATUS_CONFIG.pending.variant}>
                          {overview?.pending_bills || 0} 笔
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>逾期账单</span>
                        <Badge variant={BILL_STATUS_CONFIG.overdue.variant}>
                          {overview?.overdue_bills || 0} 笔
                        </Badge>
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
                        <Badge variant={ROOM_STATUS_CONFIG.occupied.variant}>
                          {overview?.occupied_rooms || 0} 间
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>空置房间</span>
                        <Badge variant={ROOM_STATUS_CONFIG.available.variant}>
                          {overview?.available_rooms || 0} 间
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </MainLayout>
    </PermissionPageGuard>
  );
}
