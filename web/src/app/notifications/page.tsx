'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/main-layout';
import { AuthGuard } from '@/components/layout/auth-guard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { notificationsApi, type Notification } from '@/lib/api/notifications';
import { Bell, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function NotificationsPage() {
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
              <h1 className="text-3xl font-bold">通知</h1>
              <p className="text-muted-foreground">查看系统通知与消息</p>
            </div>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
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
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : list.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">暂无通知</p>
            ) : (
              <ul className="divide-y">
                {list.map((item) => (
                  <NotificationItem
                    key={item.id}
                    item={item}
                    onMarkRead={() => markReadMutation.mutate(item.id)}
                    isMarking={markReadMutation.isPending && markReadMutation.variables === item.id}
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
  isMarking,
}: {
  item: Notification;
  onMarkRead: () => void;
  isMarking: boolean;
}) {
  return (
    <li
      className={cn(
        'flex flex-col gap-1 py-4 transition-colors',
        !item.is_read && 'bg-muted/50'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className={cn('font-medium', !item.is_read && 'text-foreground')}>{item.title}</p>
          {item.body && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{item.body}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            {new Date(item.created_at).toLocaleString('zh-CN')}
          </p>
        </div>
        {!item.is_read && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMarkRead}
            disabled={isMarking}
          >
            {isMarking ? '处理中…' : '标为已读'}
          </Button>
        )}
      </div>
    </li>
  );
}
