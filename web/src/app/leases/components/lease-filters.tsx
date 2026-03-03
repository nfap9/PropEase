'use client';

import { useState } from 'react';
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
import { X, Search, ChevronDown, ChevronRight } from 'lucide-react';

export interface LeaseFiltersState {
  apartmentId: string | null;
  keyword: string | null;
  startDateFrom: string | null;
  startDateTo: string | null;
  endDateFrom: string | null;
  endDateTo: string | null;
}

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
  const hasApartment = !!filters.apartmentId;
  const hasKeyword = !!filters.keyword?.trim();
  const hasDates =
    !!filters.startDateFrom ||
    !!filters.startDateTo ||
    !!filters.endDateFrom ||
    !!filters.endDateTo;
  const hasActiveFilters = hasApartment || hasKeyword || hasDates;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-4">
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

        {/* 搜索框：房间号、租客姓名、手机号、身份证号 */}
        <div className="space-y-1 flex-1 min-w-[200px]">
          <Label className="text-xs">搜索</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="房间号、租客姓名、手机号或身份证号"
              className="pl-10"
              value={filters.keyword ?? ''}
              onChange={(e) =>
                onFilterChange('keyword', e.target.value.trim() || null)
              }
            />
          </div>
        </div>
      </div>

      {/* 日期筛选（可展开） */}
      <div className="rounded-lg border bg-muted/50 overflow-hidden">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium hover:bg-muted/80 transition-colors"
          aria-expanded={expanded}
          aria-label={expanded ? '收起日期筛选' : '展开日期筛选'}
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4 shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0" />
          )}
          <span>日期范围</span>
          {hasDates && (
            <span className="text-muted-foreground text-xs font-normal">（已选）</span>
          )}
        </button>

        {expanded && (
          <div className="flex flex-wrap items-end gap-4 px-4 pb-4 pt-0 border-t">
            <div className="space-y-1">
              <Label className="text-xs">开始日期</Label>
              <div className="flex items-center gap-1">
                <Input
                  type="date"
                  className="w-[140px] h-9"
                  value={filters.startDateFrom ?? ''}
                  onChange={(e) =>
                    onFilterChange('startDateFrom', e.target.value || null)
                  }
                />
                <span className="text-muted-foreground">至</span>
                <Input
                  type="date"
                  className="w-[140px] h-9"
                  value={filters.startDateTo ?? ''}
                  onChange={(e) =>
                    onFilterChange('startDateTo', e.target.value || null)
                  }
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">到期日期</Label>
              <div className="flex items-center gap-1">
                <Input
                  type="date"
                  className="w-[140px] h-9"
                  value={filters.endDateFrom ?? ''}
                  onChange={(e) =>
                    onFilterChange('endDateFrom', e.target.value || null)
                  }
                />
                <span className="text-muted-foreground">至</span>
                <Input
                  type="date"
                  className="w-[140px] h-9"
                  value={filters.endDateTo ?? ''}
                  onChange={(e) =>
                    onFilterChange('endDateTo', e.target.value || null)
                  }
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
