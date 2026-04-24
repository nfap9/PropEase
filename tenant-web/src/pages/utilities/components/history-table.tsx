import { Table } from 'antd';
import { Button } from 'antd';
import { Pencil, Droplets, Zap } from 'lucide-react';
import type { UtilityReading } from '@/types';
import { formatDate } from '@/utils/date';

interface LeaseMonthRow {
  year: number;
  month: number;
  label: string;
  reading: UtilityReading | null;
  waterFee: number;
  electricityFee: number;
}

interface HistoryTableProps {
  data: LeaseMonthRow[];
  loading?: boolean;
  onEdit: (reading: UtilityReading) => void;
}

export function HistoryTable({ data, loading, onEdit }: HistoryTableProps) {
  const columns = [
    {
      title: '月份',
      dataIndex: 'label',
      key: 'label',
      width: 100,
    },
    {
      title: '记录日期',
      key: 'reading_date',
      width: 100,
      render: (_: unknown, record: LeaseMonthRow) =>
        record.reading ? formatDate(record.reading.reading_date) : '—',
    },
    {
      title: (
        <span className="flex items-center gap-1">
          <Droplets className="h-4 w-4 text-blue-500" />
          水 (m³)
        </span>
      ),
      key: 'water_reading',
      width: 90,
      render: (_: unknown, record: LeaseMonthRow) =>
        record.reading?.water_reading != null ? record.reading.water_reading : '—',
    },
    {
      title: (
        <span className="flex items-center gap-1">
          <Zap className="h-4 w-4 text-yellow-500" />
          电 (kWh)
        </span>
      ),
      key: 'electricity_reading',
      width: 90,
      render: (_: unknown, record: LeaseMonthRow) =>
        record.reading?.electricity_reading != null ? record.reading.electricity_reading : '—',
    },
    {
      title: '水费',
      dataIndex: 'waterFee',
      key: 'waterFee',
      width: 80,
      render: (fee: number) => (fee > 0 ? fee.toFixed(2) : '—'),
    },
    {
      title: '电费',
      dataIndex: 'electricityFee',
      key: 'electricityFee',
      width: 80,
      render: (fee: number) => (fee > 0 ? fee.toFixed(2) : '—'),
    },
    {
      title: '',
      key: 'actions',
      width: 50,
      render: (_: unknown, record: LeaseMonthRow) =>
        record.reading && (
          <Button
            type="text"
            size="small"
            className="h-8 w-8 p-0"
            onClick={() => onEdit(record.reading!)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={data.map((row) => ({ ...row, key: `${row.year}-${row.month}` }))}
      pagination={false}
      loading={loading}
    />
  );
}