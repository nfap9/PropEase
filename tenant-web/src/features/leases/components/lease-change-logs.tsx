'use client';

import { formatDate } from '@/lib/date-utils';
import type { LeaseChangeLog } from '@/lib/api/leases';
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
  fee_items_change: '费用项目变更',
  settle: '退租结算',
};

const CHANGE_TYPE_VARIANTS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  room_change: 'secondary',
  renew: 'secondary',
  update_tenant: 'outline',
  rent_change: 'default',
  utility_rate_change: 'default',
  deposit_change: 'outline',
  fee_items_change: 'default',
  settle: 'destructive',
};

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
      {logs.map((log) => (
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

                {/* 变更内容 */}
                {log.old_value && log.new_value && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
                      {JSON.stringify(log.old_value)}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-foreground font-mono bg-muted px-2 py-1 rounded">
                      {JSON.stringify(log.new_value)}
                    </span>
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
      ))}
    </div>
  );
}
