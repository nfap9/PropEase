'use client';

import Link from 'next/link';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@apartment-ultra/shared-ui/components/ui';
import { CardDescription } from '@/components/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@apartment-ultra/shared-ui/components/ui';
import { Button } from '@/components/ui';
import { Building2, MapPin, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { ApartmentWithStats } from '@/types';
import { PermissionGuard } from '@/components/common/permission-guard';
import { PERMISSIONS } from '@/hooks/use-permissions';
import { ApartmentStats } from './apartment-stats';

interface ApartmentCardProps {
  apartment: ApartmentWithStats;
  onEdit: (apartment: ApartmentWithStats) => void;
  onDelete: (apartment: ApartmentWithStats) => void;
}

export function ApartmentCard({ apartment, onEdit, onDelete }: ApartmentCardProps) {
  return (
    <Link key={apartment.id} href={`/apartments/${apartment.id}`}>
      <Card className="h-full cursor-pointer transition-shadow hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1 space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 flex-shrink-0 text-primary" />
                <span className="truncate">{apartment.name}</span>
              </CardTitle>
              <CardDescription className="flex items-center gap-1">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{apartment.address || '暂无地址'}</span>
              </CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0"
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
        <CardContent>
          <ApartmentStats stats={apartment.room_stats} />
        </CardContent>
        <CardFooter className="pt-0" />
      </Card>
    </Link>
  );
}
