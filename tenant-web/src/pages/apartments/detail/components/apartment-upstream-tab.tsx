
import { format } from 'date-fns';
import { Card } from 'antd';
import type { Apartment } from '@/types';

export function ApartmentUpstreamTab({ apartment }: { apartment: Apartment }) {
  return (
    <Card title="上游信息" className="text-sm">
      <p className="text-xs text-gray-500 mb-4">房东和合同相关信息</p>
      <div className="grid grid-cols-2 gap-4">
        <UpstreamInfoItem label="房东姓名" value={apartment.landlord_name ?? '-'} />
        <UpstreamInfoItem label="联系方式" value={apartment.landlord_contact ?? '-'} />
        <UpstreamInfoItem
          label="合同开始"
          value={apartment.contract_start ? format(new Date(apartment.contract_start), 'yyyy-MM-dd') : '-'}
        />
        <UpstreamInfoItem
          label="合同结束"
          value={apartment.contract_end ? format(new Date(apartment.contract_end), 'yyyy-MM-dd') : '-'}
        />
        <UpstreamInfoItem
          label="房东租金"
          value={apartment.landlord_rent ? `¥${apartment.landlord_rent}/月` : '-'}
        />
      </div>
    </Card>
  );
}

function UpstreamInfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
