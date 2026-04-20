
import { Select } from 'antd';

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
      onChange={(v) => onChange(Number(v))}
    >
      {years.map((year) => (
        <Select.Option key={year} value={String(year)}>
          {year}年
        </Select.Option>
      ))}
    </Select>
  );
}
