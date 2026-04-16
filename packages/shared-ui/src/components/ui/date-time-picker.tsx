
import * as React from 'react';
import {
  addDays,
  addMonths,
  addYears,
  endOfMonth,
  endOfWeek,
  format,
  getMonth,
  getYear,
  isSameDay,
  isSameMonth,
  isValid,
  parse,
  parseISO,
  setMonth,
  setYear,
  setHours,
  setMinutes,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock3,
  X,
} from 'lucide-react';

import { cn } from '../../lib/utils';
import { Button } from './button';

const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'] as const;
const MONTH_LABELS = ['1 月', '2 月', '3 月', '4 月', '5 月', '6 月', '7 月', '8 月', '9 月', '10 月', '11 月', '12 月'] as const;
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, index) => index);
const PANEL_GAP = 8;

type PickerMode = 'date' | 'time' | 'datetime';
type FloatingSide = 'top' | 'bottom' | 'left' | 'right';
type DatePanelView = 'day' | 'month' | 'year';

interface FloatingPanelPosition {
  top: number;
  left: number;
  width: number;
  side: FloatingSide;
  stacked: boolean;
}

export interface DateTimePickerProps {
  value: string | null | undefined;
  onChange: (value: string) => void;
  mode?: PickerMode;
  placeholder?: string;
  valueFormat?: string;
  displayFormat?: string;
  minuteStep?: number;
  defaultTime?: string;
  className?: string;
  triggerClassName?: string;
  panelClassName?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  required?: boolean;
  onBlur?: React.FocusEventHandler<HTMLButtonElement>;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  'data-testid'?: string;
}

function getDefaultValueFormat(mode: PickerMode): string {
  if (mode === 'time') {
    return 'HH:mm';
  }

  if (mode === 'datetime') {
    return "yyyy-MM-dd'T'HH:mm";
  }

  return 'yyyy-MM-dd';
}

function getDefaultDisplayFormat(mode: PickerMode): string {
  if (mode === 'time') {
    return 'HH:mm';
  }

  if (mode === 'datetime') {
    return 'yyyy.MM.dd EEE HH:mm';
  }

  return 'yyyy.MM.dd EEE';
}

function buildCalendarDays(month: Date): Date[] {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  const days: Date[] = [];

  let cursor = start;
  while (days.length < 42 || cursor <= end) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }

  return days.slice(0, 42);
}

function buildMinuteOptions(step: number): number[] {
  const safeStep = Math.min(Math.max(step, 1), 30);
  const values: number[] = [];

  for (let minute = 0; minute < 60; minute += safeStep) {
    values.push(minute);
  }

  if (values[values.length - 1] !== 59 && 60 % safeStep !== 0) {
    values.push(59);
  }

  return values;
}

function parseTimeString(value: string): { hour: number; minute: number } {
  const [hourText = '9', minuteText = '0'] = value.split(':');
  const hour = Number(hourText);
  const minute = Number(minuteText);

  return {
    hour: Number.isFinite(hour) ? Math.min(Math.max(hour, 0), 23) : 9,
    minute: Number.isFinite(minute) ? Math.min(Math.max(minute, 0), 59) : 0,
  };
}

function alignMinuteToStep(minute: number, step: number): number {
  const safeStep = Math.min(Math.max(step, 1), 30);
  const rounded = Math.round(minute / safeStep) * safeStep;

  return rounded >= 60 ? 0 : rounded;
}

function applyTime(date: Date, hour: number, minute: number): Date {
  return setMinutes(setHours(date, hour), minute);
}

function getSeedDate(mode: PickerMode, minuteStep: number, defaultTime: string): Date {
  if (mode === 'date') {
    return startOfDay(new Date());
  }

  const now = new Date();

  if (mode === 'time') {
    return applyTime(startOfDay(now), now.getHours(), alignMinuteToStep(now.getMinutes(), minuteStep));
  }

  const parsedDefaultTime = parseTimeString(defaultTime);
  return applyTime(startOfDay(now), parsedDefaultTime.hour, parsedDefaultTime.minute);
}

