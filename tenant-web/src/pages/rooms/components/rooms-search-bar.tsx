
import { Search, X } from 'lucide-react';
import { Input, Select } from 'antd';
import { ApartmentWithStats, RoomStatus } from '@/types';
import { RoomFiltersState } from './room-filters';

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

interface RoomsSearchBarProps {
  apartments: ApartmentWithStats[];
  filters: RoomFiltersState;
  search: string;
  onSearchChange: (value: string) => void;
  onFilterChange: (key: keyof RoomFiltersState, value: unknown) => void;
  onClearFilters: () => void;
}

export function RoomsSearchBar({
  apartments,
  filters,
  search,
  onSearchChange,
  onFilterChange,
  onClearFilters,
}: RoomsSearchBarProps) {
  const hasActiveFilters = Boolean(search.trim()) || Object.values(filters).some((v) => v !== null);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Search input */}
      <div className="relative flex-1 min-w-[160px]">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="搜索房间号..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-8 flex-1 rounded-lg border-input bg-background pl-8 pr-8 text-xs shadow-sm transition-all"
        />
        {search && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Apartment filter */}
      <Select
        value={filters.apartmentId || 'all'}
        onChange={(value) =>
          onFilterChange('apartmentId', value === 'all' ? null : value)
        }
        className="h-8 w-[130px]"
        options={[
          { value: 'all', label: '全部公寓' },
          ...apartments.map((apt) => ({ value: apt.id, label: apt.name })),
        ]}
      />

      {/* Status filter */}
      <Select
        value={filters.status || 'all'}
        onChange={(value) =>
          onFilterChange('status', value === 'all' ? null : (value as RoomStatus))
        }
        className="h-8 w-[100px]"
        options={[
          { value: 'all', label: '全部状态' },
          { value: 'available', label: '空置' },
          { value: 'occupied', label: '已租' },
          { value: 'maintenance', label: '维修中' },
        ]}
      />

      {/* Layout filter */}
      <Select
        value={filters.layout || 'all'}
        onChange={(value) => onFilterChange('layout', value === 'all' ? null : value)}
        className="h-8 w-[110px]"
        options={[
          { value: 'all', label: '全部户型' },
          ...LAYOUT_OPTIONS.map((layout) => ({ value: layout, label: layout })),
        ]}
      />

      {/* Clear filters */}
      {hasActiveFilters && (
        <button
          onClick={onClearFilters}
          className="flex h-8 items-center gap-1 rounded-lg border border-input bg-background px-2.5 text-xs text-muted-foreground shadow-sm transition-all hover:bg-muted hover:text-foreground"
        >
          <X className="h-3 w-3" />
          清除
        </button>
      )}
    </div>
  );
}
