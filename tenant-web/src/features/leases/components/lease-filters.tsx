'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Search, X } from 'lucide-react';
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
import type { LeaseFiltersState } from '../leases.schemas';

interface LeaseFiltersProps {
  apartments: { id: string; name: string }[];
  filters: LeaseFiltersState;
  onFilterChange: (key: keyof LeaseFiltersState, value: unknown) => void;
  onClearFilters: () => void;
}

export function LeaseFilters({
  apartments,
  filters,
  onFilterChange,
  onClearFilters,
}: LeaseFiltersProps) {
  const [expanded, setExpanded] = useState(false);
  const hasApartment = Boolean(filters.apartmentId);
  const hasKeyword = Boolean(filters.keyword?.trim());
  const hasDates =
    Boolean(filters.startDateFrom) ||
    Boolean(filters.startDateTo) ||
    Boolean(filters.endDateFrom) ||
    Boolean(filters.endDateTo);
  const hasActiveFilters = hasApartment || hasKeyword || hasDates;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-4">
        <div className="space-y-1">
          <Label className="text-xs">公寓</Label>
          <Select
            value={filters.apartmentId || 'all'}
            onValueChange={(value) => onFilterChange('apartmentId', value === 'all' ? null : value)}
          >
            <SelectTrigger className="w-[160px]" data-testid="leases-apartment-filter">
              <SelectValue placeholder="全部公寓" />
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
        </div>

        <div className="min-w-[200px] flex-1 space-y-1">
          <Label className="text-xs">搜索</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="房间号、租客姓名、手机号或身份证号"
              className="pl-10"
              value={filters.keyword ?? ''}
              onChange={(event) => onFilterChange('keyword', event.target.value.trim() || null)}
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-muted/50">
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium transition-colors hover:bg-muted/80"
          aria-expanded={expanded}
          aria-label={expanded ? '收起日期筛选' : '展开日期筛选'}
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4 shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0" />
          )}
          <span>日期范围</span>
          {hasDates && <span className="text-xs font-normal text-muted-foreground">（已选）</span>}
        </button>

        {expanded && (
          <div className="flex flex-wrap items-end gap-4 border-t px-4 pb-4 pt-0">
            <div className="space-y-1">
              <Label className="text-xs">开始日期</Label>
              <div className="flex items-center gap-1">
                <Input
                  type="date"
                  className="h-9 w-[140px]"
                  value={filters.startDateFrom ?? ''}
                  onChange={(event) => onFilterChange('startDateFrom', event.target.value || null)}
                />
                <span className="text-muted-foreground">至</span>
                <Input
                  type="date"
                  className="h-9 w-[140px]"
                  value={filters.startDateTo ?? ''}
                  onChange={(event) => onFilterChange('startDateTo', event.target.value || null)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">到期日期</Label>
              <div className="flex items-center gap-1">
                <Input
                  type="date"
                  className="h-9 w-[140px]"
                  value={filters.endDateFrom ?? ''}
                  onChange={(event) => onFilterChange('endDateFrom', event.target.value || null)}
                />
                <span className="text-muted-foreground">至</span>
                <Input
                  type="date"
                  className="h-9 w-[140px]"
                  value={filters.endDateTo ?? ''}
                  onChange={(event) => onFilterChange('endDateTo', event.target.value || null)}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onClearFilters}>
          <X className="mr-1 h-4 w-4" />
          清除筛选
        </Button>
      )}
    </div>
  );
}
