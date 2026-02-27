'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ApartmentWithStats, RoomStatus } from '@/types';
import { X, Filter } from 'lucide-react';

export interface RoomFiltersState {
  apartmentId: string | null;
  status: RoomStatus | null;
  rentMin: number | null;
  rentMax: number | null;
  areaMin: number | null;
  areaMax: number | null;
}

interface RoomFiltersProps {
  apartments: ApartmentWithStats[];
  filters: RoomFiltersState;
  onFilterChange: (key: keyof RoomFiltersState, value: unknown) => void;
  onClearFilters: () => void;
}

export function RoomFilters({
  apartments,
  filters,
  onFilterChange,
  onClearFilters,
}: RoomFiltersProps) {
  const hasActiveFilters = Object.values(filters).some((v) => v !== null);

  return (
    <div className="flex flex-wrap items-end gap-4 p-4 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-2 text-sm font-medium h-9">
        <Filter className="h-4 w-4" />
        筛选
      </div>

      {/* 公寓筛选 */}
      <div className="space-y-1">
        <Label className="text-xs">公寓</Label>
        <Select
          value={filters.apartmentId || 'all'}
          onValueChange={(value) =>
            onFilterChange('apartmentId', value === 'all' ? null : value)
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="全部公寓" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部公寓</SelectItem>
            {apartments.map((apt) => (
              <SelectItem key={apt.id} value={apt.id}>
                {apt.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 状态筛选 */}
      <div className="space-y-1">
        <Label className="text-xs">状态</Label>
        <Select
          value={filters.status || 'all'}
          onValueChange={(value) =>
            onFilterChange('status', value === 'all' ? null : (value as RoomStatus))
          }
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="全部状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="available">空置</SelectItem>
            <SelectItem value="occupied">已租</SelectItem>
            <SelectItem value="maintenance">维修中</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 月租范围 */}
      <div className="space-y-1">
        <Label className="text-xs">月租范围 (元)</Label>
        <div className="flex items-center gap-1">
          <Input
            type="number"
            placeholder="最低"
            className="w-[90px] h-9"
            value={filters.rentMin ?? ''}
            onChange={(e) =>
              onFilterChange('rentMin', e.target.value ? Number(e.target.value) : null)
            }
          />
          <span className="text-muted-foreground">-</span>
          <Input
            type="number"
            placeholder="最高"
            className="w-[90px] h-9"
            value={filters.rentMax ?? ''}
            onChange={(e) =>
              onFilterChange('rentMax', e.target.value ? Number(e.target.value) : null)
            }
          />
        </div>
      </div>

      {/* 面积范围 */}
      <div className="space-y-1">
        <Label className="text-xs">面积范围 (m²)</Label>
        <div className="flex items-center gap-1">
          <Input
            type="number"
            placeholder="最小"
            className="w-[90px] h-9"
            value={filters.areaMin ?? ''}
            onChange={(e) =>
              onFilterChange('areaMin', e.target.value ? Number(e.target.value) : null)
            }
          />
          <span className="text-muted-foreground">-</span>
          <Input
            type="number"
            placeholder="最大"
            className="w-[90px] h-9"
            value={filters.areaMax ?? ''}
            onChange={(e) =>
              onFilterChange('areaMax', e.target.value ? Number(e.target.value) : null)
            }
          />
        </div>
      </div>

      {/* 清除筛选 */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onClearFilters} className="h-9">
          <X className="mr-1 h-4 w-4" />
          清除筛选
        </Button>
      )}
    </div>
  );
}
