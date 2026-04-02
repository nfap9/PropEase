'use client';

import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import type { Apartment } from '@/types';

export function ApartmentUpstreamTab({ apartment }: { apartment: Apartment }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>上游信息</CardTitle>
        <CardDescription>房东和合同相关信息</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
      </CardContent>
    </Card>
  );
}

function UpstreamInfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

