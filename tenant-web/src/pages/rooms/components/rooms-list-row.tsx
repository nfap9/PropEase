
import { Link } from 'react-router-dom';
import { FileText, Ban, Wrench, CheckCircle } from 'lucide-react';
import { Tag } from 'antd';
import { Button } from 'antd';
import { ROOM_STATUS_CONFIG } from '@/constants/status';
import { Room, RoomStatus } from '@/types';
import { cn } from '@propease/web-shared';

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
        'flex items-center gap-3 rounded-lg border bg-card px-3 py-2 shadow-sm transition-all duration-150',
        'hover:border-input hover:shadow-sm',
        status.borderClass
      )}
    >
      {/* Status indicator */}
      <div className={cn('h-8 w-0.5 rounded-full', status.bgClass)} />

      {/* Room number */}
      <div className="min-w-[80px]">
        <div className="font-medium text-foreground text-sm">{room.room_number}</div>
        {apartmentName && (
          <Link
            to={`/workspace/apartments/${room.apartment_id}`}
            className="text-[10px] text-muted-foreground hover:text-foreground hover:underline"
          >
            {apartmentName}
          </Link>
        )}
      </div>

      {/* Status badge */}
      <Tag color={status.color} className="text-[10px] px-1.5">{status.label}</Tag>

      {/* Layout */}
      <div className="min-w-[80px] text-xs text-muted-foreground">
        {room.layout || '-'}
      </div>

      {/* Area */}
      <div className="min-w-[60px] text-xs text-muted-foreground">
        {room.area ? `${room.area}m²` : '-'}
      </div>

      {/* Rent */}
      <div className="min-w-[90px]">
        {room.pricing?.monthly_rent ? (
          <span className="text-sm font-semibold text-foreground">¥{room.pricing.monthly_rent.toLocaleString()}</span>
        ) : (
          <span className="text-xs text-muted-foreground">暂无定价</span>
        )}
      </div>

      {/* Notes */}
      <div className="flex-1 truncate text-xs text-muted-foreground">
        {room.notes || '-'}
      </div>

      {/* Actions */}
      <div className="flex gap-1">
        {isAvailable && (
          <Button
            type="default"
            size="small"
            onClick={() => onLease(room)}
            className="h-6 px-1.5 text-[10px]"
            icon={<FileText className="mr-0.5 h-2.5 w-2.5" />}
          >
            签约
          </Button>
        )}
        {isOccupied && (
          <Button
            type="default"
            size="small"
            onClick={() => onTerminate(room)}
            className="h-6 px-1.5 text-[10px]"
            icon={<Ban className="mr-0.5 h-2.5 w-2.5" />}
          >
            退租
          </Button>
        )}
        {isAvailable && (
          <Button
            type="text"
            size="small"
            onClick={() => onStatusChange(room, 'maintenance')}
            className="h-6 w-6 p-0 text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400"
            icon={<Wrench className="h-3 w-3" />}
          />
        )}
        {isMaintenance && (
          <Button
            type="text"
            size="small"
            onClick={() => onStatusChange(room, 'available')}
            className="h-6 w-6 p-0 text-emerald-600 dark:text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400"
            icon={<CheckCircle className="h-3 w-3" />}
          />
        )}
      </div>
    </div>
  );
}
