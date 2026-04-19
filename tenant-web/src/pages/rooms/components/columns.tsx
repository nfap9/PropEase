
import { Link } from 'react-router-dom';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@apartment-ultra/shared-ui/components/shadcn';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@apartment-ultra/shared-ui/components/ui';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Room, RoomStatus } from '@/types';
import { ROOM_STATUS_CONFIG } from '@/utils/status';
import { FileText, Ban, Wrench, CheckCircle, MoreHorizontal } from 'lucide-react';

export interface UseColumnsOptions {
  onLease: (room: Room) => void;
  onTerminate: (room: Room) => void;
  onStatusChange: (room: Room, status: RoomStatus) => void;
}

export function useColumns({
  onLease,
  onTerminate,
  onStatusChange,
}: UseColumnsOptions): ColumnDef<Room>[] {
  return [
    {
      accessorKey: 'room_number',
      header: '房间号',
      enableSorting: true,
      size: 120,
      minSize: 100,
    },
    {
      accessorKey: 'apartment_name',
      header: '所属公寓',
      enableSorting: true,
      size: 180,
      minSize: 150,
      cell: ({ row }) => {
        const apartment = row.original.apartment;
        return apartment ? (
          <Link to={`/workspace/apartments/${apartment.id}`} className="text-primary hover:underline">
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
      size: 100,
      minSize: 80,
      cell: ({ row }) => row.original.layout || '-',
    },
    {
      accessorKey: 'area',
      header: '面积',
      enableSorting: true,
      size: 100,
      minSize: 80,
      cell: ({ row }) => (row.original.area ? `${row.original.area} m²` : '-'),
    },
    {
      accessorKey: 'monthly_rent',
      header: '月租',
      enableSorting: true,
      size: 120,
      minSize: 100,
      cell: ({ row }) => {
        const rent = row.original.pricing?.monthly_rent;
        return rent ? `¥${rent.toLocaleString()}` : '-';
      },
    },
    {
      accessorKey: 'status',
      header: '状态',
      enableSorting: true,
      size: 100,
      minSize: 80,
      cell: ({ row }) => {
        const status = ROOM_STATUS_CONFIG[row.original.status];
        return <Badge variant={status.variant}>{status.label}</Badge>;
      },
    },
    {
      accessorKey: 'notes',
      header: '备注',
      size: 200,
      minSize: 120,
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.notes || '-'}</span>,
    },
    {
      id: 'actions',
      size: 80,
      minSize: 60,
      cell: ({ row }) => {
        const room = row.original;
        const isAvailable = room.status === 'available';
        const isOccupied = room.status === 'occupied';
        const isMaintenance = room.status === 'maintenance';

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isAvailable && (
                <DropdownMenuItem onClick={() => onLease(room)}>
                  <FileText className="mr-2 h-4 w-4" />
                  签约
                </DropdownMenuItem>
              )}
              {isOccupied && (
                <DropdownMenuItem onClick={() => onTerminate(room)} className="text-destructive">
                  <Ban className="mr-2 h-4 w-4" />
                  退租
                </DropdownMenuItem>
              )}
              {isAvailable && (
                <DropdownMenuItem onClick={() => onStatusChange(room, 'maintenance')}>
                  <Wrench className="mr-2 h-4 w-4" />
                  开始维修
                </DropdownMenuItem>
              )}
              {isMaintenance && (
                <DropdownMenuItem onClick={() => onStatusChange(room, 'available')}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  完成维修
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
