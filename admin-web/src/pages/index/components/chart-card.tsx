import { Card, CardHeader, CardContent } from '@apartment-ultra/shared-ui/components/ui';

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
}

export function ChartCard({ title, children }: ChartCardProps) {
  return (
    <Card>
      <CardHeader>
        <p className="text-xl font-semibold">{title}</p>
      </CardHeader>
      <CardContent className="p-6">{children}</CardContent>
    </Card>
  );
}
