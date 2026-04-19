
import { Link } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { Ban, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@apartment-ultra/shared-ui/components/shadcn';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@apartment-ultra/shared-ui/components/ui';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { formatDate } from '@/utils/date';
import { LEASE_STATUS_CONFIG } from '@/utils/status';
import type { Lease } from '@/types';
import { MoreHorizontal } from 'lucide-react';

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
          <Link
            to={`/leases/${row.original.id}`}
            className="flex flex-col hover:underline"
          >
            {room.apartment && (
              <span className="text-xs text-muted-foreground">
                {room.apartment.name}
              </span>
            )}
            <span>{room.room_number}</span>
          </Link>
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
      size: 80,
      minSize: 60,
      cell: ({ row }) => {
        const lease = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(lease)}>
                <Pencil className="mr-2 h-4 w-4" />
                编辑
              </DropdownMenuItem>
              {lease.is_active && (
                <DropdownMenuItem onClick={() => onTerminate(lease)} className="text-destructive">
                  <Ban className="mr-2 h-4 w-4" />
                  终止
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onDelete(lease)} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
