'use client';

import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';
import { Ban, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@apartment-ultra/shared-ui/components/ui';
import { TableActions, type TableAction } from '@/components/common/table-actions';
import { formatDate } from '@/lib/date-utils';
import { LEASE_STATUS_CONFIG } from '@/lib/status-config';
import type { Lease } from '@/types';

interface CreateLeaseColumnsOptions {
  onEdit: (lease: Lease) => void;
  onTerminate: (lease: Lease) => void;
  onDelete: (lease: Lease) => void;
}

export function createLeaseColumns({
  onEdit,
  onTerminate,
  onDelete,
}: CreateLeaseColumnsOptions): ColumnDef<Lease>[] {
  return [
    {
      accessorKey: 'room',
      header: '房间',
      size: 180,
      minSize: 150,
      cell: ({ row }) => {
        const room = row.original.room;
        if (!room) {
          return '-';
        }

        return (
          <div className="flex flex-col">
            {room.apartment && (
              <Link
                href={`/apartments/${room.apartment.id}`}
                className="text-xs text-muted-foreground hover:underline"
              >
                {room.apartment.name}
              </Link>
            )}
            <span>{room.room_number}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'tenant',
      header: '租客',
      size: 120,
      minSize: 100,
      cell: ({ row }) => row.original.tenant?.name || '-',
    },
    {
      accessorKey: 'start_date',
      header: '开始日期',
      size: 120,
      minSize: 100,
      cell: ({ row }) => formatDate(row.original.start_date),
    },
    {
      accessorKey: 'end_date',
      header: '结束日期',
      size: 120,
      minSize: 100,
      cell: ({ row }) => (row.original.end_date ? formatDate(row.original.end_date) : '长期'),
    },
    {
      accessorKey: 'monthly_rent',
      header: '月租',
      size: 120,
      minSize: 100,
      cell: ({ row }) => `¥${row.original.monthly_rent.toLocaleString()}`,
    },
    {
      accessorKey: 'is_active',
      header: '状态',
      size: 100,
      minSize: 80,
      cell: ({ row }) => {
        const config = row.original.is_active ? LEASE_STATUS_CONFIG.active : LEASE_STATUS_CONFIG.inactive;
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      id: 'actions',
      size: 140,
      minSize: 120,
      cell: ({ row }) => {
        const lease = row.original;
        const actions: TableAction[] = [
          {
            label: '编辑',
            icon: Pencil,
            onClick: () => onEdit(lease),
          },
          {
            label: '终止',
            icon: Ban,
            onClick: () => onTerminate(lease),
            show: lease.is_active,
            testId: 'leases-terminate-btn',
          },
          {
            label: '删除',
            icon: Trash2,
            onClick: () => onDelete(lease),
            variant: 'destructive',
          },
        ];

        return <TableActions actions={actions} maxInline={2} />;
      },
    },
  ];
}
