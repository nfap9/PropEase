
import { Search, X, Building2 } from 'lucide-react';
import { Button, DatePicker, Input, Select, Tag } from 'antd';
import type { LeaseFiltersState } from '@/schemas/leases';

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
        onChange={(value) => onFilterChange('apartmentId', value === 'all' ? null : value)}
        className="w-[160px]"
        placeholder="全部公寓"
        options={[
          { value: 'all', label: '全部公寓' },
          ...apartments.map((apartment) => ({ value: apartment.id, label: apartment.name })),
        ]}
      />

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

      {/* 开始日期范围 */}
      <div className="flex items-center gap-1">
        <DatePicker
          className="h-9 w-[140px]"
          value={filters.startDateFrom ? undefined : undefined}
          onChange={(_, dateString) => onFilterChange('startDateFrom', dateString || null)}
          placeholder="开始日期"
        />
        <span className="text-muted-foreground">-</span>
        <DatePicker
          className="h-9 w-[140px]"
          onChange={(_, dateString) => onFilterChange('startDateTo', dateString || null)}
          placeholder="结束日期"
        />
      </div>

      {/* 结束日期范围 */}
      <div className="flex items-center gap-1">
        <DatePicker
          className="h-9 w-[140px]"
          onChange={(_, dateString) => onFilterChange('endDateFrom', dateString || null)}
          placeholder="开始日期"
        />
        <span className="text-muted-foreground">-</span>
        <DatePicker
          className="h-9 w-[140px]"
          onChange={(_, dateString) => onFilterChange('endDateTo', dateString || null)}
          placeholder="结束日期"
        />
      </div>

      {/* 清除筛选 */}
      {hasActiveFilters && (
        <Button type="text" size="small" onClick={onClearFilters} className="h-9 gap-1 text-muted-foreground" icon={<X className="h-4 w-4" />}>
          清除
        </Button>
      )}

      {/* 活跃筛选标签 */}
      {hasActiveFilters && (
        <div className="flex items-center gap-1">
          {hasKeyword && (
            <Tag className="h-6 gap-1 px-2 text-xs" icon={<Search className="h-3 w-3" />}>
              {filters.keyword}
            </Tag>
          )}
          {hasApartment && selectedApartment && (
            <Tag className="h-6 gap-1 px-2 text-xs" icon={<Building2 className="h-3 w-3" />}>
              {selectedApartment.name}
            </Tag>
          )}
        </div>
      )}
    </div>
  );
}
