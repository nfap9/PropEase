import { useState, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from './input';
import { Button } from './button';

interface DataTableGlobalSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

export function DataTableGlobalSearch({
  value,
  onChange,
  onSubmit,
  placeholder = '搜索...',
  debounceMs = 300,
}: DataTableGlobalSearchProps) {
  const [inputValue, setInputValue] = useState(value);

  // 如果外部 value 变化，同步到内部 input
  if (value !== inputValue && !onSubmit) {
    setInputValue(value);
  }

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);
      onChange(newValue);
    },
    [onChange]
  );

  const handleSubmit = useCallback(() => {
    onSubmit?.(inputValue);
  }, [onSubmit, inputValue]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleClear = useCallback(() => {
    setInputValue('');
    onChange('');
    onSubmit?.('');
  }, [onChange, onSubmit]);

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          value={inputValue}
          onChange={handleChange}
          onKeyDown={onSubmit ? handleKeyDown : undefined}
          placeholder={placeholder}
          className="h-9 w-full max-w-[300px] pl-9 pr-20"
        />
        {inputValue && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {onSubmit && (
        <Button size="sm" variant="outline" onClick={handleSubmit} className="h-9">
          搜索
        </Button>
      )}
    </div>
  );
}
