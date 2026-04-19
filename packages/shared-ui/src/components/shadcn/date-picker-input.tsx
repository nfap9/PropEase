import * as React from 'react';
import { format, parseISO } from 'date-fns';
import { ChevronDownIcon } from 'lucide-react';
import type { Locale } from 'date-fns';

import { cn } from '../../lib/utils';
import { Button } from './button';
import { Calendar } from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

export interface DatePickerInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  fromDate?: Date;
  toDate?: Date;
  fromYear?: number;
  toYear?: number;
  locale?: Locale;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  id?: string;
}

function DatePickerInput({
  value,
  onChange,
  placeholder = '选择日期',
  disabled = false,
  className,
  fromDate,
  toDate,
  fromYear,
  toYear,
  locale,
  weekStartsOn,
  id,
}: DatePickerInputProps) {
  const date = value ? parseISO(value) : undefined;

  const handleDateChange = (newDate: Date | undefined) => {
    if (newDate) {
      onChange?.(format(newDate, 'yyyy-MM-dd'));
    } else {
      onChange?.('');
    }
  };

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
          id={id}
        >
          {date ? format(date, 'PPP', { locale }) : <span>{placeholder}</span>}
          <ChevronDownIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateChange}
          disabled={[
            fromDate ? { before: fromDate } : undefined,
            toDate ? { after: toDate } : undefined,
          ].filter(Boolean) as never[]}
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

export { DatePickerInput };
