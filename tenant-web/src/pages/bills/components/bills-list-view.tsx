
import type { ColumnsType } from 'antd/es/table';
import { AlertCircle, Building2, ChevronDown, Download, FilePlus, FileSpreadsheet } from 'lucide-react';
import { Card, Table, Select, Button, Skeleton } from 'antd';
import type { MenuProps } from 'antd';
import { Tag, Dropdown } from 'antd';
import type { Bill, BillStatus } from '@/types';
import { BILLS } from '@/schemas/bills';
import type { BillStats } from '@/utils/bills';
import { tenantMessages } from '@/i18n';

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
  /** 是否有生成账单权限 */
  canGenerateBill?: boolean;
}

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
  const pendingBillCount = stats.pending + stats.partial + stats.overdue;

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
      <div className="space-y-4">
        <Card>
          <div className="grid grid-cols-4 gap-4">
            <div className="min-w-0">
              <div className="text-sm text-muted-foreground">{tenantMessages.bills.list.total}</div>
              <div className="mt-2 text-2xl font-semibold tracking-tight">{stats.total}</div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{tenantMessages.bills.list.pendingAmount}</span>
                <span>{pendingBillCount} 笔</span>
              </div>
              <div className="mt-2 text-2xl font-semibold tracking-tight text-amber-600">
                ¥{(stats.totalAmount - stats.paidAmount).toLocaleString('zh-CN')}
              </div>
            </div>
            <div className="min-w-0">
              <div className="text-sm text-muted-foreground">{tenantMessages.bills.list.paidAmount}</div>
              <div className="mt-2 text-2xl font-semibold tracking-tight text-green-600">
                ¥{stats.paidAmount.toLocaleString('zh-CN')}
              </div>
            </div>
            <div className="min-w-0">
              <div className="text-sm text-muted-foreground">{tenantMessages.bills.list.overdueCount}</div>
              <div className="mt-2 text-2xl font-semibold tracking-tight text-destructive">{stats.overdue}</div>
            </div>
          </div>
        </Card>

        {billsLoading ? (
          <Skeleton active className="h-96" />
        ) : (
          <Card>
            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {canGenerateBill && (
                  <Button type="primary" onClick={onGenerate} data-testid={BILLS.GENERATE_BUTTON}>
                    <FilePlus className="mr-2 h-4 w-4" />
                    {tenantMessages.bills.list.generate}
                  </Button>
                )}
                <div>
                  <span className="mb-2 block text-sm text-gray-500">状态</span>
                  <Select
                    value={statusFilter}
                    onChange={(value) => onStatusFilterChange(value as BillStatus | 'all')}
                    className="w-full"
                  >
                    <Select.Option value="all">{tenantMessages.bills.list.all}</Select.Option>
                    <Select.Option value="pending">{tenantMessages.bills.list.pending}</Select.Option>
                    <Select.Option value="partial">{tenantMessages.bills.list.partial}</Select.Option>
                    <Select.Option value="paid">{tenantMessages.bills.list.paid}</Select.Option>
                    <Select.Option value="overdue">{tenantMessages.bills.list.overdue}</Select.Option>
                  </Select>
                </div>
              </div>

              <Dropdown
                menu={{
                  items: [
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
                  ],
                }}
                trigger={['click']}
              >
                <Button disabled={bills.length === 0} data-testid={BILLS.EXPORT_BUTTON}>
                  <Download className="mr-2 h-4 w-4" />
                  {tenantMessages.bills.list.export}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </Dropdown>
            </div>

            <Table
              columns={columns}
              dataSource={bills}
              rowKey="id"
              pagination={false}
            />
          </Card>
        )}
      </div>
    </div>
  );
}