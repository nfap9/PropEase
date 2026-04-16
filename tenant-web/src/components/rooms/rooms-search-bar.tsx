
import { Search, X } from 'lucide-react';
import { Input } from '@apartment-ultra/shared-ui/components/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@apartment-ultra/shared-ui/components/ui';
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
        onValueChange={(value) =>
          onFilterChange('apartmentId', value === 'all' ? null : value)
        }
      >
        <SelectTrigger className="h-8 w-[130px] rounded-lg border-input bg-background text-xs shadow-sm transition-all">
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

      {/* Status filter */}
      <Select
        value={filters.status || 'all'}
        onValueChange={(value) =>
          onFilterChange('status', value === 'all' ? null : (value as RoomStatus))
        }
      >
        <SelectTrigger className="h-8 w-[100px] rounded-lg border-input bg-background text-xs shadow-sm transition-all">
          <SelectValue placeholder="状态" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部状态</SelectItem>
          <SelectItem value="available">空置</SelectItem>
          <SelectItem value="occupied">已租</SelectItem>
          <SelectItem value="maintenance">维修中</SelectItem>
        </SelectContent>
      </Select>

      {/* Layout filter */}
      <Select
        value={filters.layout || 'all'}
        onValueChange={(value) => onFilterChange('layout', value === 'all' ? null : value)}
      >
        <SelectTrigger className="h-8 w-[110px] rounded-lg border-input bg-background text-xs shadow-sm transition-all">
          <SelectValue placeholder="户型" />
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
