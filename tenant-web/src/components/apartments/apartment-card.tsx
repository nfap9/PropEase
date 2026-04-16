
import { Link } from 'react-router-dom';
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
    <Link key={apartment.id} to={`/apartments/${apartment.id}`} className="block">
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
          <div className="grid grid-cols-4 gap-3">
            {/* Total */}
            <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-muted/50 border border-muted">
              <span className="text-2xl font-bold text-foreground tabular-nums">{room_stats.total}</span>
              <span className="text-xs text-muted-foreground mt-1">总计</span>
            </div>
            {/* Available */}
            <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 dark:bg-emerald-500/15 dark:border-emerald-500/30">
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{room_stats.available}</span>
              <span className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-1">空房</span>
            </div>
            {/* Occupied */}
            <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 dark:bg-blue-500/15 dark:border-blue-500/30">
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">{room_stats.occupied}</span>
              <span className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1">已租</span>
            </div>
            {/* Maintenance */}
            {room_stats.maintenance > 0 ? (
              <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 dark:bg-amber-500/15 dark:border-amber-500/30">
                <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">{room_stats.maintenance}</span>
                <span className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-1">维修</span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-muted/30 border border-transparent">
                <span className="text-2xl font-bold text-muted-foreground/50 tabular-nums">0</span>
                <span className="text-xs text-muted-foreground/50 mt-1">维修</span>
              </div>
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