function parsePickerValue(
  value: string | null | undefined,
  mode: PickerMode,
  valueFormat: string,
  minuteStep: number,
  defaultTime: string
): Date | null {
  if (!value) {
    return null;
  }

  const parsedWithFormat = parse(value, valueFormat, getSeedDate(mode, minuteStep, defaultTime));
  if (isValid(parsedWithFormat)) {
    return parsedWithFormat;
  }

  if (mode !== 'time') {
    const parsedIso = parseISO(value);
    if (isValid(parsedIso)) {
      return parsedIso;
    }
  }

  const parsedTime = parse(value, 'HH:mm', getSeedDate('time', minuteStep, defaultTime));
  return isValid(parsedTime) ? parsedTime : null;
}

function getTriggerSummary(
  value: string | null | undefined,
  mode: PickerMode,
  valueFormat: string,
  displayFormat: string,
  minuteStep: number,
  defaultTime: string,
  placeholder: string
): string {
  const parsedValue = parsePickerValue(value, mode, valueFormat, minuteStep, defaultTime);

  if (!parsedValue) {
    return placeholder;
  }

  return format(parsedValue, displayFormat, { locale: zhCN });
}

function combineDateSelection(
  currentValue: Date | null,
  selectedDay: Date,
  mode: PickerMode,
  defaultTime: string,
  minuteStep: number
): Date {
  if (mode === 'date') {
    return startOfDay(selectedDay);
  }

  const base = currentValue ? new Date(currentValue) : getSeedDate(mode, minuteStep, defaultTime);
  const mergedDate = new Date(selectedDay);

  mergedDate.setHours(base.getHours(), base.getMinutes(), 0, 0);
  return mergedDate;
}

function getQuickTimePresets(minuteStep: number) {
  const now = new Date();
  const roundedNow = format(
    applyTime(startOfDay(now), now.getHours(), alignMinuteToStep(now.getMinutes(), minuteStep)),
    'HH:mm'
  );

  return ['09:00', '12:00', '18:00', '21:00', roundedNow].filter(
    (timeValue, index, allValues) => allValues.indexOf(timeValue) === index
  );
}

function getYearGridStart(year: number): number {
  return year - 5;
}

function buildYearOptions(startYear: number): number[] {
  return Array.from({ length: 12 }, (_, index) => startYear + index);
}

function clamp(value: number, min: number, max: number): number {
  if (max < min) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}

function getPanelMetrics(mode: PickerMode, viewportWidth: number): { width: number; height: number; stacked: boolean } {
  if (mode === 'time') {
    return {
      width: Math.min(264, viewportWidth - 16),
      height: 308,
      stacked: false,
    };
  }

  if (mode === 'datetime') {
    const stacked = viewportWidth < 720;
    return {
      width: Math.min(stacked ? 320 : 520, viewportWidth - 16),
      height: stacked ? 444 : 332,
      stacked,
    };
  }

  return {
    width: Math.min(296, viewportWidth - 16),
    height: 304,
    stacked: false,
  };
}

