'use client';

import { LayoutGrid, List } from 'lucide-react';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { cn } from '@/utils';

export type ViewMode = 'grid' | 'list';

interface RoomsViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function RoomsViewToggle({ viewMode, onViewModeChange }: RoomsViewToggleProps) {
  return (
    <div className="flex items-center gap-0.5 rounded-md border bg-card p-0.5">
      <Button
        variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => onViewModeChange('grid')}
        className={cn(
          'h-7 px-1.5',
          viewMode === 'grid' && 'bg-background shadow-sm'
        )}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant={viewMode === 'list' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => onViewModeChange('list')}
        className={cn(
          'h-7 px-1.5',
          viewMode === 'list' && 'bg-background shadow-sm'
        )}
      >
        <List className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
