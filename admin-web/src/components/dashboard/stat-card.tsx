import { Card, CardHeader, CardContent } from '@apartment-ultra/shared-ui/components/ui';
import { cn } from '@/utils';

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
      className={cn('transition-shadow hover:shadow-sm', className)}
    >
      <CardHeader className="pb-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{formatValue(value, isPercentage, isCurrency)}</p>
      </CardContent>
    </Card>
  );
}
