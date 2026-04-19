
import { format } from 'date-fns';
import { Building2, CheckCircle2, Home, Wrench } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@apartment-ultra/shared-ui/components/ui';
import type { Apartment } from '@/types';
import type { RoomStats } from '@/utils/apartment-detail';

interface ApartmentOverviewTabProps {
  apartment: Apartment;
  stats: RoomStats;
}

export function ApartmentOverviewTab({
  apartment,
  stats,
}: ApartmentOverviewTabProps) {
  const occupancyRate = stats.total > 0 ? (stats.occupied / stats.total) * 100 : 0;
  const vacancyRate = stats.total > 0 ? (stats.available / stats.total) * 100 : 0;
  const hasPropertyInfo = apartment.floors || apartment.land_area || apartment.total_area;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* 统计概览 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">房间状态</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <StatItem icon={<Home className="h-4 w-4" />} label="总房间" value={stats.total} />
            <StatItem
              icon={<CheckCircle2 className="h-4 w-4" />}
              label="已出租"
              value={stats.occupied}
              className="text-blue-600"
            />
            <StatItem
              icon={<Building2 className="h-4 w-4" />}
              label="空置"
              value={stats.available}
              className="text-green-600"
            />
            <StatItem
              icon={<Wrench className="h-4 w-4" />}
              label="维修中"
              value={stats.maintenance}
              className="text-orange-600"
            />
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span>入住率 {occupancyRate.toFixed(0)}%</span>
            <span>空置率 {vacancyRate.toFixed(0)}%</span>
          </div>
        </CardContent>
      </Card>

      {/* 物业信息 */}
      {hasPropertyInfo && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">物业信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <InfoItem label="楼层" value={`${apartment.floors ?? '-'} 层`} />
            <InfoItem label="总面积" value={apartment.total_area ? `${apartment.total_area} ㎡` : '-'} />
            <InfoItem label="用地面积" value={apartment.land_area ? `${apartment.land_area} 亩` : '-'} />
          </CardContent>
        </Card>
      )}

      {/* 上游信息 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">上游信息</CardTitle>
          <CardDescription className="text-xs">房东和合同信息</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <InfoItem label="房东姓名" value={apartment.landlord_name ?? '-'} />
          <InfoItem label="联系方式" value={apartment.landlord_contact ?? '-'} />
          <InfoItem
            label="合同开始"
            value={apartment.contract_start ? format(new Date(apartment.contract_start), 'yyyy-MM-dd') : '-'}
          />
          <InfoItem
            label="合同结束"
            value={apartment.contract_end ? format(new Date(apartment.contract_end), 'yyyy-MM-dd') : '-'}
          />
          <InfoItem
            label="房东租金"
            value={apartment.landlord_rent ? `¥${apartment.landlord_rent}/月` : '-'}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function StatItem({
  icon,
  label,
  value,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-muted-foreground">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`text-lg font-semibold tabular-nums ${className ?? ''}`}>{value}</div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium truncate">{value}</span>
    </div>
  );
}
