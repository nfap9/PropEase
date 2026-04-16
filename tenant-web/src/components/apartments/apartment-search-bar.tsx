
import { Search } from 'lucide-react';
import { Input } from '@apartment-ultra/shared-ui/components/ui';

interface ApartmentSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function ApartmentSearchBar({ value, onChange }: ApartmentSearchBarProps) {
  return (
    <div className="relative max-w-sm">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="搜索公寓名称或地址..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10"
        data-testid="apartments-search-input"
      />
    </div>
  );
}
