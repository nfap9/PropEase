'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@apartment-ultra/shared-ui/components/ui';
import { Download, DollarSign, Eye, Share2 } from 'lucide-react';
import { TableActions, type TableAction } from '@/components/common/table-actions';
import { formatDate } from '@/lib/date-utils';
import { BILL_STATUS_CONFIG } from '@/lib/status-config';
import type { Bill } from '@/types';
import { formatBillLocation, formatBillPeriod } from './bills.utils';

interface CreateBillsColumnsOptions {
  sharingBillId: string | null;
  onViewDetail: (bill: Bill) => void;
  onPayment: (bill: Bill) => void;
  onExportPdf: (billId: string) => void;
  onShare: (bill: Bill) => void;
}

export function createBillsColumns({
  sharingBillId,
  onViewDetail,
  onPayment,
  onExportPdf,
  onShare,
}: CreateBillsColumnsOptions): ColumnDef<Bill>[] {
  return [
    {
      accessorKey: 'bill_month',
      header: '月份',
      cell: ({ row }) => formatBillPeriod(row.original),
    },
    {
      accessorKey: 'lease',
      header: '房间/租客',
      cell: ({ row }) => (
        <div>
          <div>{formatBillLocation(row.original)}</div>
          <div className="text-xs text-muted-foreground">{row.original.lease?.tenant?.name || '-'}</div>
        </div>
      ),
    },
    {
      accessorKey: 'total_amount',
      header: '账单金额',
      cell: ({ row }) => `¥${row.original.total_amount.toLocaleString()}`,
    },
    {
      accessorKey: 'paid_amount',
      header: '已付金额',
      cell: ({ row }) => (
        <span className={row.original.paid_amount < row.original.total_amount ? 'text-orange-600' : 'text-green-600'}>
          ¥{row.original.paid_amount.toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: 'due_date',
      header: '到期日',
      cell: ({ row }) => formatDate(row.original.due_date),
    },
    {
      accessorKey: 'status',
      header: '状态',
      cell: ({ row }) => {
        const config = BILL_STATUS_CONFIG[row.original.status];
        const Icon = config.icon;

        return (
          <Badge variant={config.variant} className="gap-1">
            <Icon className="h-3 w-3" />
            {config.label}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const bill = row.original;
        const actions: TableAction[] = [
          {
            label: '查看详情',
            icon: Eye,
            onClick: () => onViewDetail(bill),
          },
          {
            label: '登记付款',
            icon: DollarSign,
            onClick: () => onPayment(bill),
            show: bill.status !== 'paid',
          },
          {
            label: '导出PDF',
            icon: Download,
            onClick: () => onExportPdf(bill.id),
          },
          {
            label: sharingBillId === bill.id ? '生成分享图中…' : '分享账单',
            icon: Share2,
            onClick: () => onShare(bill),
          },
        ];

        return <TableActions actions={actions} />;
      },
    },
  ];
}
