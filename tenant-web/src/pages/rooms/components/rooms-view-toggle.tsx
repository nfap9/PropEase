
import { LayoutGrid, List } from 'lucide-react';
import { Button } from 'antd';
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
        type={viewMode === 'grid' ? 'primary' : 'text'}
        size="small"
        onClick={() => onViewModeChange('grid')}
        className={cn(
          'h-7 px-1.5',
          viewMode === 'grid' && 'bg-background shadow-sm'
        )}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
      </Button>
      <Button
        type={viewMode === 'list' ? 'primary' : 'text'}
        size="small"
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
