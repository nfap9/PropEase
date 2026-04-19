
import { RefreshCw } from 'lucide-react';
import { Button } from '@apartment-ultra/shared-ui/components/ui';

interface RefreshButtonProps {
  onRefresh: () => void;
  isLoading?: boolean;
}

export function RefreshButton({ onRefresh, isLoading }: RefreshButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onRefresh}
      disabled={isLoading}
      aria-label="刷新数据"
    >
      <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
      {isLoading ? '刷新中...' : '刷新数据'}
    </Button>
  );
}
