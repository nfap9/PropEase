
import * as React from 'react';
import { createPortal } from 'react-dom';
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  isValid,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { CalendarRange, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

import { cn } from '../../lib/utils';
import { Button } from './button';

const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'] as const;

export interface DateRangeValue {
  from: string | null;
  to: string | null;
}

export interface DateRangePickerProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  placeholder?: string;
  fromLabel?: string;
  toLabel?: string;
  className?: string;
  triggerClassName?: string;
  panelClassName?: string;
  disabled?: boolean;
}

interface ResolvedRange {
  from: Date;
  to: Date;
}

interface CalendarPanelProps {
  month: Date;
  range: ResolvedRange | null;
  selectedFrom: Date | null;
  selectedTo: Date | null;
  onSelect: (day: Date) => void;
  onHover: (day: Date | null) => void;
  onPrevYear?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onNextYear?: () => void;
}

interface FloatingPanelPosition {
  top: number;
  left: number;
  width: number;
}

function parseDateValue(value: string | null): Date | null {
  if (!value) {
    return null;
  }

  const parsedDate = parseISO(value);
  return isValid(parsedDate) ? parsedDate : null;
}

function toDateValue(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

function toDisplayDate(value: string | null): string | null {
  const parsedDate = parseDateValue(value);
  return parsedDate ? format(parsedDate, 'yyyy.MM.dd') : null;
}

function getRangeSummary(value: DateRangeValue, placeholder: string): string {
  const from = toDisplayDate(value.from);
  const to = toDisplayDate(value.to);

  if (from && to) {
    return `${from} - ${to}`;
  }

  if (from) {
    return `${from} 起`;
  }

  if (to) {
    return `截止 ${to}`;
  }

  return placeholder;
}

function getInitialMonth(value: DateRangeValue): Date {
  const from = parseDateValue(value.from);
  const to = parseDateValue(value.to);

  if (from) {
    return startOfMonth(from);
  }

  if (to) {
    return startOfMonth(subMonths(to, 1));
  }

  return startOfMonth(new Date());
}

function getResolvedRange(value: DateRangeValue, hoveredDate: Date | null): ResolvedRange | null {
  const from = parseDateValue(value.from);
  const to = parseDateValue(value.to);

  if (from && to) {
    return isAfter(from, to) ? { from: to, to: from } : { from, to };
  }

  if (from && hoveredDate) {
    return isAfter(from, hoveredDate) ? { from: hoveredDate, to: from } : { from, to: hoveredDate };
  }

  return null;
}

function buildCalendarDays(month: Date): Date[] {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  const days: Date[] = [];

  let cursor = start;
  while (days.length < 42 || isBefore(cursor, end) || isSameDay(cursor, end)) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }

  return days.slice(0, 42);
}

