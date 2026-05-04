/**
 * BillsListView - 账单列表视图
 *
 * 自包含的视图组件，内部管理：
 * - useBillList：获取账单列表
 * - useBillExport.exportExcel：导出 Excel
 * - useBillShare：分享功能
 * - 收款弹窗状态（内联 useState）
 * - 本地 statusFilter 状态
 * - 列定义（在组件内部生成，避免导出到独立文件后层层传递回调）
 *
 * 对外仅暴露 orgId、canGenerateBill 和 onViewDetail（跳转到详情弹窗需父组件协调）。
 */
import type { ColumnsType } from 'antd/es/table';
import { Card, Table, Select, Button, Skeleton, Dropdown, Tag } from 'antd';
import type { MenuProps } from 'antd';
import { Download, ChevronDown, FileSpreadsheet, AlertCircle, Building2, Eye, DollarSign, Share2, MoreHorizontal } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import type { Bill, BillStatus } from '@/types';
import { BILLS } from '@/constants/bills';
import { BILL_STATUS_CONFIG } from '@/constants/status';
import { buildBillStats, filterBillsByStatus, formatBillLocation, formatBillPeriod } from '@/utils/bills';
import { formatDate } from '@/utils/date';
import { tenantMessages } from '@/i18n';
import { BillGenerateDialog } from './bill-generate-dialog';
import { BillPaymentDialog } from './bill-payment-dialog';
import { useLoading } from '@/hooks/use-loading';
import { billsApi } from '@/api/bills';
import { useBillExport } from '../hooks/use-bill-export';
import { useBillShare } from '../hooks/use-bill-share';

// ============== 统计卡片 ==============
function StatsCards({ stats }: { stats: ReturnType<typeof buildBillStats> }) {
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

// ============== 操作列菜单 ==============
function ActionMenu({ bill, sharingBillId, onViewDetail, onPayment, onExportPdf, onShare }: {
  bill: Bill;
  sharingBillId: string | null;
  onViewDetail: (bill: Bill) => void;
  onPayment: (bill: Bill) => void;
  onExportPdf: (billId: string) => void;
  onShare: (bill: Bill) => void;
}) {
  const menuItems: MenuProps['items'] = [
    {
      key: 'view',
      icon: <Eye className="h-4 w-4" />,
      label: tenantMessages.bills.columns.viewDetail,
      onClick: () => onViewDetail(bill),
    },
    ...(bill.status !== 'paid' ? [{
      key: 'payment',
      icon: <DollarSign className="h-4 w-4" />,
      label: tenantMessages.bills.columns.recordPayment,
      onClick: () => onPayment(bill),
    }] : []),
    {
      key: 'export',
      icon: <Download className="h-4 w-4" />,
      label: tenantMessages.bills.columns.exportPdf,
      onClick: () => onExportPdf(bill.id),
    },
    {
      key: 'share',
      icon: <Share2 className="h-4 w-4" />,
      label: sharingBillId === bill.id
        ? tenantMessages.bills.columns.sharing
        : tenantMessages.bills.columns.share,
      onClick: () => onShare(bill),
    },
  ];

  return (
    <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
      <Button type="text" size="small" icon={<MoreHorizontal className="h-4 w-4" />} />
    </Dropdown>
  );
}

// ============== 主组件 ==============
export function BillsListView({
  orgId,
  canGenerateBill = true,
  onViewDetail,
}: {
  orgId?: string;
  canGenerateBill?: boolean;
  onViewDetail: (bill: Bill) => void;
}) {
  const [statusFilter, setStatusFilter] = useState<BillStatus | 'all'>('all');
  const [paymentBill, setPaymentBill] = useState<Bill | null>(null);

  const { loading: billsLoading, result: billsResult } = useLoading(() => billsApi.list(), { queryKey: ['bills'], auto: true });
  const bills = billsResult.data ?? [];
  const { exportPdf, exportExcel } = useBillExport();
  const { sharingBillId, handleShareBill } = useBillShare();

  const filteredBills = useMemo(
    () => filterBillsByStatus(bills, statusFilter),
    [bills, statusFilter],
  );
  const stats = useMemo(() => buildBillStats(bills), [bills]);

  const handleExport = useCallback(
    (type: 'all' | 'unfinished') => {
      exportExcel(type, statusFilter);
    },
    [exportExcel, statusFilter],
  );

  const openPaymentDialog = useCallback((bill: Bill) => {
    setPaymentBill(bill);
  }, []);

  const closePaymentDialog = useCallback(() => {
    setPaymentBill(null);
  }, []);

  const columns = useMemo((): ColumnsType<Bill> => {
    return [
      {
        title: tenantMessages.bills.columns.month,
        dataIndex: 'bill_month',
        key: 'bill_month',
        width: 120,
        minWidth: 100,
        render: (_, record) => formatBillPeriod(record),
      },
      {
        title: tenantMessages.bills.columns.roomTenant,
        dataIndex: 'lease',
        key: 'lease',
        width: 200,
        minWidth: 160,
        render: (_, record) => (
          <div>
            <div>{formatBillLocation(record)}</div>
            <div className="text-xs text-muted-foreground">
              {record.lease?.tenant?.name || '-'}
            </div>
          </div>
        ),
      },
      {
        title: tenantMessages.bills.columns.totalAmount,
        dataIndex: 'total_amount',
        key: 'total_amount',
        width: 120,
        minWidth: 100,
        render: (_, record) => `¥${record.total_amount.toLocaleString()}`,
      },
      {
        title: tenantMessages.bills.columns.paidAmount,
        dataIndex: 'paid_amount',
        key: 'paid_amount',
        width: 120,
        minWidth: 100,
        render: (_, record) => {
          const color = record.paid_amount < record.total_amount ? 'text-orange-600' : 'text-green-600';
          return <span className={color}>¥{record.paid_amount.toLocaleString()}</span>;
        },
      },
      {
        title: tenantMessages.bills.columns.dueDate,
        dataIndex: 'due_date',
        key: 'due_date',
        width: 120,
        minWidth: 100,
        render: (_, record) => formatDate(record.due_date),
      },
      {
        title: tenantMessages.bills.columns.status,
        dataIndex: 'status',
        key: 'status',
        width: 120,
        minWidth: 100,
        render: (_, record) => {
          const config = BILL_STATUS_CONFIG[record.status];
          if (!config) return null;
          return <Tag color={config.color}>{config.label}</Tag>;
        },
      },
      {
        title: '操作',
        key: 'actions',
        width: 80,
        minWidth: 60,
        render: (_, record) => (
          <ActionMenu
            bill={record}
            sharingBillId={sharingBillId}
            onViewDetail={onViewDetail}
            onPayment={openPaymentDialog}
            onExportPdf={exportPdf}
            onShare={handleShareBill}
          />
        ),
      },
    ];
  }, [sharingBillId, onViewDetail, openPaymentDialog, exportPdf, handleShareBill]);

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
    <>
      <div className="w-full space-y-4">
        <StatsCards stats={stats} />

        <Card>
          {billsLoading ? (
            <Skeleton active className="h-96" />
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {canGenerateBill && <BillGenerateDialog />}
                  <StatusFilter value={statusFilter} onChange={setStatusFilter} />
                </div>
                <ExportDropdown onExport={handleExport} disabled={bills.length === 0} />
              </div>

              <Table columns={columns} dataSource={filteredBills} rowKey="id" pagination={false} />
            </>
          )}
        </Card>
      </div>

      <BillPaymentDialog
        selectedBill={paymentBill}
        onClose={closePaymentDialog}
      />
    </>
  );
}
