
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@apartment-ultra/shared-ui/components/ui';
import { Skeleton } from '@apartment-ultra/shared-ui/components/ui';
import type { IncomeReport } from '@/types';
import { REPORT_COLORS } from '@/schemas/reports';
import { buildIncomeCategoryData, buildIncomeSummary } from '@/utils/reports';

export function ReportsIncomeTab({
  selectedYear,
  incomeReport,
  incomeLoading,
}: {
  selectedYear: number;
  incomeReport: IncomeReport[] | undefined;
  incomeLoading: boolean;
}) {
  const summary = buildIncomeSummary(incomeReport);
  const categoryData = buildIncomeCategoryData(incomeReport);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">年度总收入</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{summary.totalAmount.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">已收款</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">¥{summary.collectedAmount.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">待收款</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">¥{summary.pendingAmount.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">平均回款率</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.averageCollectionRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

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
                <Tooltip formatter={(value) => `¥${(Number(value) ?? 0).toLocaleString()}`} />
                <Legend />
                <Bar dataKey="total_amount" name="应收金额" fill="#8884d8" />
                <Bar dataKey="collected_amount" name="实收金额" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

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
                    data={categoryData}
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
                    {REPORT_COLORS.map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `¥${(Number(value) ?? 0).toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-4">
                {categoryData.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ background: REPORT_COLORS[index] }} />
                      {item.name}
                    </span>
                    <span>¥{item.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
