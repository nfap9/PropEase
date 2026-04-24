/**
 * ReportsView - 报表视图
 *
 * 自包含视图，内部管理：
 * - 年度选择状态
 * - Tab 切换状态
 * - 数据获取
 */
import { useState } from 'react';
import { Select } from 'antd';
import { useReportsData } from '../hooks/use-reports';
import { getReportYearOptions, REPORTS } from '@/constants/reports';
import { ReportsOverviewTab } from '../components/reports-overview-tab';
import { ReportsIncomeTab } from '../components/reports-income-tab';
import { ReportsOccupancyTab } from '../components/reports-occupancy-tab';

type ReportTab = 'income' | 'occupancy' | 'overview';

export function ReportsView() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState<ReportTab>('income');
  const { overview, incomeReport, incomeLoading, occupancyReport, occupancyLoading } =
    useReportsData(selectedYear);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Select
          value={selectedYear.toString()}
          onChange={(value) => setSelectedYear(Number(value))}
          style={{ width: 120 }}
          data-testid={REPORTS.YEAR_SELECT}
          options={getReportYearOptions().map((year) => ({ value: year, label: `${year}年` }))}
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('income')}
          data-testid={REPORTS.INCOME_TAB}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'income' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          收入分析
        </button>
        <button
          onClick={() => setActiveTab('occupancy')}
          data-testid={REPORTS.OCCUPANCY_TAB}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'occupancy' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          入住率
        </button>
        <button
          onClick={() => setActiveTab('overview')}
          data-testid={REPORTS.OVERVIEW_TAB}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'overview' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          总览
        </button>
      </div>

      <div>
        {activeTab === 'income' && (
          <ReportsIncomeTab
            selectedYear={selectedYear}
            incomeReport={incomeReport}
            incomeLoading={incomeLoading}
          />
        )}
        {activeTab === 'occupancy' && (
          <ReportsOccupancyTab
            selectedYear={selectedYear}
            overview={overview}
            occupancyReport={occupancyReport}
            occupancyLoading={occupancyLoading}
          />
        )}
        {activeTab === 'overview' && <ReportsOverviewTab overview={overview} />}
      </div>
    </div>
  );
}
