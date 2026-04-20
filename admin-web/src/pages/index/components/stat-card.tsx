
import { Card } from 'antd';

interface StatCardProps {
  title: string;
  value: number | string;
  isPercentage?: boolean;
  isCurrency?: boolean;
  className?: string;
}

function formatValue(value: number | string, isPercentage?: boolean, isCurrency?: boolean): string {
  if (typeof value === 'string') return value;
  if (isPercentage) return `${Number(value).toFixed(1)}%`;
  if (isCurrency) return `¥${(value / 100).toFixed(2)}`;
  return value.toLocaleString();
}

function slugify(title: string): string {
  return title.toLowerCase().replace(/\s+/g, '-').replace(/[%¥]/g, '');
}

export function StatCard({ title, value, isPercentage, isCurrency, className }: StatCardProps) {
  return (
    <Card
      data-testid={`stat-card-${slugify(title)}`}
      className={className}
      styles={{ body: { padding: '12px 16px' } }}
    >
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{formatValue(value, isPercentage, isCurrency)}</p>
    </Card>
  );
}
