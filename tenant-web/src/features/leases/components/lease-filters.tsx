'use client';

import { Search, X, Building2, Calendar, SlidersHorizontal } from 'lucide-react';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { DateRangePicker } from '@apartment-ultra/shared-ui/components/ui';
import { Input } from '@apartment-ultra/shared-ui/components/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@apartment-ultra/shared-ui/components/ui';
import { Badge } from '@apartment-ultra/shared-ui/components/ui';
import type { LeaseFiltersState } from '../leases.schemas';

interface LeaseFiltersProps {
  apartments: { id: string; name: string }[];
  filters: LeaseFiltersState;
  onFilterChange: (key: keyof LeaseFiltersState, value: unknown) => void;
  onClearFilters: () => void;
}

export function LeaseFilters({ apartments, filters, onFilterChange, onClearFilters }: LeaseFiltersProps) {
  const hasApartment = Boolean(filters.apartmentId);
  const hasKeyword = Boolean(filters.keyword?.trim());
  const hasDates =
    Boolean(filters.startDateFrom) ||
    Boolean(filters.startDateTo) ||
    Boolean(filters.endDateFrom) ||
    Boolean(filters.endDateTo);
  const hasActiveFilters = hasApartment || hasKeyword || hasDates;

  const selectedApartment = apartments.find((a) => a.id === filters.apartmentId);

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* 公寓筛选 */}
      <Select
        value={filters.apartmentId || 'all'}
        onValueChange={(value) => onFilterChange('apartmentId', value === 'all' ? null : value)}
      >
        <SelectTrigger className="h-9 w-[160px]" data-testid="leases-apartment-filter">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="全部公寓" />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部公寓</SelectItem>
          {apartments.map((apartment) => (
            <SelectItem key={apartment.id} value={apartment.id}>
              {apartment.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* 搜索框 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="搜索..."
          className="h-9 w-[200px] pl-9"
          value={filters.keyword ?? ''}
          onChange={(event) => onFilterChange('keyword', event.target.value.trim() || null)}
        />
      </div>

      {/* 开始日期 */}
      <DateRangePicker
        value={{ from: filters.startDateFrom, to: filters.startDateTo }}
        placeholder="开始日期"
        onChange={(range) => {
          onFilterChange('startDateFrom', range.from);
          onFilterChange('startDateTo', range.to);
        }}
      />

      {/* 结束日期 */}
      <DateRangePicker
        value={{ from: filters.endDateFrom, to: filters.endDateTo }}
        placeholder="结束日期"
        onChange={(range) => {
          onFilterChange('endDateFrom', range.from);
          onFilterChange('endDateTo', range.to);
        }}
      />

      {/* 清除筛选 */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onClearFilters} className="h-9 gap-1 text-muted-foreground">
          <X className="h-4 w-4" />
          清除
        </Button>
      )}

      {/* 活跃筛选标签 */}
      {hasActiveFilters && (
        <div className="flex items-center gap-1">
          {hasKeyword && (
            <Badge variant="secondary" className="h-6 gap-1 px-2 text-xs">
              <Search className="h-3 w-3" />
              {filters.keyword}
            </Badge>
          )}
          {hasApartment && selectedApartment && (
            <Badge variant="secondary" className="h-6 gap-1 px-2 text-xs">
              <Building2 className="h-3 w-3" />
              {selectedApartment.name}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