function resolvePanelPosition(
  triggerRect: DOMRect,
  rootRect: DOMRect,
  mode: PickerMode,
  viewportWidth: number,
  viewportHeight: number
): FloatingPanelPosition {
  const metrics = getPanelMetrics(mode, viewportWidth);
  const minLeft = 8;
  const maxLeft = viewportWidth - metrics.width - 8;
  const minTop = 8;
  const maxTop = viewportHeight - metrics.height - 8;

  const spaces = {
    bottom: viewportHeight - triggerRect.bottom - PANEL_GAP,
    top: triggerRect.top - PANEL_GAP,
    right: viewportWidth - triggerRect.right - PANEL_GAP,
    left: triggerRect.left - PANEL_GAP,
  };

  const fits = {
    bottom: spaces.bottom >= metrics.height,
    top: spaces.top >= metrics.height,
    right: spaces.right >= metrics.width && viewportHeight >= metrics.height + 16,
    left: spaces.left >= metrics.width && viewportHeight >= metrics.height + 16,
  };

  const sidePriority: FloatingSide[] =
    mode === 'time' ? ['bottom', 'top', 'right', 'left'] : ['bottom', 'top', 'right', 'left'];

  let side = sidePriority.find((candidate) => fits[candidate]) ?? 'bottom';

  if (!sidePriority.some((candidate) => fits[candidate])) {
    const horizontalCandidate = spaces.right >= spaces.left ? 'right' : 'left';
    const verticalCandidate = spaces.bottom >= spaces.top ? 'bottom' : 'top';
    const horizontalScore = Math.min(spaces[horizontalCandidate], metrics.width);
    const verticalScore = Math.min(spaces[verticalCandidate], metrics.height);

    side = horizontalScore > verticalScore ? horizontalCandidate : verticalCandidate;
  }

  let viewportLeft = 0;
  let viewportTop = 0;

  if (side === 'bottom' || side === 'top') {
    viewportLeft = clamp(
      triggerRect.left + triggerRect.width / 2 - metrics.width / 2,
      minLeft,
      maxLeft
    );
    viewportTop =
      side === 'bottom'
        ? clamp(triggerRect.bottom + PANEL_GAP, minTop, maxTop)
        : clamp(triggerRect.top - metrics.height - PANEL_GAP, minTop, maxTop);
  } else {
    viewportTop = clamp(
      triggerRect.top + triggerRect.height / 2 - metrics.height / 2,
      minTop,
      maxTop
    );
    viewportLeft =
      side === 'right'
        ? clamp(triggerRect.right + PANEL_GAP, minLeft, maxLeft)
        : clamp(triggerRect.left - metrics.width - PANEL_GAP, minLeft, maxLeft);
  }

  return {
    top: viewportTop - rootRect.top,
    left: viewportLeft - rootRect.left,
    width: metrics.width,
    side,
    stacked: metrics.stacked,
  };
}

