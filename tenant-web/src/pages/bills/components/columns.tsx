import type { ColumnsType } from 'antd/es/table';
import { Tag, Dropdown, Button } from 'antd';
import type { MenuProps } from 'antd';
import { Download, DollarSign, Eye, Share2, MoreHorizontal } from 'lucide-react';
import { formatDate } from '@/utils/date';
import { BILL_STATUS_CONFIG } from '@/constants/status';
import type { Bill } from '@/types';
import { formatBillLocation, formatBillPeriod } from '@/utils/bills';
import { tenantMessages } from '@/i18n';

// ============== 类型 ==============
interface BillsColumnsProps {
  sharingBillId: string | null;
  onViewDetail: (bill: Bill) => void;
  onPayment: (bill: Bill) => void;
  onExportPdf: (billId: string) => void;
  onShare: (bill: Bill) => void;
}

// ============== 辅助函数 ==============
function AmountCell({ amount, total }: { amount: number; total: number }) {
  const color = amount < total ? 'text-orange-600' : 'text-green-600';
  return <span className={color}>¥{amount.toLocaleString()}</span>;
}

function StatusCell({ status }: { status: Bill['status'] }) {
  const config = BILL_STATUS_CONFIG[status];
  if (!config) return null;
  return <Tag color={config.color}>{config.label}</Tag>;
}

function ActionMenu({ bill, sharingBillId, onViewDetail, onPayment, onExportPdf, onShare }: {
  bill: Bill;
} & Omit<BillsColumnsProps, 'sharingBillId'> & { sharingBillId: string | null }) {
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

// ============== 列定义 ==============
export function createBillsColumns(props: BillsColumnsProps): ColumnsType<Bill> {
  const { sharingBillId, onViewDetail, onPayment, onExportPdf, onShare } = props;

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
      render: (_, record) => (
        <AmountCell amount={record.paid_amount} total={record.total_amount} />
      ),
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
      render: (_, record) => <StatusCell status={record.status} />,
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
          onPayment={onPayment}
          onExportPdf={onExportPdf}
          onShare={onShare}
        />
      ),
    },
  ];
}
