import { Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Button, Tag } from 'antd';
import type { PendingUtilityBillRow } from '@/types/utilities';
import { UTILITY_BILL_STATUS_CONFIG } from '@/constants/utilities';
import { formatMeterValue, formatCurrencyValue } from '@/utils/utilities';

interface PendingBillTableProps {
  data: PendingUtilityBillRow[];
  onEntry: (record: PendingUtilityBillRow) => void;
  onUpdate: (record: PendingUtilityBillRow) => void;
}

export function PendingBillTable({ data, onEntry, onUpdate }: PendingBillTableProps) {
  const columns: ColumnsType<PendingUtilityBillRow> = [
    {
      title: '房间',
      key: 'room',
      render: (_, record) => (
        <div>
          <div className="text-sm text-gray-500">{record.apartmentName}</div>
          <div className="font-medium">{record.roomNumber}</div>
        </div>
      ),
    },
    {
      title: '租客',
      dataIndex: 'tenantName',
      key: 'tenantName',
    },
    {
      title: '账期',
      dataIndex: 'periodLabel',
      key: 'periodLabel',
    },
    {
      title: '上月读数',
      key: 'previous',
      render: (_, record) => (
        <div className="text-sm">
          <div>水 {formatMeterValue(record.waterPrevious)}</div>
          <div className="text-gray-400">电 {formatMeterValue(record.electricityPrevious)}</div>
        </div>
      ),
    },
    {
      title: '本月读数',
      key: 'current',
      render: (_, record) => (
        <div className="text-sm">
          <div>水 {formatMeterValue(record.waterCurrent)}</div>
          <div className="text-gray-400">电 {formatMeterValue(record.electricityCurrent)}</div>
        </div>
      ),
    },
    {
      title: '用量',
      key: 'usage',
      render: (_, record) => (
        <div className="text-sm">
          <div>水 {formatMeterValue(record.waterUsage)}</div>
          <div className="text-gray-400">电 {formatMeterValue(record.electricityUsage)}</div>
        </div>
      ),
    },
    {
      title: '费用',
      key: 'fees',
      render: (_, record) => (
        <div className="text-sm">
          <div>{formatCurrencyValue(record.totalUtilityFee)}</div>
          <div className="text-gray-400">
            水 {formatCurrencyValue(record.waterFee)} / 电 {formatCurrencyValue(record.electricityFee)}
          </div>
        </div>
      ),
    },
    {
      title: '状态',
      key: 'status',
      render: (_, record) => {
        const config = UTILITY_BILL_STATUS_CONFIG[record.status];
        const colorMap: Record<string, string> = {
          success: 'green',
          warning: 'orange',
          destructive: 'red',
          info: 'blue',
        };
        return <Tag color={colorMap[config.variant]}>{config.label}</Tag>;
      },
    },
    {
      title: '截止',
      dataIndex: 'deadline',
      key: 'deadline',
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) =>
        record.currentReading ? (
          <Button size="small" onClick={() => onUpdate(record)}>
            更新
          </Button>
        ) : (
          <Button size="small" onClick={() => onEntry(record)}>
            录入
          </Button>
        ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey={(record) => record.leaseId}
      pagination={false}
    />
  );
}