export function DateTimePicker({
  value,
  onChange,
  mode = 'date',
  placeholder = mode === 'time' ? '选择时间' : mode === 'datetime' ? '选择日期时间' : '选择日期',
  valueFormat,
  displayFormat,
  minuteStep = 15,
  defaultTime = '09:00',
  className,
  triggerClassName,
  panelClassName,
  disabled = false,
  id,
  name,
  required = false,
  onBlur,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  'data-testid': dataTestId,
}: DateTimePickerProps) {
  const resolvedValueFormat = valueFormat ?? getDefaultValueFormat(mode);
  const resolvedDisplayFormat = displayFormat ?? getDefaultDisplayFormat(mode);
  const [open, setOpen] = React.useState(false);
  const [datePanelView, setDatePanelView] = React.useState<DatePanelView>('day');
  const [displayMonth, setDisplayMonth] = React.useState(() => {
    const parsedValue = parsePickerValue(value, mode, resolvedValueFormat, minuteStep, defaultTime);
    return startOfMonth(parsedValue ?? new Date());
  });
  const [yearGridStart, setYearGridStart] = React.useState(() => getYearGridStart(getYear(new Date())));
  const [panelPosition, setPanelPosition] = React.useState<FloatingPanelPosition | null>(null);
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const panelRef = React.useRef<HTMLDivElement | null>(null);

  const minuteOptions = React.useMemo(() => buildMinuteOptions(minuteStep), [minuteStep]);
  const selectedValue = React.useMemo(
    () => parsePickerValue(value, mode, resolvedValueFormat, minuteStep, defaultTime),
    [defaultTime, minuteStep, mode, resolvedValueFormat, value]
  );
  const summary = React.useMemo(
    () =>
      getTriggerSummary(
        value,
        mode,
        resolvedValueFormat,
        resolvedDisplayFormat,
        minuteStep,
        defaultTime,
        placeholder
      ),
    [defaultTime, minuteStep, mode, placeholder, resolvedDisplayFormat, resolvedValueFormat, value]
  );
  const hasValue = Boolean(value);
  const isDateEnabled = mode !== 'time';
  const isTimeEnabled = mode !== 'date';
  const displayYear = getYear(displayMonth);
  const displayMonthIndex = getMonth(displayMonth);
  const yearOptions = React.useMemo(() => buildYearOptions(yearGridStart), [yearGridStart]);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    setDisplayMonth(startOfMonth(selectedValue ?? new Date()));
    setDatePanelView('day');
    setYearGridStart(getYearGridStart(getYear(selectedValue ?? new Date())));
  }, [open, selectedValue]);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    const updatePanelPosition = () => {
      const trigger = triggerRef.current;
      const root = rootRef.current;
      if (!trigger || !root) {
        return;
      }

      const rect = trigger.getBoundingClientRect();
      const rootRect = root.getBoundingClientRect();
      setPanelPosition(resolvePanelPosition(rect, rootRect, mode, window.innerWidth, window.innerHeight));
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
  }, [mode, open]);

  const commitValue = (nextDate: Date, shouldClose = mode !== 'datetime') => {
    onChange(format(nextDate, resolvedValueFormat));

    if (shouldClose) {
      setOpen(false);
    }
  };

  const handleDateSelection = (selectedDay: Date) => {
    const nextValue = combineDateSelection(selectedValue, selectedDay, mode, defaultTime, minuteStep);
    commitValue(nextValue, mode === 'date');
  };

  const handleSelectYear = (year: number) => {
    setDisplayMonth((current) => startOfMonth(setYear(current, year)));
    setDatePanelView('month');
  };

  const handleSelectMonth = (month: number) => {
    setDisplayMonth((current) => startOfMonth(setMonth(current, month)));
    setDatePanelView('day');
  };

  const handleTimeSelection = (hour: number, minute: number) => {
    const baseDate = selectedValue ?? getSeedDate(mode, minuteStep, defaultTime);
    const nextValue = applyTime(baseDate, hour, minute);
    commitValue(nextValue, mode === 'time');
  };

  const handleClearValue = (event: React.PointerEvent<HTMLButtonElement> | React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onChange('');
    setOpen(false);
  };

  const quickTimePresets = getQuickTimePresets(minuteStep);
  const showTimePanelAsSidebar = mode === 'datetime' && !panelPosition?.stacked;
  const showDayGrid = isDateEnabled && datePanelView === 'day';
  const showMonthGrid = isDateEnabled && datePanelView === 'month';
  const showYearGrid = isDateEnabled && datePanelView === 'year';

  return (
    <div ref={rootRef} data-slot="date-time-picker-root" className={cn('group/date-time-picker relative', className)}>
      {name ? <input type="hidden" name={name} value={value ?? ''} disabled={disabled} /> : null}

      <button
        ref={triggerRef}
        data-slot="date-time-picker-trigger"
        id={id}
        type="button"
        disabled={disabled}
        onBlur={onBlur}
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid}
        aria-required={required}
        data-testid={dataTestId}
        className={cn(
          'border border-input flex h-9 w-full items-center justify-between rounded-md bg-transparent px-3 py-2 text-sm shadow-sm transition-colors',
          'focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-1',
          'disabled:cursor-not-allowed disabled:opacity-50',
          open && 'border-ring ring-ring ring-1',
          hasValue && !disabled && 'pr-10',
          triggerClassName
        )}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <span className="text-muted-foreground flex h-4 w-4 shrink-0 items-center justify-center">
            {mode === 'time' ? <Clock3 className="h-4 w-4" /> : <CalendarDays className="h-4 w-4" />}
          </span>
          <span className={cn('truncate text-left', !hasValue && 'text-muted-foreground')}>{summary}</span>
        </span>
        <ChevronDown
          className={cn(
            'text-muted-foreground ml-2 h-4 w-4 shrink-0 transition-all',
            hasValue && !disabled && 'group-hover/date-time-picker:opacity-0',
            open && 'rotate-180'
          )}
        />
      </button>

      {hasValue && !disabled ? (
        <button
          type="button"
          aria-label="清空日期"
          className={cn(
            'absolute right-2 top-1/2 z-10 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground transition-all',
            'opacity-0 group-hover/date-time-picker:opacity-100 hover:bg-accent hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-1 focus:ring-ring'
          )}
          onPointerDown={handleClearValue}
          onClick={handleClearValue}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}

      {open && panelPosition ? (
        <div
          ref={panelRef}
          data-slot="date-time-picker-panel"
          data-side={panelPosition.side}
          style={{
            top: `${panelPosition.top}px`,
            left: `${panelPosition.left}px`,
            width: `${panelPosition.width}px`,
          }}
          className={cn(
            'bg-popover text-popover-foreground absolute z-50 rounded-md border p-1.5 shadow-md',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
            'data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2',
            panelClassName
          )}
          data-state="open"
        >
          <div className={cn('grid gap-2.5', showTimePanelAsSidebar && 'grid-cols-[minmax(0,1fr)_188px]')}>
                {isDateEnabled ? (
                  <div className="p-1">
                      <div className="mb-1.5 flex items-center justify-between">
                        <div className="flex items-center gap-0.5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={datePanelView === 'year' ? '上一组年份' : datePanelView === 'month' ? '上一年' : '上一年'}
                            className="h-6 w-6 rounded-sm"
                            onClick={() => {
                              if (datePanelView === 'year') {
                                setYearGridStart((current) => current - 12);
                                return;
                              }

                              setDisplayMonth((current) => subMonths(current, 12));
                            }}
                          >
                            <ChevronsLeft className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={datePanelView === 'year' ? '上一组年份' : datePanelView === 'month' ? '上一年' : '上个月'}
                            className="h-6 w-6 rounded-sm"
                            onClick={() => {
                              if (datePanelView === 'year') {
                                setYearGridStart((current) => current - 12);
                                return;
                              }

                              if (datePanelView === 'month') {
                                setDisplayMonth((current) => subMonths(current, 12));
                                return;
                              }

                              setDisplayMonth((current) => subMonths(current, 1));
                            }}
                          >
                            <ChevronLeft className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        <div className="flex items-center gap-1 text-[13px] font-medium">
                          <button
                            type="button"
                            className="rounded-sm px-1 py-0.5 hover:bg-accent"
                            onClick={() => {
                              setYearGridStart(getYearGridStart(displayYear));
                              setDatePanelView('year');
                            }}
                          >
                            {displayYear} 年
                          </button>
                          {datePanelView !== 'year' ? (
                            <button
                              type="button"
                              className="rounded-sm px-1 py-0.5 hover:bg-accent"
                              onClick={() => setDatePanelView('month')}
                            >
                              {MONTH_LABELS[displayMonthIndex]}
                            </button>
                          ) : null}
                        </div>

                        <div className="flex items-center gap-0.5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={datePanelView === 'year' ? '下一组年份' : datePanelView === 'month' ? '下一年' : '下个月'}
                            className="h-6 w-6 rounded-sm"
                            onClick={() => {
                              if (datePanelView === 'year') {
                                setYearGridStart((current) => current + 12);
                                return;
                              }

                              if (datePanelView === 'month') {
                                setDisplayMonth((current) => addMonths(current, 12));
                                return;
                              }

                              setDisplayMonth((current) => addMonths(current, 1));
                            }}
                          >
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={datePanelView === 'year' ? '下一组年份' : datePanelView === 'month' ? '下一年' : '下一年'}
                            className="h-6 w-6 rounded-sm"
                            onClick={() => {
                              if (datePanelView === 'year') {
                                setYearGridStart((current) => current + 12);
                                return;
                              }

                              setDisplayMonth((current) => addMonths(current, 12));
                            }}
                          >
                            <ChevronsRight className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {showDayGrid ? (
                        <>
                          <div className="text-muted-foreground grid grid-cols-7 text-center text-[11px]">
                            {WEEKDAY_LABELS.map((day) => (
                              <div key={day} className="py-0.5 text-[10px]">
                                {day}
                              </div>
                            ))}
                          </div>

                          <div className="mt-0.5 grid grid-cols-7 gap-y-0.5">
                            {buildCalendarDays(displayMonth).map((day) => {
                              const isSelected = selectedValue ? isSameDay(day, selectedValue) : false;
                              const outsideMonth = !isSameMonth(day, displayMonth);
                              const isToday = isSameDay(day, startOfDay(new Date()));

                              return (
                                <button
                                  key={day.toISOString()}
                                  type="button"
                                  onClick={() => handleDateSelection(day)}
                                  className={cn(
                                    'flex h-8 items-center justify-center',
                                    'focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'
                                  )}
                                >
                                  <span
                                    className={cn(
                                      'inline-flex h-[26px] w-[26px] items-center justify-center rounded-sm text-[12px] transition-colors',
                                      outsideMonth && 'text-muted-foreground/35',
                                      !outsideMonth && !isSelected && 'hover:bg-accent hover:text-accent-foreground',
                                      isToday && !isSelected && 'border border-primary/25 text-primary',
                                      isSelected && 'bg-primary text-primary-foreground shadow-[0_10px_25px_-16px_hsl(var(--primary)/0.9)]'
                                    )}
                                  >
                                    {format(day, 'd')}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </>
                      ) : null}

                      {showMonthGrid ? (
                        <div className="grid grid-cols-3 gap-1 pt-1">
                          {MONTH_LABELS.map((monthLabel, monthIndex) => {
                            const isSelected = displayMonthIndex === monthIndex;

                            return (
                              <button
                                key={monthLabel}
                                type="button"
                                onClick={() => handleSelectMonth(monthIndex)}
                                className={cn(
                                  'rounded-sm border px-0 py-2 text-sm transition-colors',
                                  'focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                                  isSelected
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'hover:border-primary/30 hover:bg-accent'
                                )}
                              >
                                {monthLabel}
                              </button>
                            );
                          })}
                        </div>
                      ) : null}

                      {showYearGrid ? (
                        <div className="grid grid-cols-3 gap-1 pt-1">
                          {yearOptions.map((year) => {
                            const isSelected = displayYear === year;

                            return (
                              <button
                                key={year}
                                type="button"
                                onClick={() => handleSelectYear(year)}
                                className={cn(
                                  'rounded-sm border px-0 py-2 text-sm transition-colors',
                                  'focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                                  isSelected
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'hover:border-primary/30 hover:bg-accent'
                                )}
                              >
                                {year}
                              </button>
                            );
                          })}
                        </div>
                      ) : null}
                  </div>
                ) : null}

                {isTimeEnabled ? (
                  <div className="p-1">
                    <div className="text-sm font-medium">快捷时间</div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {quickTimePresets.map((timeValue) => {
                        const timeParts = parseTimeString(timeValue);
                        const isSelected =
                          selectedValue?.getHours() === timeParts.hour && selectedValue?.getMinutes() === timeParts.minute;

                        return (
                          <Button
                            key={timeValue}
                            type="button"
                            size="sm"
                            className="h-7 rounded-lg px-2.5"
                            variant={isSelected ? 'default' : 'outline'}
                            onClick={() => handleTimeSelection(timeParts.hour, timeParts.minute)}
                          >
                            {timeValue}
                          </Button>
                        );
                      })}
                    </div>

                    <div className="mt-3 text-sm font-medium">小时</div>
                    <div className="mt-2 grid grid-cols-6 gap-1.5">
                      {HOUR_OPTIONS.map((hour) => {
                        const isSelected = selectedValue?.getHours() === hour;

                        return (
                          <button
                            key={hour}
                            type="button"
                            onClick={() => handleTimeSelection(hour, selectedValue?.getMinutes() ?? 0)}
                            className={cn(
                              'rounded-sm border px-0 py-1.5 text-sm transition-colors',
                              'focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                              isSelected
                                ? 'border-primary bg-primary text-primary-foreground shadow-[0_10px_25px_-16px_hsl(var(--primary)/0.9)]'
                                : 'hover:border-primary/30 hover:bg-accent'
                            )}
                          >
                            {String(hour).padStart(2, '0')}
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-3 text-sm font-medium">分钟</div>
                    <div className="mt-2 grid grid-cols-4 gap-1.5">
                      {minuteOptions.map((minute) => {
                        const isSelected = selectedValue?.getMinutes() === minute;

                        return (
                          <button
                            key={minute}
                            type="button"
                            onClick={() => handleTimeSelection(selectedValue?.getHours() ?? 9, minute)}
                            className={cn(
                              'rounded-sm border px-0 py-1.5 text-sm transition-colors',
                              'focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                              isSelected
                                ? 'border-primary bg-primary text-primary-foreground shadow-[0_10px_25px_-16px_hsl(var(--primary)/0.9)]'
                                : 'hover:border-primary/30 hover:bg-accent'
                            )}
                          >
                            {String(minute).padStart(2, '0')}
                          </button>
                        );
                      })}
                    </div>
                  </div>
		                ) : null}
		          </div>

              {mode === 'datetime' ? (
                <div className="mt-2 flex items-center justify-end border-t pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => setOpen(false)}
                  >
                    完成
                  </Button>
                </div>
              ) : null}
		        </div>
	      ) : null}
	    </div>
	  );
	}
