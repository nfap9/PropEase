import { Building2, CheckCircle2, Home, Wrench } from 'lucide-react';
import type { RoomStats } from '@/types';

interface RoomStatsCardProps {
  stats: RoomStats;
}

export function RoomStatsCard({ stats }: RoomStatsCardProps) {
  return (
    <div className="flex items-center gap-6 rounded-lg border border-gray-200 bg-white px-5 py-3">
      <StatItem icon={<Home className="h-5 w-5 text-gray-400" />} label="总房间" value={stats.total} />
      <StatItem
        icon={<CheckCircle2 className="h-5 w-5 text-blue-500" />}
        label="已出租"
        value={stats.occupied}
      />
      <StatItem
        icon={<Building2 className="h-5 w-5 text-green-500" />}
        label="空置"
        value={stats.available}
      />
      <StatItem
        icon={<Wrench className="h-5 w-5 text-orange-500" />}
        label="维修中"
        value={stats.maintenance}
      />
    </div>
  );
}

function StatItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-lg font-semibold tabular-nums">{value}</span>
    </div>
  );
}
