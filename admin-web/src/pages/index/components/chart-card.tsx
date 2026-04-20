
import { Card } from 'antd';

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
}

export function ChartCard({ title, children }: ChartCardProps) {
  return (
    <Card styles={{ body: { padding: 0 } }}>
      <div className="px-4 py-3 border-b">
        <p className="text-xl font-semibold text-gray-900">{title}</p>
      </div>
      <div className="p-6">{children}</div>
    </Card>
  );
}
