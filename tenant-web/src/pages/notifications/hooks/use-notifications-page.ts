import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { NotificationCategory } from '@apartment-ultra/api-contract';
import { useAuth } from '@/contexts/auth';
import { usePermissions } from '@/hooks/use-permissions';
import { canAccessRule } from '@/utils/permission-access';
import { notificationsApi, type Notification } from '@/api/notifications';
import { getNotificationTarget } from '@/utils/notifications';

export function useNotificationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { organization } = useAuth();
  const { permissions, hasPermission } = usePermissions();

  const canAccessNotifications = canAccessRule(
    { requiresOrganization: true, requireAnyPermission: true },
    {
      organization,
      permissions,
      hasPermission,
    },
  );

  const [statusFilter, setStatusFilter] = useState<'all' | 'unread'>('all');
  const [categoryFilter, setCategoryFilter] = useState<NotificationCategory | 'all'>('all');

  const { data: list = [], isLoading: listLoading } = useQuery({
    queryKey: ['notifications', 'list', statusFilter, categoryFilter],
    queryFn: () =>
      notificationsApi.list({
        status: statusFilter,
        category: categoryFilter,
      }),
    enabled: canAccessNotifications,
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsApi.getUnreadCount(),
    enabled: canAccessNotifications,
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

  const handleMarkRead = (id: string) => {
    markReadMutation.mutate(id);
  };

  const handleOpen = (item: Notification) => {
    const target = getNotificationTarget(item);
    if (!target) return;
    if (item.is_read) {
      navigate(target);
      return;
    }
    markReadMutation.mutate(item.id, {
      onSettled: () => navigate(target),
    });
  };

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate();
  };

  return {
    list,
    listLoading,
    unreadCount,
    canAccessNotifications,
    statusFilter,
    categoryFilter,
    setStatusFilter,
    setCategoryFilter,
    handleMarkRead,
    handleOpen,
    handleMarkAllRead,
    markingId: markReadMutation.variables,
    isMarkingAll: markAllReadMutation.isPending,
  };
}
