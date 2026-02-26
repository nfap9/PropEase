'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { reportsApi, organizationsApi } from '@/lib/api';
import { Organization, IncomeReport, OccupancyReport } from '@/types';
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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function ReportsPage() {
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const { data: organizations, isLoading: orgsLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn: organizationsApi.list,
  });

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['dashboard-overview', selectedOrgId],
    queryFn: () => reportsApi.getOverview(selectedOrgId!),
    enabled: !!selectedOrgId,
  });

  const { data: incomeReport, isLoading: incomeLoading } = useQuery({
    queryKey: ['income-report', selectedOrgId, selectedYear],
    queryFn: () => reportsApi.getIncome(selectedOrgId!, selectedYear),
    enabled: !!selectedOrgId,
  });

  const { data: occupancyReport, isLoading: occupancyLoading } = useQuery({
    queryKey: ['occupancy-report', selectedOrgId, selectedYear],
    queryFn: () => reportsApi.getOccupancy(selectedOrgId!, selectedYear),
    enabled: !!selectedOrgId,
  });

  if (orgsLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-96" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">经营分析</h1>
          <div className="flex items-center gap-4">
            <Select
              value={selectedOrgId?.toString() || ''}
              onValueChange={(value) => setSelectedOrgId(Number(value))}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="选择组织" />
              </SelectTrigger>
              <SelectContent>
                {organizations?.map((org) => (
                  <SelectItem key={org.id} value={org.id.toString()}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedYear.toString()}
              onValueChange={(value) => setSelectedYear(Number(value))}
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
        </div>

        {!selectedOrgId ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              请选择一个组织查看经营分析数据
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="income" className="space-y-4">
            <TabsList>
              <TabsTrigger value="income">收入分析</TabsTrigger>
              <TabsTrigger value="occupancy">入住率</TabsTrigger>
              <TabsTrigger value="overview">总览</TabsTrigger>
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
                      ¥{incomeReport
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
                      ¥{incomeReport
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
                      ¥{(
                        (incomeReport?.reduce((sum: number, r: IncomeReport) => sum + r.total_amount, 0) || 0) -
                        (incomeReport?.reduce((sum: number, r: IncomeReport) => sum + r.collected_amount, 0) || 0)
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
                          formatter={(value: number) => `¥${value.toLocaleString()}`}
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
                                value: incomeReport?.reduce(
                                  (sum: number, r: IncomeReport) => sum + r.total_rent,
                                  0
                                ) || 0,
                              },
                              {
                                name: '水费',
                                value: incomeReport?.reduce(
                                  (sum: number, r: IncomeReport) => sum + r.total_water,
                                  0
                                ) || 0,
                              },
                              {
                                name: '电费',
                                value: incomeReport?.reduce(
                                  (sum: number, r: IncomeReport) => sum + r.total_electricity,
                                  0
                                ) || 0,
                              },
                              {
                                name: '其他',
                                value: incomeReport?.reduce(
                                  (sum: number, r: IncomeReport) => sum + r.total_other,
                                  0
                                ) || 0,
                              },
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) =>
                              `${name} ${(percent * 100).toFixed(0)}%`
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
                            formatter={(value: number) => `¥${value.toLocaleString()}`}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full" style={{ background: COLORS[0] }} />
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
                            <div className="h-3 w-3 rounded-full" style={{ background: COLORS[1] }} />
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
                            <div className="h-3 w-3 rounded-full" style={{ background: COLORS[2] }} />
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
                            <div className="h-3 w-3 rounded-full" style={{ background: COLORS[3] }} />
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
                        <Tooltip formatter={(value: number) => `${value}%`} />
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
                      <div className="text-3xl font-bold">
                        {overview?.occupancy_rate || 0}%
                      </div>
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
                        <Badge variant="secondary">{overview?.pending_bills || 0} 笔</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>逾期账单</span>
                        <Badge variant="destructive">{overview?.overdue_bills || 0} 笔</Badge>
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
                        <Badge>{overview?.occupied_rooms || 0} 间</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>空置房间</span>
                        <Badge variant="secondary">{overview?.available_rooms || 0} 间</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </MainLayout>
  );
}
