'use client';

import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardContent,
} from '@apartment-ultra/shared-ui/components/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@apartment-ultra/shared-ui/components/ui';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Badge } from '@apartment-ultra/shared-ui/components/ui';
import { Building2, MapPin, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { ApartmentWithStats } from '@/types';
import { PermissionGuard } from '@/components/common/permission-guard';
import { PERMISSIONS } from '@/hooks/use-permissions';

interface ApartmentCardProps {
  apartment: ApartmentWithStats;
  onEdit: (apartment: ApartmentWithStats) => void;
  onDelete: (apartment: ApartmentWithStats) => void;
}

export function ApartmentCard({ apartment, onEdit, onDelete }: ApartmentCardProps) {
  const { room_stats, name, address } = apartment;
  const occupancyRate = room_stats.total > 0
    ? Math.round((room_stats.occupied / room_stats.total) * 100)
    : 0;

  return (
    <Link key={apartment.id} href={`/apartments/${apartment.id}`} className="block">
      <Card className="h-full cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold truncate flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="truncate">{name}</span>
              </h3>
              {address && (
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1 truncate">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{address}</span>
                </p>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0 -mr-2"
                  aria-label="更多操作"
                  data-testid={`apartments-more-menu-${apartment.id}`}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.preventDefault()}>
                <PermissionGuard permission={PERMISSIONS.APARTMENT_EDIT}>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onEdit(apartment);
                    }}
                    data-testid={`apartments-edit-btn-${apartment.id}`}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    编辑
                  </DropdownMenuItem>
                </PermissionGuard>
                <PermissionGuard permission={PERMISSIONS.APARTMENT_DELETE}>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDelete(apartment);
                    }}
                    data-testid={`apartments-delete-btn-${apartment.id}`}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    删除
                  </DropdownMenuItem>
                </PermissionGuard>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Room Stats Row */}
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex-1 justify-center py-1.5 whitespace-nowrap">
              <span className="font-mono font-bold">{room_stats.total}</span>
              <span className="ml-1 text-muted-foreground">总房间</span>
            </Badge>
            <Badge variant="success" className="flex-1 justify-center py-1.5 whitespace-nowrap">
              <span className="font-mono font-bold">{room_stats.available}</span>
              <span className="ml-1 text-muted-foreground">空房</span>
            </Badge>
            <Badge variant="info" className="flex-1 justify-center py-1.5 whitespace-nowrap">
              <span className="font-mono font-bold">{room_stats.occupied}</span>
              <span className="ml-1 text-muted-foreground">已租</span>
            </Badge>
            {room_stats.maintenance > 0 && (
              <Badge variant="warning" className="flex-1 justify-center py-1.5 whitespace-nowrap">
                <span className="font-mono font-bold">{room_stats.maintenance}</span>
                <span className="ml-1 text-muted-foreground">维修</span>
              </Badge>
            )}
          </div>

          {/* Occupancy Progress */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">入住率</span>
              <span className="font-semibold">{occupancyRate}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all"
                style={{ width: `${occupancyRate}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
