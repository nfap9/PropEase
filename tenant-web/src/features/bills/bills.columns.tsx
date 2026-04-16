'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@apartment-ultra/shared-ui/components/ui';
import { Download, DollarSign, Eye, Share2 } from 'lucide-react';
import { TableActions, type TableAction } from '@/components/common/table-actions';
import { formatDate } from '@/utils/date';
import { BILL_STATUS_CONFIG } from '@/utils/status';
import type { Bill } from '@/types';
import { formatBillLocation, formatBillPeriod } from './bills.utils';
import { tenantMessages } from '@/i18n';

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
      header: tenantMessages.bills.columns.month,
      size: 120,
      minSize: 100,
      cell: ({ row }) => formatBillPeriod(row.original),
    },
    {
      accessorKey: 'lease',
      header: tenantMessages.bills.columns.roomTenant,
      size: 200,
      minSize: 160,
      cell: ({ row }) => (
        <div>
          <div>{formatBillLocation(row.original)}</div>
          <div className="text-xs text-muted-foreground">{row.original.lease?.tenant?.name || '-'}</div>
        </div>
      ),
    },
    {
      accessorKey: 'total_amount',
      header: tenantMessages.bills.columns.totalAmount,
      size: 120,
      minSize: 100,
      cell: ({ row }) => `¥${row.original.total_amount.toLocaleString()}`,
    },
    {
      accessorKey: 'paid_amount',
      header: tenantMessages.bills.columns.paidAmount,
      size: 120,
      minSize: 100,
      cell: ({ row }) => (
        <span className={row.original.paid_amount < row.original.total_amount ? 'text-orange-600' : 'text-green-600'}>
          ¥{row.original.paid_amount.toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: 'due_date',
      header: tenantMessages.bills.columns.dueDate,
      size: 120,
      minSize: 100,
      cell: ({ row }) => formatDate(row.original.due_date),
    },
    {
      accessorKey: 'status',
      header: tenantMessages.bills.columns.status,
      size: 120,
      minSize: 100,
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
      size: 140,
      minSize: 120,
      cell: ({ row }) => {
        const bill = row.original;
        const actions: TableAction[] = [
          {
            label: tenantMessages.bills.columns.viewDetail,
            icon: Eye,
            onClick: () => onViewDetail(bill),
          },
          {
            label: tenantMessages.bills.columns.recordPayment,
            icon: DollarSign,
            onClick: () => onPayment(bill),
            show: bill.status !== 'paid',
          },
          {
            label: tenantMessages.bills.columns.exportPdf,
            icon: Download,
            onClick: () => onExportPdf(bill.id),
          },
          {
            label: sharingBillId === bill.id ? tenantMessages.bills.columns.sharing : tenantMessages.bills.columns.share,
            icon: Share2,
            onClick: () => onShare(bill),
          },
        ];

        return <TableActions actions={actions} />;
      },
    },
  ];
}
