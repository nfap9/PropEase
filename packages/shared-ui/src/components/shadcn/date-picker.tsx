import * as React from 'react';
import {
  format,
  parseISO,
  startOfDay,
  endOfDay,
  subDays,
  startOfMonth,
  endOfMonth,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';
import {
  CalendarIcon,
  ChevronDownIcon,
  XIcon,
  CalendarRangeIcon,
} from 'lucide-react';
import type { Matcher, DateRange, Locale } from 'react-day-picker';

import { cn } from '../../lib/utils';
import { Button } from './button';
import { Calendar } from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

export type DatePickerMode = 'single' | 'range' | 'multiple';

export interface PresetItem {
  label: string;
  getValue: () => [Date | undefined, Date | undefined];
}

export interface DatePickerProps {
  /** 当前选中的日期值 - 单选模式 */
  value?: string;
  /** 日期范围值 - 范围模式，格式为 [start, end] */
  rangeValue?: [string | undefined, string | undefined];
  /** 多个日期值 - 多选模式 */
  multipleValue?: string[];
  /** 变化回调 - 单选模式 */
  onChange?: (value: string) => void;
  /** 变化回调 - 范围模式 */
  onRangeChange?: (value: [string | undefined, string | undefined]) => void;
  /** 变化回调 - 多选模式 */
  onMultipleChange?: (value: string[]) => void;
  placeholder?: string;
  placeholderRange?: [string, string];
  disabled?: boolean;
  className?: string;
  /** 最小可选日期 */
  fromDate?: Date;
  /** 最大可选日期 */
  toDate?: Date;
  fromYear?: number;
  toYear?: number;
  locale?: Locale;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  id?: string;
  /** 选择模式：single | range | multiple */
  mode?: DatePickerMode;
  /** 是否显示快捷预设 */
  showPresets?: boolean;
  /** 自定义预设项 */
  presets?: PresetItem[];
  /** 是否显示清除按钮 */
  showClear?: boolean;
  /** 日历显示格式 */
  captionLayout?: 'label' | 'dropdown';
  /** 触发器类名 */
  triggerClassName?: string;
  /** 日历类名 */
  calendarClassName?: string;
  /** 弹出层类名 */
  popoverClassName?: string;
  /** 日期格式化字符串 */
  dateFormat?: string;
  /** 是否自动关闭弹出层（选择后） */
  closeOnSelect?: boolean;
  /** 宽度 */
  width?: number | string;
  /** 禁用日期验证函数 */
  disabledValidator?: (date: Date) => boolean;
}

const defaultPresets: PresetItem[] = [
  {
    label: '今天',
    getValue: () => [startOfDay(new Date()), endOfDay(new Date())],
  },
  {
    label: '昨天',
    getValue: () => [startOfDay(subDays(new Date(), 1)), endOfDay(subDays(new Date(), 1))],
  },
  {
    label: '最近7天',
    getValue: () => [startOfDay(subDays(new Date(), 6)), endOfDay(new Date())],
  },
  {
    label: '最近30天',
    getValue: () => [startOfDay(subDays(new Date(), 29)), endOfDay(new Date())],
  },
  {
    label: '本月',
    getValue: () => [startOfMonth(new Date()), endOfDay(new Date())],
  },
  {
    label: '本月第一天',
    getValue: () => [startOfMonth(new Date()), startOfMonth(new Date())],
  },
];

function formatDateRange(
  start: Date | undefined,
  end: Date | undefined,
  dateFormat: string,
  locale?: Locale
): string {
  if (!start && !end) return '';
  if (start && !end) return format(start, dateFormat, { locale });
  if (!start && end) return format(end, dateFormat, { locale });
  if (start && end) {
    if (format(start, dateFormat, { locale }) === format(end, dateFormat, { locale })) {
      return format(start, dateFormat, { locale });
    }
    return `${format(start, dateFormat, { locale })} - ${format(end, dateFormat, { locale })}`;
  }
  return '';
}

function DatePickerComponent(props: DatePickerProps) {
  const {
    value,
    rangeValue,
    multipleValue,
    onChange,
    onRangeChange,
    onMultipleChange,
    placeholder = '选择日期',
    placeholderRange = ['开始日期', '结束日期'],
    disabled = false,
    className,
    fromDate,
    toDate,
    fromYear,
    toYear,
    locale = zhCN,
    weekStartsOn,
    id,
    mode = 'single',
    showPresets = false,
    presets = defaultPresets,
    showClear = true,
    captionLayout = 'dropdown',
    triggerClassName,
    calendarClassName,
    popoverClassName,
    dateFormat = 'yyyy-MM-dd',
    closeOnSelect = true,
    width,
    disabledValidator,
  } = props;

  const [open, setOpen] = React.useState(false);

  // 解析当前日期
  const parsedDate = value ? parseISO(value) : undefined;
  const parsedRangeStart = rangeValue?.[0] ? parseISO(rangeValue[0]) : undefined;
  const parsedRangeEnd = rangeValue?.[1] ? parseISO(rangeValue[1]) : undefined;
  const parsedMultiple = React.useMemo(() => {
    if (!multipleValue) return undefined;
    return multipleValue.map(v => parseISO(v)).filter((d): d is Date => d !== null);
  }, [multipleValue]);

  // 禁用日期 - 使用 Matcher 类型
  const disabledMatchers: Matcher[] = React.useMemo(() => {
    const matchers: Matcher[] = [];
    if (fromDate) {
      matchers.push({ before: fromDate });
    }
    if (toDate) {
      matchers.push({ after: toDate });
    }
    if (disabledValidator) {
      matchers.push(disabledValidator);
    }
    return matchers;
  }, [fromDate, toDate, disabledValidator]);

  // 清除选择
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (mode === 'single') {
      onChange?.('');
    } else if (mode === 'range') {
      onRangeChange?.([undefined, undefined]);
    } else {
      onMultipleChange?.([]);
    }
  };

  // 预设选择
  const handlePresetSelect = (preset: PresetItem) => {
    const [start, end] = preset.getValue();
    if (mode === 'range' && start && end) {
      const startStr = format(start, dateFormat);
      const endStr = format(end, dateFormat);
      onRangeChange?.([startStr, endStr]);
    }
  };

  // 构建显示文本
  const getDisplayText = () => {
    if (mode === 'single') {
      return parsedDate
        ? format(parsedDate, dateFormat, { locale })
        : undefined;
    } else if (mode === 'range') {
      return formatDateRange(parsedRangeStart, parsedRangeEnd, dateFormat, locale);
    } else {
      if (!parsedMultiple || parsedMultiple.length === 0) return undefined;
      if (parsedMultiple.length === 1) {
        return format(parsedMultiple[0], dateFormat, { locale });
      }
      return `${format(parsedMultiple[0], dateFormat, { locale })} (+${parsedMultiple.length - 1})`;
    }
  };

  const displayText = getDisplayText();
  const isEmpty = !displayText;

  // 渲染日历 - 根据模式分别渲染以避免类型问题
  const renderCalendar = () => {
    // 将 fromYear/toYear 转换为 startMonth/endMonth 以启用下拉选择
    const startMonthObj = fromYear ? new Date(fromYear, 0, 1) : undefined;
    const endMonthObj = toYear ? new Date(toYear, 11, 31) : undefined;

    const commonProps = {
      disabled: disabledMatchers.length > 0 ? disabledMatchers : undefined,
      startMonth: startMonthObj,
      endMonth: endMonthObj,
      locale,
      weekStartsOn,
      captionLayout,
      className: calendarClassName,
      initialFocus: true,
    };

    if (mode === 'single') {
      return (
        <Calendar
          mode="single"
          selected={parsedDate}
          onSelect={(date) => {
            if (date) {
              const formatted = format(date, dateFormat);
              onChange?.(formatted);
              if (closeOnSelect) {
                setOpen(false);
              }
            } else {
              onChange?.('');
            }
          }}
          {...commonProps}
        />
      );
    }

    if (mode === 'range') {
      return (
        <Calendar
          mode="range"
          selected={{ from: parsedRangeStart, to: parsedRangeEnd }}
          onSelect={(range) => {
            const start = range?.from ? format(range.from, dateFormat) : undefined;
            const end = range?.to ? format(range.to, dateFormat) : undefined;
            onRangeChange?.([start, end]);
          }}
          {...commonProps}
        />
      );
    }

    // multiple mode
    return (
      <Calendar
        mode="multiple"
        selected={parsedMultiple}
        onSelect={(dates) => {
          if (!dates) {
            onMultipleChange?.([]);
            return;
          }
          onMultipleChange?.(dates.map(d => format(d, dateFormat)));
        }}
        {...commonProps}
      />
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            'justify-between text-left font-normal data-[empty=true]:text-muted-foreground h-9',
            !displayText && 'text-muted-foreground',
            triggerClassName
          )}
          style={width ? { width: typeof width === 'number' ? `${width}px` : width } : undefined}
          id={id}
        >
          <span className="flex items-center gap-2 flex-1 min-w-0">
            {mode === 'range' ? (
              <CalendarRangeIcon className="h-4 w-4 shrink-0 opacity-50" />
            ) : (
              <CalendarIcon className="h-4 w-4 shrink-0 opacity-50" />
            )}
            {displayText ? (
              <span className="truncate">{displayText}</span>
            ) : mode === 'range' ? (
              <span className="truncate">
                {placeholderRange[0]} - {placeholderRange[1]}
              </span>
            ) : (
              <span>{placeholder}</span>
            )}
          </span>
          <span className="flex items-center gap-1 shrink-0">
            {showClear && !disabled && !isEmpty && (
              <XIcon
                className="h-4 w-4 opacity-50 hover:opacity-100"
                onClick={handleClear}
              />
            )}
            <ChevronDownIcon className="h-4 w-4 opacity-50" />
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn('p-0', popoverClassName)}
        align="start"
        style={width ? { width: typeof width === 'number' ? `${width + 32}px` : width } : undefined}
      >
        <div className="flex">
          {showPresets && mode === 'range' && (
            <div className="border-r p-3 pr-4 space-y-1">
              <div className="text-xs font-medium text-muted-foreground mb-2">
                快捷选择
              </div>
              {presets.map((preset, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-sm font-normal"
                  onClick={() => handlePresetSelect(preset)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          )}
          <div className="p-3">
            {renderCalendar()}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export { DatePickerComponent };
