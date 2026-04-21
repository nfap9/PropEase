import type { ColumnsType } from 'antd/es/table';
import { Card, Table, Select, Button, Skeleton } from 'antd';
import type { MenuProps } from 'antd';
import { Dropdown } from 'antd';
import { FilePlus, Download, ChevronDown, FileSpreadsheet, AlertCircle, Building2 } from 'lucide-react';
import type { Bill, BillStatus } from '@/types';
import { BILLS } from '@/schemas/bills';
import type { BillStats } from '@/utils/bills';
import { tenantMessages } from '@/i18n';

// ============== 类型 ==============
interface BillsListViewProps {
  orgId?: string;
  billsLoading: boolean;
  bills: Bill[];
  columns: ColumnsType<Bill>;
  stats: BillStats;
  statusFilter: BillStatus | 'all';
  onStatusFilterChange: (value: BillStatus | 'all') => void;
  onGenerate: () => void;
  onExport: (type: 'all' | 'unfinished') => void;
  canGenerateBill?: boolean;
}

// ============== 统计卡片 ==============
function StatsCards({ stats }: { stats: BillStats }) {
  const pendingBillCount = stats.pending + stats.partial + stats.overdue;
  const pendingAmount = stats.totalAmount - stats.paidAmount;

  return (
    <Card>
      <div className="grid grid-cols-4 gap-4">
        <div>
          <div className="text-sm text-muted-foreground">{tenantMessages.bills.list.total}</div>
          <div className="mt-2 text-2xl font-semibold">{stats.total}</div>
        </div>
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{tenantMessages.bills.list.pendingAmount}</span>
            <span>{pendingBillCount} 笔</span>
          </div>
          <div className="mt-2 text-2xl font-semibold text-amber-600">
            ¥{pendingAmount.toLocaleString('zh-CN')}
          </div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">{tenantMessages.bills.list.paidAmount}</div>
          <div className="mt-2 text-2xl font-semibold text-green-600">
            ¥{stats.paidAmount.toLocaleString('zh-CN')}
          </div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">{tenantMessages.bills.list.overdueCount}</div>
          <div className="mt-2 text-2xl font-semibold text-destructive">{stats.overdue}</div>
        </div>
      </div>
    </Card>
  );
}

// ============== 状态筛选器 ==============
function StatusFilter({
  value,
  onChange,
}: {
  value: BillStatus | 'all';
  onChange: (v: BillStatus | 'all') => void;
}) {
  return (
    <div>
      <span className="mb-2 block text-sm text-gray-500">状态</span>
      <Select value={value} onChange={onChange} className="w-full">
        <Select.Option value="all">{tenantMessages.bills.list.all}</Select.Option>
        <Select.Option value="pending">{tenantMessages.bills.list.pending}</Select.Option>
        <Select.Option value="partial">{tenantMessages.bills.list.partial}</Select.Option>
        <Select.Option value="paid">{tenantMessages.bills.list.paid}</Select.Option>
        <Select.Option value="overdue">{tenantMessages.bills.list.overdue}</Select.Option>
      </Select>
    </div>
  );
}

// ============== 导出菜单 ==============
function ExportDropdown({
  onExport,
  disabled,
}: {
  onExport: (type: 'all' | 'unfinished') => void;
  disabled: boolean;
}) {
  const items: MenuProps['items'] = [
    {
      key: 'all',
      icon: <FileSpreadsheet className="mr-2 h-4 w-4" />,
      label: tenantMessages.bills.list.exportAll,
      onClick: () => onExport('all'),
    },
    {
      key: 'unfinished',
      icon: <AlertCircle className="mr-2 h-4 w-4" />,
      label: tenantMessages.bills.list.exportUnfinished,
      onClick: () => onExport('unfinished'),
    },
  ];

  return (
    <Dropdown menu={{ items }} trigger={['click']}>
      <Button disabled={disabled} data-testid={BILLS.EXPORT_BUTTON}>
        <Download className="mr-2 h-4 w-4" />
        {tenantMessages.bills.list.export}
        <ChevronDown className="ml-2 h-4 w-4" />
      </Button>
    </Dropdown>
  );
}

// ============== 主组件 ==============
export function BillsListView({
  orgId,
  billsLoading,
  bills,
  columns,
  stats,
  statusFilter,
  onStatusFilterChange,
  onGenerate,
  onExport,
  canGenerateBill = true,
}: BillsListViewProps) {
  if (!orgId) {
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-4">
        <Building2 className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">{tenantMessages.bills.list.noTeamTitle}</h2>
        <p className="text-muted-foreground">{tenantMessages.bills.list.noTeamDescription}</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <StatsCards stats={stats} />

      <Card>
        {billsLoading ? (
          <Skeleton active className="h-96" />
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {canGenerateBill && (
                  <Button type="primary" onClick={onGenerate} data-testid={BILLS.GENERATE_BUTTON}>
                    <FilePlus className="mr-2 h-4 w-4" />
                    {tenantMessages.bills.list.generate}
                  </Button>
                )}
                <StatusFilter value={statusFilter} onChange={onStatusFilterChange} />
              </div>
              <ExportDropdown onExport={onExport} disabled={bills.length === 0} />
            </div>

            <Table columns={columns} dataSource={bills} rowKey="id" pagination={false} />
          </>
        )}
      </Card>
    </div>
  );
}
