
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@apartment-ultra/shared-ui/components/ui';

interface YearFilterProps {
  value: number;
  onChange: (year: number) => void;
}

export function YearFilter({ value, onChange }: YearFilterProps) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 4 }, (_, i) => currentYear - 2 + i);

  return (
    <Select
      value={String(value)}
      onValueChange={(v) => onChange(Number(v))}
    >
      <SelectTrigger className="w-36">
        <SelectValue placeholder="选择年份" />
      </SelectTrigger>
      <SelectContent>
        {years.map((year) => (
          <SelectItem key={year} value={String(year)}>
            {year}年
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
