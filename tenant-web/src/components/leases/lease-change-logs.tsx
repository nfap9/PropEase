
import { formatDate } from '@/utils/date';
import type { LeaseChangeLog } from '@/api/leases';
import { Badge } from '@apartment-ultra/shared-ui/components/ui';
import { Card, CardContent } from '@apartment-ultra/shared-ui/components/ui';
import { ArrowRight, Calendar, User } from 'lucide-react';

const CHANGE_TYPE_LABELS: Record<string, string> = {
  room_change: '换房',
  renew: '续约',
  update_tenant: '编辑租客',
  rent_change: '房租变更',
  utility_rate_change: '水电单价变更',
  deposit_change: '押金变更',
  fee_items_update: '费用项目变更',
  settle: '退租结算',
};

const CHANGE_TYPE_VARIANTS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  room_change: 'secondary',
  renew: 'secondary',
  update_tenant: 'outline',
  rent_change: 'default',
  utility_rate_change: 'default',
  deposit_change: 'outline',
  fee_items_update: 'default',
  settle: 'destructive',
};

interface ChangeDetail {
  label: string;
  oldValue?: string | number;
  newValue?: string | number;
}

function formatChangeContent(log: LeaseChangeLog): ChangeDetail[] {
  const oldVal = log.old_value as Record<string, unknown> | null;
  const newVal = log.new_value as Record<string, unknown> | null;

  if (!oldVal && !newVal) return [];

  const details: ChangeDetail[] = [];

  switch (log.change_type) {
    case 'room_change':
      if (oldVal?.old_room_id && newVal?.new_room_id) {
        details.push({ label: '房间', oldValue: oldVal.old_room_id as string, newValue: newVal.new_room_id as string });
      }
      if (oldVal?.change_date || newVal?.change_date) {
        details.push({ label: '变更日期', oldValue: oldVal?.change_date as string, newValue: newVal?.change_date as string });
      }
      break;

    case 'renew':
      if (oldVal?.old_end_date && newVal?.new_end_date) {
        details.push({ label: '结束日期', oldValue: oldVal.old_end_date as string, newValue: newVal.new_end_date as string });
      }
      break;

    case 'update_tenant':
      if (oldVal?.old_tenant_id && newVal?.new_tenant_id) {
        details.push({ label: '租客', oldValue: oldVal.old_tenant_id as string, newValue: newVal.new_tenant_id as string });
      }
      break;

    case 'rent_change':
      if (oldVal?.old_rent !== undefined && newVal?.new_rent !== undefined) {
        details.push({ label: '月租', oldValue: `¥${oldVal.old_rent}`, newValue: `¥${newVal.new_rent}` });
      }
      break;

    case 'utility_rate_change':
      if (oldVal?.old_water_rate !== undefined || newVal?.new_water_rate !== undefined) {
        details.push({
          label: '水费单价',
          oldValue: oldVal ? `¥${oldVal.old_water_rate}/吨` : undefined,
          newValue: newVal ? `¥${newVal.new_water_rate}/吨` : undefined,
        });
      }
      if (oldVal?.old_electricity_rate !== undefined || newVal?.new_electricity_rate !== undefined) {
        details.push({
          label: '电费单价',
          oldValue: oldVal ? `¥${oldVal.old_electricity_rate}/度` : undefined,
          newValue: newVal ? `¥${newVal.new_electricity_rate}/度` : undefined,
        });
      }
      break;

    case 'deposit_change':
      if (oldVal?.old_deposit !== undefined && newVal?.new_deposit !== undefined) {
        details.push({ label: '押金', oldValue: `¥${oldVal.old_deposit}`, newValue: `¥${newVal.new_deposit}` });
      }
      break;

    case 'fee_items_update':
      if (oldVal?.fee_items || newVal?.fee_items) {
        const oldItems = (oldVal?.fee_items as Array<{ fee_name: string; fee_amount: number; fee_cycle: string; notes?: string }>) || [];
        const newItems = (newVal?.fee_items as Array<{ fee_name: string; fee_amount: number; fee_cycle: string; notes?: string }>) || [];

        // 比较新旧费用项目
        const cycleLabels: Record<string, string> = {
          monthly: '每月',
          quarterly: '每季',
          yearly: '每年',
          one_time: '一次性',
        };

        // 显示新增或变更的项目
        const addedOrChanged = newItems.filter((newItem) => {
          const oldItem = oldItems.find((o) => o.fee_name === newItem.fee_name);
          return !oldItem || oldItem.fee_amount !== newItem.fee_amount || oldItem.fee_cycle !== newItem.fee_cycle;
        });

        // 显示删除的项目
        const removed = oldItems.filter((oldItem) => {
          return !newItems.some((n) => n.fee_name === oldItem.fee_name);
        });

        if (addedOrChanged.length > 0) {
          const itemsText = addedOrChanged.map((item) => {
            const cycle = cycleLabels[item.fee_cycle] || item.fee_cycle;
            return `${item.fee_name} ¥${item.fee_amount}/${cycle}`;
          }).join('、');
          details.push({ label: '新增/变更', newValue: itemsText });
        }

        if (removed.length > 0) {
          const itemsText = removed.map((item) => {
            const cycle = cycleLabels[item.fee_cycle] || item.fee_cycle;
            return `${item.fee_name} ¥${item.fee_amount}/${cycle}`;
          }).join('、');
          details.push({ label: '删除', oldValue: itemsText });
        }
      }
      break;

    case 'settle':
      if (oldVal?.penalty_amount !== undefined) {
        details.push({ label: '违约金', oldValue: `¥${oldVal.penalty_amount}` });
      }
      if (newVal?.bill_id) {
        details.push({ label: '结算单', newValue: '已生成' });
      }
      break;

    default:
      // 通用格式：显示所有变化的字段
      if (oldVal && newVal) {
        const allKeys = new Set([...Object.keys(oldVal), ...Object.keys(newVal)]);
        allKeys.forEach((key) => {
          if (oldVal[key] !== newVal[key]) {
            details.push({
              label: key,
              oldValue: String(oldVal[key] ?? '-'),
              newValue: String(newVal[key] ?? '-'),
            });
          }
        });
      }
  }

  return details;
}

interface LeaseChangeLogsProps {
  logs: LeaseChangeLog[];
}

export function LeaseChangeLogs({ logs }: LeaseChangeLogsProps) {
  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
        <p>暂无变更记录</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {logs.map((log) => {
        const changeDetails = formatChangeContent(log);
        return (
          <Card key={log.id}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={CHANGE_TYPE_VARIANTS[log.change_type] || 'default'}>
                      {CHANGE_TYPE_LABELS[log.change_type] || log.change_type}
                    </Badge>
                    {log.effective_from_year && log.effective_from_month && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {log.effective_from_year} 年 {log.effective_from_month} 月生效
                      </span>
                    )}
                  </div>

                  {/* 变更内容详情 */}
                  {changeDetails.length > 0 && (
                    <div className="space-y-1">
                      {changeDetails.map((detail, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground w-20">{detail.label}：</span>
                          {detail.oldValue !== undefined && (
                            <span className="text-muted-foreground bg-muted px-2 py-0.5 rounded">
                              {detail.oldValue}
                            </span>
                          )}
                          {detail.oldValue !== undefined && detail.newValue !== undefined && (
                            <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          )}
                          {detail.newValue !== undefined && (
                            <span className="text-foreground bg-muted px-2 py-0.5 rounded">
                              {detail.newValue}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {log.reason && (
                    <p className="text-sm text-muted-foreground">原因：{log.reason}</p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {log.created_by || '系统'}
                    </span>
                    <span>{formatDate(log.created_at)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
