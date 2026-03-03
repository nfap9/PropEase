'use client';

import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { TableActions, TableAction } from '@/components/common/table-actions';
import { Room, RoomStatus } from '@/types';
import { ROOM_STATUS_CONFIG } from '@/lib/status-config';
import { Pencil, Trash2, FileText, Ban, Wrench, CheckCircle } from 'lucide-react';

export interface UseColumnsOptions {
  onEdit: (room: Room) => void;
  onDelete: (room: Room) => void;
  onLease: (room: Room) => void;
  onTerminate: (room: Room) => void;
  onStatusChange: (room: Room, status: RoomStatus) => void;
}

export function useColumns({
  onEdit,
  onDelete,
  onLease,
  onTerminate,
  onStatusChange,
}: UseColumnsOptions): ColumnDef<Room>[] {
  return [
    {
      accessorKey: 'room_number',
      header: '房间号',
      enableSorting: true,
    },
    {
      accessorKey: 'apartment_name',
      header: '所属公寓',
      enableSorting: true,
      cell: ({ row }) => {
        const apartment = row.original.apartment;
        return apartment ? (
          <Link
            href={`/apartments/${apartment.id}`}
            className="text-primary hover:underline"
          >
            {apartment.name}
          </Link>
        ) : (
          '-'
        );
      },
    },
    {
      accessorKey: 'layout',
      header: '户型',
      enableSorting: true,
      cell: ({ row }) => row.original.layout || '-',
    },
    {
      accessorKey: 'area',
      header: '面积',
      enableSorting: true,
      cell: ({ row }) => (row.original.area ? `${row.original.area} m²` : '-'),
    },
    {
      accessorKey: 'monthly_rent',
      header: '月租',
      enableSorting: true,
      cell: ({ row }) => `¥${row.original.monthly_rent.toLocaleString()}`,
    },
    {
      accessorKey: 'status',
      header: '状态',
      enableSorting: true,
      cell: ({ row }) => {
        const status = ROOM_STATUS_CONFIG[row.original.status];
        return <Badge variant={status.variant}>{status.label}</Badge>;
      },
    },
    {
      accessorKey: 'notes',
      header: '备注',
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.notes || '-'}
        </span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const room = row.original;
        const isAvailable = room.status === 'available';
        const isOccupied = room.status === 'occupied';
        const isMaintenance = room.status === 'maintenance';

        const actions: TableAction[] = [
          {
            label: '编辑',
            icon: Pencil,
            onClick: () => onEdit(room),
          },
          {
            label: '签约',
            icon: FileText,
            onClick: () => onLease(room),
            show: isAvailable,
          },
          {
            label: '退租',
            icon: Ban,
            onClick: () => onTerminate(room),
            show: isOccupied,
          },
          {
            label: '开始维修',
            icon: Wrench,
            onClick: () => onStatusChange(room, 'maintenance'),
            show: isAvailable,
          },
          {
            label: '完成维修',
            icon: CheckCircle,
            onClick: () => onStatusChange(room, 'available'),
            show: isMaintenance,
          },
          {
            label: '删除',
            icon: Trash2,
            onClick: () => onDelete(room),
            variant: 'destructive',
          },
        ];
        return <TableActions actions={actions} maxInline={2} />;
      },
    },
  ];
}
