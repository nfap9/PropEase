'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Pencil, Zap, Droplets } from 'lucide-react';
import { TableActions, TableAction } from '@/components/common/table-actions';
import { UtilityReading } from '@/types';

interface UseColumnsOptions {
  onEdit: (utility: UtilityReading) => void;
}

export function useColumns({ onEdit }: UseColumnsOptions): ColumnDef<UtilityReading>[] {
  return [
    {
      accessorKey: 'period_month',
      header: '月份',
      cell: ({ row }) => `${row.original.period_year}年${row.original.period_month}月`,
    },
    {
      accessorKey: 'room',
      header: '房间',
      cell: ({ row }) => {
        const room = row.original.room;
        return room ? `${room.apartment?.name || ''} - ${room.room_number}` : '-';
      },
    },
    {
      accessorKey: 'reading_date',
      header: '记录日期',
      cell: ({ row }) => row.original.reading_date,
    },
    {
      accessorKey: 'water_reading',
      header: '水表读数',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Droplets className="h-4 w-4 text-blue-500" />
          {row.original.water_reading !== null && row.original.water_reading !== undefined
            ? row.original.water_reading
            : '-'}
        </div>
      ),
    },
    {
      accessorKey: 'electricity_reading',
      header: '电表读数',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-yellow-500" />
          {row.original.electricity_reading !== null &&
          row.original.electricity_reading !== undefined
            ? row.original.electricity_reading
            : '-'}
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const utility = row.original;
        const actions: TableAction[] = [
          {
            label: '编辑',
            icon: Pencil,
            onClick: () => onEdit(utility),
          },
        ];
        return <TableActions actions={actions} />;
      },
    },
  ];
}
