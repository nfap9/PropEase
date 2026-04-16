
import { Link } from 'react-router-dom';
import { FileText, Ban, Wrench, CheckCircle } from 'lucide-react';
import { Badge } from '@apartment-ultra/shared-ui/components/ui';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { ROOM_STATUS_CONFIG } from '@/utils/status';
import { Room, RoomStatus } from '@/types';
import { cn } from '@/utils';

interface RoomListRowProps {
  room: Room;
  apartmentName?: string;
  onLease: (room: Room) => void;
  onTerminate: (room: Room) => void;
  onStatusChange: (room: Room, status: RoomStatus) => void;
}

export function RoomListRow({ room, apartmentName, onLease, onTerminate, onStatusChange }: RoomListRowProps) {
  const status = ROOM_STATUS_CONFIG[room.status];
  const isAvailable = room.status === 'available';
  const isOccupied = room.status === 'occupied';
  const isMaintenance = room.status === 'maintenance';

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border bg-white px-3 py-2 shadow-sm transition-all duration-150',
        'hover:border-stone-300 hover:shadow-sm',
        status.borderClass
      )}
    >
      {/* Status indicator */}
      <div className={cn('h-8 w-0.5 rounded-full', status.bgClass)} />

      {/* Room number */}
      <div className="min-w-[80px]">
        <div className="font-medium text-stone-900 text-sm">{room.room_number}</div>
        {apartmentName && (
          <Link
            to={`/apartments/${room.apartment_id}`}
            className="text-[10px] text-stone-400 hover:text-stone-600 hover:underline"
          >
            {apartmentName}
          </Link>
        )}
      </div>

      {/* Status badge */}
      <Badge variant={status.variant} className="text-[10px] px-1.5">
        {status.label}
      </Badge>

      {/* Layout */}
      <div className="min-w-[80px] text-xs text-stone-500">
        {room.layout || '-'}
      </div>

      {/* Area */}
      <div className="min-w-[60px] text-xs text-stone-400">
        {room.area ? `${room.area}m²` : '-'}
      </div>

      {/* Rent */}
      <div className="min-w-[90px]">
        <span className="text-sm font-semibold text-stone-900">¥{room.monthly_rent.toLocaleString()}</span>
      </div>

      {/* Notes */}
      <div className="flex-1 truncate text-xs text-stone-400">
        {room.notes || '-'}
      </div>

      {/* Actions */}
      <div className="flex gap-1">
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
  );
}
