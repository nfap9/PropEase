import type { ColumnDef } from '@tanstack/react-table';
import { StatusBadge } from '@apartment-ultra/shared-ui/components/ui';
import type { PendingUtilityBillRow } from './utilities.types';
import { UTILITY_BILL_STATUS_CONFIG } from './utilities.constants';
import { formatMeterValue, formatCurrencyValue } from './utilities.utils';

export const pendingUtilityBillColumns: ColumnDef<PendingUtilityBillRow>[] = [
  {
    id: 'room',
    header: '房间',
    size: 180,
    minSize: 150,
    meta: { sticky: 'left' as const },
    cell: ({ row }) => (
      <div>
        <div>{row.original.apartmentName}</div>
        <div className="font-medium">{row.original.roomNumber}</div>
      </div>
    ),
  },
  {
    accessorKey: 'tenantName',
    header: '租客',
    size: 100,
    minSize: 80,
  },
  {
    accessorKey: 'periodLabel',
    header: '账期',
    size: 100,
    minSize: 80,
  },
  {
    id: 'previousReadings',
    header: '上月水电读数',
    size: 120,
    minSize: 100,
    cell: ({ row }) => (
      <div>
        <div>水 {formatMeterValue(row.original.waterPrevious)}</div>
        <div className="text-muted-foreground">
          电 {formatMeterValue(row.original.electricityPrevious)}
        </div>
      </div>
    ),
  },
  {
    id: 'currentReadings',
    header: '本月水电读数',
    size: 120,
    minSize: 100,
    cell: ({ row }) => (
      <div>
        <div>水 {formatMeterValue(row.original.waterCurrent)}</div>
        <div className="text-muted-foreground">
          电 {formatMeterValue(row.original.electricityCurrent)}
        </div>
      </div>
    ),
  },
  {
    id: 'usage',
    header: '水电用量',
    size: 120,
    minSize: 100,
    cell: ({ row }) => (
      <div>
        <div>水 {formatMeterValue(row.original.waterUsage)}</div>
        <div className="text-muted-foreground">
          电 {formatMeterValue(row.original.electricityUsage)}
        </div>
      </div>
    ),
  },
  {
    id: 'fees',
    header: '水电费',
    size: 140,
    minSize: 120,
    cell: ({ row }) => (
      <div>
        <div>{formatCurrencyValue(row.original.totalUtilityFee)}</div>
        <div className="text-muted-foreground">
          水 {formatCurrencyValue(row.original.waterFee)} / 电{' '}
          {formatCurrencyValue(row.original.electricityFee)}
        </div>
      </div>
    ),
  },
  {
    id: 'status',
    header: '状态',
    size: 100,
    minSize: 80,
    cell: ({ row }) => {
      const statusConfig = UTILITY_BILL_STATUS_CONFIG[row.original.status];
      return <StatusBadge variant={statusConfig.variant}>{statusConfig.label}</StatusBadge>;
    },
  },
  {
    accessorKey: 'deadline',
    header: '出账截止时间',
    size: 140,
    minSize: 120,
  },
  {
    id: 'actions',
    header: '操作',
    size: 100,
    minSize: 80,
    meta: { sticky: 'right' as const },
  },
];
