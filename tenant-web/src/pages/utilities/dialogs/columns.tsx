
import type { ColumnsType } from 'antd/es/table';
import { Tag } from 'antd';
import type { PendingUtilityBillRow } from '@/types/utilities';
import { UTILITY_BILL_STATUS_CONFIG } from '@/constants/utilities';
import { formatMeterValue, formatCurrencyValue } from '@/utils/utilities';

export const pendingUtilityBillColumns: ColumnsType<PendingUtilityBillRow> = [
  {
    title: '房间',
    key: 'room',
    width: 180,
    minWidth: 150,
    fixed: 'left' as const,
    render: (_, record) => (
      <div>
        <div>{record.apartmentName}</div>
        <div className="font-medium">{record.roomNumber}</div>
      </div>
    ),
  },
  {
    title: '租客',
    dataIndex: 'tenantName',
    key: 'tenantName',
    width: 100,
    minWidth: 80,
  },
  {
    title: '账期',
    dataIndex: 'periodLabel',
    key: 'periodLabel',
    width: 100,
    minWidth: 80,
  },
  {
    title: '上月水电读数',
    key: 'previousReadings',
    width: 120,
    minWidth: 100,
    render: (_, record) => (
      <div>
        <div>水 {formatMeterValue(record.waterPrevious)}</div>
        <div className="text-muted-foreground">
          电 {formatMeterValue(record.electricityPrevious)}
        </div>
      </div>
    ),
  },
  {
    title: '本月水电读数',
    key: 'currentReadings',
    width: 120,
    minWidth: 100,
    render: (_, record) => (
      <div>
        <div>水 {formatMeterValue(record.waterCurrent)}</div>
        <div className="text-muted-foreground">
          电 {formatMeterValue(record.electricityCurrent)}
        </div>
      </div>
    ),
  },
  {
    title: '水电用量',
    key: 'usage',
    width: 120,
    minWidth: 100,
    render: (_, record) => (
      <div>
        <div>水 {formatMeterValue(record.waterUsage)}</div>
        <div className="text-muted-foreground">
          电 {formatMeterValue(record.electricityUsage)}
        </div>
      </div>
    ),
  },
  {
    title: '水电费',
    key: 'fees',
    width: 140,
    minWidth: 120,
    render: (_, record) => (
      <div>
        <div>{formatCurrencyValue(record.totalUtilityFee)}</div>
        <div className="text-muted-foreground">
          水 {formatCurrencyValue(record.waterFee)} / 电{' '}
          {formatCurrencyValue(record.electricityFee)}
        </div>
      </div>
    ),
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    minWidth: 80,
    render: (_, record) => {
      const statusConfig = UTILITY_BILL_STATUS_CONFIG[record.status];
      const colorMap: Record<string, string> = {
        success: 'green',
        warning: 'orange',
        destructive: 'red',
        info: 'blue',
      };
      return <Tag color={colorMap[statusConfig.variant]}>{statusConfig.label}</Tag>;
    },
  },
  {
    title: '出账截止时间',
    dataIndex: 'deadline',
    key: 'deadline',
    width: 140,
    minWidth: 120,
  },
  {
    title: '操作',
    key: 'actions',
    width: 100,
    minWidth: 80,
    fixed: 'right' as const,
  },
];
