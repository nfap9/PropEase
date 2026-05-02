
import { format } from 'date-fns';
import type { Apartment } from '@/types';
import type { RoomStats } from '@/types';
import { RoomStatsCard } from './apartment-room-stats';

interface ApartmentOverviewTabProps {
  apartment: Apartment;
  stats: RoomStats;
}

export function ApartmentOverviewTab({
  apartment,
  stats,
}: ApartmentOverviewTabProps) {
  const hasPropertyInfo = apartment.floors || apartment.land_area || apartment.total_area;
  const hasUpstreamInfo = apartment.landlord_name || apartment.landlord_contact || apartment.contract_start || apartment.contract_end || apartment.landlord_rent;

  return (
    <div className="space-y-4">
      {/* 房间状态 - 全宽 */}
      <RoomStatsCard stats={stats} />

      {/* 物业信息 */}
      {hasPropertyInfo && (
        <>
          <SectionDivider label="物业信息" />
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
            {apartment.floors && <InfoItem label="楼层" value={`${apartment.floors} 层`} />}
            {apartment.total_area && <InfoItem label="总面积" value={`${apartment.total_area} ㎡`} />}
            {apartment.land_area && <InfoItem label="用地面积" value={`${apartment.land_area} 亩`} />}
          </div>
        </>
      )}

      {/* 上游信息 */}
      {hasUpstreamInfo && (
        <>
          <SectionDivider label="上游信息" />
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
            {apartment.landlord_name && <InfoItem label="房东姓名" value={apartment.landlord_name} />}
            {apartment.landlord_contact && <InfoItem label="联系方式" value={apartment.landlord_contact} />}
            {apartment.contract_start && (
              <InfoItem label="合同开始" value={format(new Date(apartment.contract_start), 'yyyy-MM-dd')} />
            )}
            {apartment.contract_end && (
              <InfoItem label="合同结束" value={format(new Date(apartment.contract_end), 'yyyy-MM-dd')} />
            )}
            {apartment.landlord_rent && (
              <InfoItem label="房东租金" value={`¥${apartment.landlord_rent}/月`} />
            )}
          </div>
        </>
      )}
    </div>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="relative py-2">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-dashed border-gray-200" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-white px-3 text-xs text-gray-500">{label}</span>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-gray-500">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
