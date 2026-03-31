'use client';

import { Badge } from '@apartment-ultra/shared-ui/components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@apartment-ultra/shared-ui/components/ui';
import { formatDate } from '@/lib/date-utils';
import { LEASE_STATUS_CONFIG } from '@/lib/status-config';
import type { Lease } from '@/types';

interface LeaseFeeItem {
  id: string;
  fee_type_id: string;
  specification_id: string | null;
  quantity: number;
  feeType?: { name: string };
  specification?: { name: string };
}

/** 包含 fee_items 的 Lease 扩展类型（待 api-contract 更新后移除） */
interface LeaseWithFeeItems extends Lease {
  fee_items?: LeaseFeeItem[];
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

      {/* 费用项目摘要 */}
      <Card>
        <CardHeader>
          <CardTitle>费用项目</CardTitle>
        </CardHeader>
        <CardContent>
          {leaseWithFeeItems.fee_items && leaseWithFeeItems.fee_items.length > 0 ? (
            <ul className="space-y-2">
              {leaseWithFeeItems.fee_items.map((item) => (
                <li key={item.id} className="flex justify-between text-sm">
                  <span>
                    {item.feeType?.name}
                    {item.specification && ` - ${item.specification.name}`}
                  </span>
                  <span className="text-muted-foreground">
                    × {item.quantity}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">暂无费用项目</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
