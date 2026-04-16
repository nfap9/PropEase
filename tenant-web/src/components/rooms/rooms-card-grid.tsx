'use client';

import Link from 'next/link';
import { FileText, Ban, Wrench, CheckCircle } from 'lucide-react';
import { Badge } from '@apartment-ultra/shared-ui/components/ui';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { ROOM_STATUS_CONFIG } from '@/lib/status-config';
import { Room, RoomStatus } from '@/types';
import { cn } from '@/lib/utils';

interface RoomCardBaseProps {
  room: Room;
  apartmentName?: string;
  onLease: (room: Room) => void;
  onTerminate: (room: Room) => void;
  onStatusChange: (room: Room, status: RoomStatus) => void;
}

export function RoomCard({ room, apartmentName, onLease, onTerminate, onStatusChange }: RoomCardBaseProps) {
  const status = ROOM_STATUS_CONFIG[room.status];
  const isAvailable = room.status === 'available';
  const isOccupied = room.status === 'occupied';
  const isMaintenance = room.status === 'maintenance';

  return (
    <div
      className={cn(
        'group relative rounded-xl border bg-white p-3 shadow-sm transition-all duration-200',
        'hover:border-stone-300 hover:shadow-md',
        status.borderClass
      )}
    >
      {/* Status indicator bar */}
      <div className={cn('absolute inset-x-0 top-0 h-0.5 rounded-t-xl', status.bgClass)} />

      {/* Card content */}
      <div className="space-y-1.5">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-bold text-stone-900 text-base truncate">{room.room_number}</div>
            {apartmentName && (
              <Link
                href={`/apartments/${room.apartment_id}`}
                className="text-[10px] text-stone-400 hover:text-stone-600 hover:underline truncate block"
                onClick={(e) => e.stopPropagation()}
              >
                {apartmentName}
              </Link>
            )}
          </div>
          <Badge variant={status.variant} className="text-[10px] px-1.5 py-0">
            {status.label}
          </Badge>
        </div>

        {/* Room info */}
        <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
          {room.layout && <span>{room.layout}</span>}
          {room.area && <span>· {room.area}m²</span>}
        </div>

        {/* Rent */}
        <div className="flex items-baseline gap-0.5">
          <span className="text-sm font-bold text-stone-900">¥{room.monthly_rent.toLocaleString()}</span>
          <span className="text-[10px] text-stone-400">/月</span>
        </div>

        {/* Quick actions - visible on hover */}
        <div className="flex gap-1 pt-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          {isAvailable && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onLease(room)}
              className="h-6 px-1.5 text-[10px]"
            >
              <FileText className="mr-0.5 h-2.5 w-2.5" />
              签约
            </Button>
          )}
          {isOccupied && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onTerminate(room)}
              className="h-6 px-1.5 text-[10px]"
            >
              <Ban className="mr-0.5 h-2.5 w-2.5" />
              退租
            </Button>
          )}
          {isAvailable && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onStatusChange(room, 'maintenance')}
              className="h-6 w-6 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
            >
              <Wrench className="h-3 w-3" />
            </Button>
          )}
          {isMaintenance && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onStatusChange(room, 'available')}
              className="h-6 w-6 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
            >
              <CheckCircle className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
