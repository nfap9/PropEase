'use client';

import { useState } from 'react';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Input } from '@apartment-ultra/shared-ui/components/ui';
import { Label } from '@apartment-ultra/shared-ui/components/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@apartment-ultra/shared-ui/components/ui';
import { ApartmentWithStats, RoomStatus } from '@/types';
import { X, Filter, ChevronDown, ChevronRight } from 'lucide-react';

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
  onFilterChange: (key: keyof RoomFiltersState, value: unknown) => void;
  onClearFilters: () => void;
}

export function RoomFilters({
  testids,
  apartments,
  filters,
  onFilterChange,
  onClearFilters,
}: RoomFiltersProps) {
  const [expanded, setExpanded] = useState(true);
  const hasActiveFilters = Object.values(filters).some((v) => v !== null);

  return (
    <div className="overflow-hidden rounded-lg border bg-muted/50">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-muted/80"
        aria-expanded={expanded}
        aria-label={expanded ? '收起筛选' : '展开筛选'}
        data-testid={testids?.FILTER_TOGGLE}
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0" />
        )}
        <Filter className="h-4 w-4 shrink-0" />
        <span>筛选</span>
        {hasActiveFilters && (
          <span className="text-xs font-normal text-muted-foreground">（已选条件）</span>
        )}
      </button>

      {expanded && (
        <div className="flex flex-wrap items-end gap-4 px-4 pb-4 pt-0">
          {/* 公寓筛选 */}
          <div className="space-y-1">
            <Label className="text-xs">公寓</Label>
            <Select
              value={filters.apartmentId || 'all'}
              onValueChange={(value) =>
                onFilterChange('apartmentId', value === 'all' ? null : value)
              }
            >
              <SelectTrigger className="w-[160px]" data-testid={testids?.APARTMENT_FILTER}>
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
              <SelectTrigger className="w-[120px]" data-testid={testids?.STATUS_FILTER}>
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

          {/* 户型筛选 */}
          <div className="space-y-1">
            <Label className="text-xs">户型</Label>
            <Select
              value={filters.layout || 'all'}
              onValueChange={(value) => onFilterChange('layout', value === 'all' ? null : value)}
            >
              <SelectTrigger className="w-[120px]" data-testid={testids?.LAYOUT_FILTER}>
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
          </div>

          {/* 月租范围 */}
          <div className="space-y-1">
            <Label className="text-xs">月租范围 (元)</Label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                placeholder="最低"
                className="h-9 w-[90px]"
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
                className="h-9 w-[90px]"
                value={filters.rentMax ?? ''}
                onChange={(e) =>
                  onFilterChange('rentMax', e.target.value ? Number(e.target.value) : null)
                }
                data-testid={testids?.RENT_MAX_INPUT}
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
                className="h-9 w-[90px]"
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
                className="h-9 w-[90px]"
                value={filters.areaMax ?? ''}
                onChange={(e) =>
                  onFilterChange('areaMax', e.target.value ? Number(e.target.value) : null)
                }
                data-testid={testids?.AREA_MAX_INPUT}
              />
            </div>
          </div>

          {/* 清除筛选 */}
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
      )}
    </div>
  );
}