function CalendarPanel({
  month,
  range,
  selectedFrom,
  selectedTo,
  onSelect,
  onHover,
  onPrevYear,
  onPrev,
  onNext,
  onNextYear,
}: CalendarPanelProps) {
  const days = React.useMemo(() => buildCalendarDays(month), [month]);

  return (
    <div className="min-w-0">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn('h-7 w-7 rounded-md', !onPrevYear && 'invisible')}
            onClick={onPrevYear}
            disabled={!onPrevYear}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn('h-7 w-7 rounded-md', !onPrev && 'invisible')}
            onClick={onPrev}
            disabled={!onPrev}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-foreground mx-2 text-sm font-medium">{format(month, 'yyyy 年 M 月')}</div>
        <div className="flex items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn('h-7 w-7 rounded-md', !onNext && 'invisible')}
            onClick={onNext}
            disabled={!onNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn('h-7 w-7 rounded-md', !onNextYear && 'invisible')}
            onClick={onNextYear}
            disabled={!onNextYear}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="text-muted-foreground grid grid-cols-7 gap-y-0.5 text-center text-[11px]">
        {WEEKDAY_LABELS.map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-y-0.5" onMouseLeave={() => onHover(null)}>
        {days.map((day) => {
          const outsideMonth = !isSameMonth(day, month);
          const isStart = selectedFrom ? isSameDay(day, selectedFrom) : false;
          const isEnd = selectedTo ? isSameDay(day, selectedTo) : false;
          const inRange = range
            ? (isSameDay(day, range.from) || isAfter(day, range.from)) &&
              (isSameDay(day, range.to) || isBefore(day, range.to))
            : false;

          return (
            <div
              key={day.toISOString()}
              className={cn(
                'flex h-9 items-center justify-center',
                inRange && 'bg-primary/10',
                isStart && 'rounded-l-lg',
                isEnd && 'rounded-r-lg',
                isStart && isEnd && 'rounded-lg'
              )}
            >
              <button
                type="button"
                onClick={() => onSelect(day)}
                onMouseEnter={() => onHover(day)}
                className={cn(
                  'inline-flex h-7 w-7 items-center justify-center rounded-md text-sm transition-colors',
                  'focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                  outsideMonth && 'text-muted-foreground/40',
                  !outsideMonth && !inRange && 'hover:bg-accent hover:text-accent-foreground',
                  inRange && !isStart && !isEnd && !outsideMonth && 'text-foreground',
                  (isStart || isEnd) && 'bg-primary text-primary-foreground hover:bg-primary'
                )}
              >
                {format(day, 'd')}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = '选择日期范围',
  fromLabel = '开始日期',
  toLabel = '结束日期',
  className,
  triggerClassName,
  panelClassName,
  disabled = false,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [baseMonth, setBaseMonth] = React.useState(() => getInitialMonth(value));
  const [hoveredDate, setHoveredDate] = React.useState<Date | null>(null);
  const [mounted, setMounted] = React.useState(false);
  const [panelPosition, setPanelPosition] = React.useState<FloatingPanelPosition | null>(null);
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const panelRef = React.useRef<HTMLDivElement | null>(null);

  const selectedFrom = React.useMemo(() => parseDateValue(value.from), [value.from]);
  const selectedTo = React.useMemo(() => parseDateValue(value.to), [value.to]);
  const range = React.useMemo(() => getResolvedRange(value, hoveredDate), [hoveredDate, value]);
  const hasValue = Boolean(value.from || value.to);
  const rangeSummary = getRangeSummary(value, placeholder);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    setBaseMonth(getInitialMonth(value));
    setHoveredDate(null);
  }, [open, value]);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    const updatePanelPosition = () => {
      const trigger = triggerRef.current;
      if (!trigger) {
        return;
      }

      const rect = trigger.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const preferredWidth = Math.max(520, rect.width);
      const width = Math.min(preferredWidth, viewportWidth - 16);
      const estimatedHeight = width >= 640 ? 352 : width >= 520 ? 640 : 680;
      const placeAbove = rect.bottom + 8 + estimatedHeight > viewportHeight - 8 && rect.top - 8 - estimatedHeight > 8;
      const top = placeAbove
        ? Math.max(8, rect.top - estimatedHeight - 8)
        : Math.min(viewportHeight - 8, rect.bottom + 8);
      const left = Math.min(Math.max(8, rect.left), viewportWidth - width - 8);

      setPanelPosition({ top, left, width });
    };

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;

      if (!rootRef.current?.contains(target) && !panelRef.current?.contains(target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    updatePanelPosition();

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', updatePanelPosition);
    window.addEventListener('scroll', updatePanelPosition, true);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', updatePanelPosition);
      window.removeEventListener('scroll', updatePanelPosition, true);
    };
  }, [open]);

  const handleSelectDate = (day: Date) => {
    const nextValue = toDateValue(day);

    if (!value.from || (value.from && value.to)) {
      onChange({ from: nextValue, to: null });
      setHoveredDate(day);
      return;
    }

    if (value.from && !value.to) {
      if (nextValue < value.from) {
        onChange({ from: nextValue, to: value.from });
      } else {
        onChange({ from: value.from, to: nextValue });
      }

      setHoveredDate(null);
    }
  };

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={cn(
          'border-input flex h-9 w-full min-w-[260px] items-center justify-between rounded-md border bg-transparent px-3 text-sm shadow-sm transition-colors',
          'focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50',
          open && 'ring-ring ring-1',
          triggerClassName
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          <CalendarRange className="text-muted-foreground h-4 w-4 shrink-0" />
          <span className={cn('truncate text-left', !hasValue && 'text-muted-foreground')}>{rangeSummary}</span>
        </span>
        <ChevronDown
          className={cn('text-muted-foreground ml-2 h-4 w-4 shrink-0 transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && mounted && panelPosition
        ? createPortal(
            <div
              ref={panelRef}
              style={{
                position: 'fixed',
                top: `${panelPosition.top}px`,
                left: `${panelPosition.left}px`,
                width: `${panelPosition.width}px`,
              }}
              className={cn('bg-background z-50 rounded-xl border p-3 shadow-xl', panelClassName)}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <CalendarPanel
                  month={baseMonth}
                  range={range}
                  selectedFrom={selectedFrom}
                  selectedTo={selectedTo}
                  onSelect={handleSelectDate}
                  onHover={(day) => {
                    if (value.from && !value.to) {
                      setHoveredDate(day);
                    }
                  }}
                  onPrevYear={() => setBaseMonth((current) => subMonths(current, 12))}
                  onPrev={() => setBaseMonth((current) => subMonths(current, 1))}
                />
                <CalendarPanel
                  month={addMonths(baseMonth, 1)}
                  range={range}
                  selectedFrom={selectedFrom}
                  selectedTo={selectedTo}
                  onSelect={handleSelectDate}
                  onHover={(day) => {
                    if (value.from && !value.to) {
                      setHoveredDate(day);
                    }
                  }}
                  onNext={() => setBaseMonth((current) => addMonths(current, 1))}
                  onNextYear={() => setBaseMonth((current) => addMonths(current, 12))}
                />
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t pt-2">
                <div className="text-muted-foreground text-[11px]">再次点击任意日期会重新开始选择。</div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onChange({ from: null, to: null });
                      setHoveredDate(null);
                    }}
                    disabled={!hasValue}
                  >
                    清空
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
                    完成
                  </Button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
