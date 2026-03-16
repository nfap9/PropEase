'use client';

import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/main-layout';
import { AuthGuard } from '@/components/layout/auth-guard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { notificationsApi, type Notification } from '@/lib/api/notifications';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/lib/date-utils';

// 注意: 实际使用时从 testids 导入 NOTIFICATIONS 常量
const NOTIFICATIONS = {
  HEADING: 'notifications-heading',
  MARK_ALL_READ_BTN: 'notifications-mark-all-read-btn',
  LIST: 'notifications-list',
  EMPTY_STATE: 'notifications-empty-state',
  MARK_READ_BTN: 'notifications-mark-read-btn',
  UNREAD_INDICATOR: 'notifications-unread-indicator',
} as const;

const notificationTypeLabelMap: Record<string, string> = {
  lease_expiring: '合同到期',
  rent_due_reminder: '交租提醒',
  bill_overdue: '逾期催缴',
  tenant_move_in: '新租客入住',
  tenant_move_out: '租客退租',
};

function getNotificationTypeLabel(type?: string | null): string {
  if (!type) return '系统通知';
  return notificationTypeLabelMap[type] ?? '系统通知';
}

function getNotificationTarget(item: Notification): string | null {
  switch (item.type) {
    case 'lease_expiring':
    case 'tenant_move_in':
    case 'tenant_move_out':
      return '/leases';
    case 'bill_overdue':
    case 'rent_due_reminder':
      return '/bills';
    default:
      return null;
  }
}

export default function NotificationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: list = [], isLoading: listLoading } = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: () => notificationsApi.list(),
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsApi.getUnreadCount(),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return (
    <AuthGuard>
      <MainLayout>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-8 w-8" />
              <div>
                <h1 className="text-3xl font-bold" data-testid={NOTIFICATIONS.HEADING}>通知</h1>
                <p className="text-muted-foreground">查看系统通知与消息</p>
              </div>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
                data-testid={NOTIFICATIONS.MARK_ALL_READ_BTN}
              >
                <CheckCheck className="mr-2 h-4 w-4" />
                全部标已读
              </Button>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">通知列表</CardTitle>
            </CardHeader>
            <CardContent>
              {listLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : list.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground" data-testid={NOTIFICATIONS.EMPTY_STATE}>暂无通知</p>
              ) : (
                <ul className="divide-y" data-testid={NOTIFICATIONS.LIST}>
                  {list.map((item) => (
                    <NotificationItem
                      key={item.id}
                      item={item}
                      onMarkRead={() => markReadMutation.mutate(item.id)}
                      onOpen={() => {
                        const target = getNotificationTarget(item);
                        if (!target) return;
                        if (item.is_read) {
                          router.push(target);
                          return;
                        }
                        markReadMutation.mutate(item.id, {
                          onSettled: () => router.push(target),
                        });
                      }}
                      isMarking={
                        markReadMutation.isPending && markReadMutation.variables === item.id
                      }
                      testids={NOTIFICATIONS}
                    />
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    </AuthGuard>
  );
}

function NotificationItem({
  item,
  onMarkRead,
  onOpen,
  isMarking,
  testids,
}: {
  item: Notification;
  onMarkRead: () => void;
  onOpen: () => void;
  isMarking: boolean;
  testids: Record<string, string>;
}) {
  const typeLabel = getNotificationTypeLabel(item.type);
  const target = getNotificationTarget(item);

  return (
    <li
      className={cn('flex flex-col gap-1 py-4 transition-colors', !item.is_read && 'bg-muted/50')}
      data-testid={!item.is_read ? testids.UNREAD_INDICATOR : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className={cn('font-medium', !item.is_read && 'text-foreground')}>{item.title}</p>
            <Badge variant="outline">{typeLabel}</Badge>
          </div>
          {item.content && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.content}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(item.created_at)}</p>
        </div>
        <div className="flex items-center gap-1">
          {target && (
            <Button variant="ghost" size="sm" onClick={onOpen}>
              查看业务
            </Button>
          )}
          {!item.is_read && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMarkRead}
              disabled={isMarking}
              data-testid={testids.MARK_READ_BTN}
            >
              {isMarking ? '处理中…' : '标为已读'}
            </Button>
          )}
        </div>
      </div>
    </li>
  );
}
