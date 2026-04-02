'use client';

import { Button } from '@/components/ui';
import { FilterField } from '@apartment-ultra/shared-ui/components/ui';
import { Input } from '@/components/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@apartment-ultra/shared-ui/components/ui';
import { ApartmentWithStats, RoomStatus } from '@/types';
import { Search, X } from 'lucide-react';

const LAYOUT_OPTIONS = [
  '单间',
  '一室一厅',
  '两室一厅',
  '三室一厅',
  '三室两厅',
  '四室两厅',
  '复式',
  'Loft',
];

export interface RoomFiltersState {
  apartmentId: string | null;
  status: RoomStatus | null;
  layout: string | null;
  rentMin: number | null;
  rentMax: number | null;
  areaMin: number | null;
  areaMax: number | null;
}

interface RoomFiltersProps {
  testids?: Record<string, string>;
  apartments: ApartmentWithStats[];
  filters: RoomFiltersState;
  search: string;
  onSearchChange: (value: string) => void;
  onFilterChange: (key: keyof RoomFiltersState, value: unknown) => void;
  onClearFilters: () => void;
}

export function RoomFilters({
  testids,
  apartments,
  filters,
  search,
  onSearchChange,
  onFilterChange,
  onClearFilters,
}: RoomFiltersProps) {
  const hasActiveFilters = Boolean(search.trim()) || Object.values(filters).some((v) => v !== null);

  return (
    <div data-testid={testids?.FILTER_TOGGLE}>
      <div className="flex flex-wrap gap-4">
        <FilterField label="搜索">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              data-testid={testids?.SEARCH_INPUT}
              placeholder="搜索房间号或备注..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </FilterField>

        <FilterField label="公寓">
          <Select
            value={filters.apartmentId || 'all'}
            onValueChange={(value) =>
              onFilterChange('apartmentId', value === 'all' ? null : value)
            }
          >
            <SelectTrigger className="w-full" data-testid={testids?.APARTMENT_FILTER}>
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
        </FilterField>

        <FilterField label="状态">
          <Select
            value={filters.status || 'all'}
            onValueChange={(value) =>
              onFilterChange('status', value === 'all' ? null : (value as RoomStatus))
            }
          >
            <SelectTrigger className="w-full" data-testid={testids?.STATUS_FILTER}>
              <SelectValue placeholder="全部状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="available">空置</SelectItem>
              <SelectItem value="occupied">已租</SelectItem>
              <SelectItem value="maintenance">维修中</SelectItem>
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="户型">
          <Select
            value={filters.layout || 'all'}
            onValueChange={(value) => onFilterChange('layout', value === 'all' ? null : value)}
          >
            <SelectTrigger className="w-full" data-testid={testids?.LAYOUT_FILTER}>
              <SelectValue placeholder="全部户型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部户型</SelectItem>
              {LAYOUT_OPTIONS.map((layout) => (
                <SelectItem key={layout} value={layout}>
                  {layout}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="月租范围">
          <div className="flex items-center gap-1">
            <Input
              type="number"
              placeholder="最低"
              className="h-9 min-w-0 flex-1"
              value={filters.rentMin ?? ''}
              onChange={(e) =>
                onFilterChange('rentMin', e.target.value ? Number(e.target.value) : null)
              }
              data-testid={testids?.RENT_MIN_INPUT}
            />
            <span className="text-muted-foreground">-</span>
            <Input
              type="number"
              placeholder="最高"
              className="h-9 min-w-0 flex-1"
              value={filters.rentMax ?? ''}
              onChange={(e) =>
                onFilterChange('rentMax', e.target.value ? Number(e.target.value) : null)
              }
              data-testid={testids?.RENT_MAX_INPUT}
            />
          </div>
        </FilterField>

        <FilterField label="面积范围">
          <div className="flex items-center gap-1">
            <Input
              type="number"
              placeholder="最小"
              className="h-9 min-w-0 flex-1"
              value={filters.areaMin ?? ''}
              onChange={(e) =>
                onFilterChange('areaMin', e.target.value ? Number(e.target.value) : null)
              }
              data-testid={testids?.AREA_MIN_INPUT}
            />
            <span className="text-muted-foreground">-</span>
            <Input
              type="number"
              placeholder="最大"
              className="h-9 min-w-0 flex-1"
              value={filters.areaMax ?? ''}
              onChange={(e) =>
                onFilterChange('areaMax', e.target.value ? Number(e.target.value) : null)
              }
              data-testid={testids?.AREA_MAX_INPUT}
            />
          </div>
        </FilterField>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-9"
            data-testid={testids?.CLEAR_FILTERS_BTN}
          >
            <X className="mr-1 h-4 w-4" />
            清除筛选
          </Button>
        )}
      </div>
    </div>
  );
}
