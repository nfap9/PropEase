import * as React from 'react';
import { format } from 'date-fns';
import { ChevronDownIcon } from 'lucide-react';
import type { Matcher } from 'react-day-picker';
import type { Locale } from 'date-fns';

import { cn } from '../../lib/utils';
import { Button } from './button';
import { Calendar } from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

export interface DatePickerProps {
  date?: Date;
  onDateChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  fromDate?: Date;
  toDate?: Date;
  fromYear?: number;
  toYear?: number;
  locale?: Locale;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
}

function DatePicker({
  date,
  onDateChange,
  placeholder = '选择日期',
  disabled = false,
  className,
  fromDate,
  toDate,
  fromYear,
  toYear,
  locale,
  weekStartsOn,
}: DatePickerProps) {
  const disabledMatchers: Matcher[] = React.useMemo(() => {
    const matchers: Matcher[] = [];
    if (fromDate) {
      matchers.push({ before: fromDate });
    }
    if (toDate) {
      matchers.push({ after: toDate });
    }
    return matchers;
  }, [fromDate, toDate]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-[212px] justify-between text-left font-normal data-[empty=true]:text-muted-foreground',
            !date && 'text-muted-foreground',
            className
          )}
        >
          {date ? format(date, 'PPP', { locale }) : <span>{placeholder}</span>}
          <ChevronDownIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onDateChange}
          disabled={disabledMatchers.length > 0 ? disabledMatchers : undefined}
          fromYear={fromYear}
          toYear={toYear}
          locale={locale}
          weekStartsOn={weekStartsOn}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

export { DatePicker };
