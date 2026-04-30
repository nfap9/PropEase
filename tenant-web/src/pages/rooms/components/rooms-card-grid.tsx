
import { Link } from 'react-router-dom';
import { FileText, Ban, Wrench, CheckCircle } from 'lucide-react';
import { Tag } from 'antd';
import { Button } from 'antd';
import { ROOM_STATUS_CONFIG } from '@/constants/status';
import { Room, RoomStatus } from '@/types';
import { cn } from '@propease/web-shared';

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
        'group relative rounded-xl border-2 bg-card p-3 shadow-sm transition-all duration-200',
        'hover:shadow-md',
        status.borderClass
      )}
    >
      {/* Card content */}
      <div className="space-y-1.5">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-bold text-foreground text-base truncate">{room.room_number}</div>
            {apartmentName && (
              <Link
                to={`/workspace/apartments/${room.apartment_id}`}
                className="text-[10px] text-muted-foreground hover:text-foreground hover:underline truncate block"
                onClick={(e) => e.stopPropagation()}
              >
                {apartmentName}
              </Link>
            )}
          </div>
          <Tag color={status.color} className="text-[10px] px-1.5 py-0">{status.label}</Tag>
        </div>

        {/* Room info */}
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          {room.layout && <span>{room.layout}</span>}
          {room.area && <span>· {room.area}m²</span>}
        </div>

        {/* Rent */}
        <div className="flex items-baseline gap-0.5">
          {room.pricing?.monthly_rent ? (
            <>
              <span className="text-sm font-bold text-foreground">¥{room.pricing.monthly_rent.toLocaleString()}</span>
              <span className="text-[10px] text-muted-foreground">/月</span>
            </>
          ) : (
            <span className="text-xs text-muted-foreground">暂无定价</span>
          )}
        </div>

        {/* Quick actions - visible on hover */}
        <div className="flex gap-1 pt-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
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
    </div>
  );
}
