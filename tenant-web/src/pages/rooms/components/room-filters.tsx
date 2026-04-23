
import { Button, InputNumber } from 'antd';
import type { HTMLAttributes } from 'react';
import { Input, Select } from 'antd';
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

interface LabelProps extends HTMLAttributes<HTMLLabelElement> {}

function Label({ children, ...props }: LabelProps) {
  return (
    <label {...props} className={`text-sm font-medium mb-2 block ${props.className || ''}`}>
      {children}
    </label>
  );
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
        <div>
          <Label>搜索</Label>
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
        </div>

        <div>
          <Label>公寓</Label>
          <Select
            value={filters.apartmentId || 'all'}
            onChange={(value) =>
              onFilterChange('apartmentId', value === 'all' ? null : value)
            }
            className="w-full"
            data-testid={testids?.APARTMENT_FILTER}
            options={[
              { value: 'all', label: '全部公寓' },
              ...apartments.map((apt) => ({ value: apt.id, label: apt.name })),
            ]}
          />
        </div>

        <div>
          <Label>状态</Label>
          <Select
            value={filters.status || 'all'}
            onChange={(value) =>
              onFilterChange('status', value === 'all' ? null : (value as RoomStatus))
            }
            className="w-full"
            data-testid={testids?.STATUS_FILTER}
            options={[
              { value: 'all', label: '全部状态' },
              { value: 'available', label: '空置' },
              { value: 'occupied', label: '已租' },
              { value: 'maintenance', label: '维修中' },
            ]}
          />
        </div>

        <div>
          <Label>户型</Label>
          <Select
            value={filters.layout || 'all'}
            onChange={(value) => onFilterChange('layout', value === 'all' ? null : value)}
            className="w-full"
            data-testid={testids?.LAYOUT_FILTER}
            options={[
              { value: 'all', label: '全部户型' },
              ...LAYOUT_OPTIONS.map((layout) => ({ value: layout, label: layout })),
            ]}
          />
        </div>

        <div>
          <Label>月租范围</Label>
          <div className="flex items-center gap-1">
            <InputNumber
              placeholder="最低"
              className="h-9 min-w-0 flex-1"
              value={filters.rentMin ?? undefined}
              onChange={(val) => onFilterChange('rentMin', val)}
              data-testid={testids?.RENT_MIN_INPUT}
            />
            <span className="text-muted-foreground">-</span>
            <InputNumber
              placeholder="最高"
              className="h-9 min-w-0 flex-1"
              value={filters.rentMax ?? undefined}
              onChange={(val) => onFilterChange('rentMax', val)}
              data-testid={testids?.RENT_MAX_INPUT}
            />
          </div>
        </div>

        <div>
          <Label>面积范围</Label>
          <div className="flex items-center gap-1">
            <InputNumber
              placeholder="最小"
              className="h-9 min-w-0 flex-1"
              value={filters.areaMin ?? undefined}
              onChange={(val) => onFilterChange('areaMin', val)}
              data-testid={testids?.AREA_MIN_INPUT}
            />
            <span className="text-muted-foreground">-</span>
            <InputNumber
              placeholder="最大"
              className="h-9 min-w-0 flex-1"
              value={filters.areaMax ?? undefined}
              onChange={(val) => onFilterChange('areaMax', val)}
              data-testid={testids?.AREA_MAX_INPUT}
            />
          </div>
        </div>

        {hasActiveFilters && (
          <Button
            type="text"
            size="small"
            onClick={onClearFilters}
            className="h-9"
            data-testid={testids?.CLEAR_FILTERS_BTN}
            icon={<X className="mr-1 h-4 w-4" />}
          >
            清除筛选
          </Button>
        )}
      </div>
    </div>
  );
}
