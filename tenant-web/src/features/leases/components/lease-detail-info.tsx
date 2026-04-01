'use client';

import { Badge } from '@apartment-ultra/shared-ui/components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@apartment-ultra/shared-ui/components/ui';
import { formatDate } from '@/lib/date-utils';
import { LEASE_STATUS_CONFIG } from '@/lib/status-config';
import type { Lease, LeaseFeeItem } from '@apartment-ultra/api-contract';

/** 包含 fee_items 的 Lease 扩展类型（直接输入模式） */
type FeeCycle = 'monthly' | 'quarterly' | 'yearly' | 'one_time';

interface LeaseWithFeeItems extends Lease {
  fee_items?: Array<{
    id: string;
    lease_id: string;
    fee_type_id: string | null;
    fee_category: string;
    fee_name: string;
    fee_amount: number;
    fee_cycle: FeeCycle;
    quantity: number;
    notes: string | null;
  }>;
}

interface LeaseDetailInfoProps {
  lease: Lease;
  orgId: string;
}

export function LeaseDetailInfo({ lease, orgId }: LeaseDetailInfoProps) {
  const leaseWithFeeItems = lease as LeaseWithFeeItems;
  const statusConfig = lease.is_active
    ? LEASE_STATUS_CONFIG.active
    : LEASE_STATUS_CONFIG.inactive;

  return (
    <div className="grid gap-4">
      {/* 基本信息卡片 */}
      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <dt className="text-sm text-muted-foreground">公寓</dt>
              <dd className="font-medium">{lease.room?.apartment?.name || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">房间</dt>
              <dd className="font-medium">{lease.room?.room_number || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">租客</dt>
              <dd className="font-medium">{lease.tenant?.name || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">状态</dt>
              <dd>
                <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">开始日期</dt>
              <dd className="font-medium">{formatDate(lease.start_date)}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">结束日期</dt>
              <dd className="font-medium">
                {lease.end_date ? formatDate(lease.end_date) : '长期'}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">月租</dt>
              <dd className="font-medium">¥{Number(lease.monthly_rent).toLocaleString()}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">押金</dt>
              <dd className="font-medium">¥{Number(lease.deposit || 0).toLocaleString()}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">水费单价</dt>
              <dd className="font-medium">
                ¥{Number(lease.water_rate || 0).toLocaleString()}/吨
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">电费单价</dt>
              <dd className="font-medium">
                ¥{Number(lease.electricity_rate || 0).toLocaleString()}/度
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">账单日</dt>
              <dd className="font-medium">每月 {lease.billing_day || 1} 日</dd>
            </div>
            {lease.notes && (
              <div className="col-span-2">
                <dt className="text-sm text-muted-foreground">备注</dt>
                <dd className="font-medium">{lease.notes}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* 费用项目 */}
      <Card>
        <CardHeader>
          <CardTitle>费用项目</CardTitle>
        </CardHeader>
        <CardContent>
          {leaseWithFeeItems.fee_items && leaseWithFeeItems.fee_items.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b">
                  <th className="pb-2 font-medium">费用名称</th>
                  <th className="pb-2 font-medium text-right">金额</th>
                  <th className="pb-2 font-medium text-center">周期</th>
                  <th className="pb-2 font-medium text-right">备注</th>
                </tr>
              </thead>
              <tbody>
                {leaseWithFeeItems.fee_items.map((item) => {
                  const cycleLabels: Record<string, string> = {
                    monthly: '每月',
                    quarterly: '每季',
                    yearly: '每年',
                    one_time: '一次性',
                  };
                  const cycle = cycleLabels[item.fee_cycle] || item.fee_cycle;
                  return (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="py-2 font-medium">{item.fee_name}</td>
                      <td className="py-2 text-right">¥{Number(item.fee_amount).toLocaleString()}</td>
                      <td className="py-2 text-center text-muted-foreground">{cycle}</td>
                      <td className="py-2 text-right text-muted-foreground">{item.notes || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-muted-foreground">暂无费用项目</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
