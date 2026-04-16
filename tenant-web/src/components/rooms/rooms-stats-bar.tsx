
import { Room } from '@/types';
import { Home, Users, CheckCircle, Wrench } from 'lucide-react';

interface RoomsStatsBarProps {
  rooms: Room[];
}

export function RoomsStatsBar({ rooms }: RoomsStatsBarProps) {
  const stats = {
    total: rooms.length,
    occupied: rooms.filter((r) => r.status === 'occupied').length,
    available: rooms.filter((r) => r.status === 'available').length,
    maintenance: rooms.filter((r) => r.status === 'maintenance').length,
  };

  const occupancyRate = stats.total > 0
    ? Math.round((stats.occupied / stats.total) * 100)
    : 0;

  return (
    <div className="relative overflow-hidden rounded-xl border border-black/5 bg-gradient-to-r from-stone-50 via-white to-stone-50 shadow-sm">
      {/* Subtle texture overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative flex flex-wrap items-center gap-4 px-4 py-3 sm:gap-6 sm:px-5">
        {/* Main stat - Total */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-stone-900 text-white shadow-sm">
            <Home className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xl font-semibold tracking-tight text-stone-900">
              {stats.total}
            </div>
            <div className="text-[10px] text-stone-500">总房间数</div>
          </div>
        </div>

        {/* Status stats */}
        <div className="flex flex-wrap gap-3 sm:gap-4">
          <StatusStat
            icon={<Users className="h-3.5 w-3.5" />}
            value={stats.occupied}
            label="已出租"
            colorClass="text-blue-600"
            bgClass="bg-blue-50"
            iconClass="text-blue-500"
          />
          <StatusStat
            icon={<CheckCircle className="h-3.5 w-3.5" />}
            value={stats.available}
            label="空置"
            colorClass="text-emerald-600"
            bgClass="bg-emerald-50"
            iconClass="text-emerald-500"
          />
          <StatusStat
            icon={<Wrench className="h-3.5 w-3.5" />}
            value={stats.maintenance}
            label="维修中"
            colorClass="text-amber-600"
            bgClass="bg-amber-50"
            iconClass="text-amber-500"
          />
        </div>

        {/* Occupancy rate - right aligned */}
        <div className="ml-auto flex items-center gap-2">
          <div className="text-right">
            <div className="text-xs font-medium text-stone-900">出租率</div>
            <div className="text-[10px] text-stone-500">{occupancyRate}%</div>
          </div>
          <OccupancyRing rate={occupancyRate} />
        </div>
      </div>
    </div>
  );
}

function StatusStat({
  icon,
  value,
  label,
  colorClass,
  bgClass,
  iconClass,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  colorClass: string;
  bgClass: string;
  iconClass: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`flex h-7 w-7 items-center justify-center rounded-md ${bgClass}`}>
        <span className={iconClass}>{icon}</span>
      </div>
      <div>
        <div className={`text-base font-semibold ${colorClass}`}>{value}</div>
        <div className="text-[10px] text-stone-500">{label}</div>
      </div>
    </div>
  );
}

function OccupancyRing({ rate }: { rate: number }) {
  const circumference = 2 * Math.PI * 14;
  const strokeDashoffset = circumference - (rate / 100) * circumference;

  return (
    <div className="relative h-10 w-10">
      <svg className="h-10 w-10 -rotate-90 transform" viewBox="0 0 36 36">
        {/* Background ring */}
        <circle
          cx="18"
          cy="18"
          r="14"
          fill="none"
          stroke="#e7e5e4"
          strokeWidth="3"
        />
        {/* Progress ring */}
        <circle
          cx="18"
          cy="18"
          r="14"
          fill="none"
          stroke="#1c1917"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-semibold text-stone-900">{rate}%</span>
      </div>
    </div>
  );
}
