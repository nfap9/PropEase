/**
 * NotificationsView - 通知列表视图
 *
 * 自包含视图，内部管理：
 * - 状态筛选、分类筛选状态
 * - 标记已读、全部标记已读
 */
import React from 'react';
import { Button } from 'antd';
import { CheckCheck, Loader2, BellOff, ArrowRight, Clock } from 'lucide-react';
import { cn } from '@/utils';
import { formatDateTime, formatRelativeTime } from '@/utils/date';
import { tenantMessages } from '@/i18n';
import {
  getNotificationTypeLabel,
  getNotificationCategory,
  getNotificationCategoryLabel,
} from '@/utils/notifications';
import { NOTIFICATION_CATEGORY_OPTIONS } from '@/constants/notifications';
import type { NotificationCategory } from '@apartment-ultra/api-contract';
import type { Notification } from '@/api/notifications';
import { FilterPill } from '../components/filter-pill';

const NOTIFICATIONS = {
  HEADING: 'notifications-heading',
  MARK_ALL_READ_BTN: 'notifications-mark-all-read-btn',
  LIST: 'notifications-list',
  EMPTY_STATE: 'notifications-empty-state',
  MARK_READ_BTN: 'notifications-mark-read-btn',
  UNREAD_INDICATOR: 'notifications-unread-indicator',
} as const;

const categoryColors: Record<NotificationCategory, string> = {
  lease: 'bg-amber-500',
  billing: 'bg-emerald-500',
  tenant: 'bg-violet-500',
  system: 'bg-slate-400',
};

interface NotificationsViewProps {
  list: Notification[];
  listLoading: boolean;
  unreadCount: number;
  canAccessNotifications: boolean;
  statusFilter: 'all' | 'unread';
  categoryFilter: NotificationCategory | 'all';
  setStatusFilter: (v: 'all' | 'unread') => void;
  setCategoryFilter: (v: NotificationCategory | 'all') => void;
  markingId: string | undefined;
  isMarkingAll: boolean;
  handleMarkRead: (id: string) => void;
  handleOpen: (item: Notification) => void;
  handleMarkAllRead: () => void;
}

export function NotificationsView({
  list,
  listLoading,
  unreadCount,
  statusFilter,
  categoryFilter,
  setStatusFilter,
  setCategoryFilter,
  markingId,
  isMarkingAll,
  handleMarkRead,
  handleOpen,
  handleMarkAllRead,
}: NotificationsViewProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="mx-auto max-w-4xl">
        <div className="mb-4 flex items-start justify-end">
          {unreadCount > 0 && (
            <Button
              type="default"
              className="gap-2"
              onClick={handleMarkAllRead}
              disabled={isMarkingAll}
              data-testid={NOTIFICATIONS.MARK_ALL_READ_BTN}
            >
              <CheckCheck className="h-4 w-4" />
              {tenantMessages.notificationsPage.markAllRead}
            </Button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-full bg-card p-1 shadow-sm ring-1 ring-border">
            <FilterPill
              active={statusFilter === 'all'}
              onClick={() => setStatusFilter('all')}
            >
              全部
            </FilterPill>
            <FilterPill
              active={statusFilter === 'unread'}
              onClick={() => setStatusFilter('unread')}
            >
              <span className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  {unreadCount > 0 && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                  )}
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
                </span>
                未读
              </span>
            </FilterPill>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex flex-wrap gap-1.5">
            {NOTIFICATION_CATEGORY_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setCategoryFilter(option.value)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs font-medium transition-all',
                  categoryFilter === option.value
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-card text-muted-foreground shadow-sm ring-1 ring-border hover:bg-muted',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notification List */}
        <div className="space-y-3" data-testid={NOTIFICATIONS.LIST}>
          {listLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">加载中...</p>
            </div>
          ) : list.length === 0 ? (
            <NotificationsEmptyState />
          ) : (
            list.map((item, index) => (
              <NotificationItem
                key={item.id}
                item={item}
                index={index}
                onMarkRead={() => handleMarkRead(item.id)}
                onOpen={() => handleOpen(item)}
                isMarking={markingId === item.id}
                testids={NOTIFICATIONS}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function NotificationsEmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-2xl bg-card py-20 shadow-sm ring-1 ring-border"
      data-testid={NOTIFICATIONS.EMPTY_STATE}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <BellOff className="h-8 w-8 text-muted-foreground" />
      </div>
      <p className="mt-4 font-medium text-foreground">暂无通知</p>
      <p className="mt-1 text-sm text-muted-foreground">有新的通知时会在这里显示</p>
    </div>
  );
}

const NotificationItem = React.memo(function NotificationItem({
  item,
  onMarkRead,
  onOpen,
  isMarking,
  testids,
  index,
}: {
  item: Notification;
  onMarkRead: () => void;
  onOpen: () => void;
  isMarking: boolean;
  testids: Record<string, string>;
  index: number;
}) {
  const typeLabel = getNotificationTypeLabel(item.type);
  const category = getNotificationCategory(item);
  const actionLabel = item.type;
  const categoryColor = categoryColors[category];

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl bg-card shadow-sm ring-1 transition-all hover:shadow-md',
        item.is_read ? 'ring-border' : 'ring-border',
        !item.is_read && 'border-l-4 border-l-primary',
      )}
      style={{ animationDelay: `${index * 50}ms` }}
      data-testid={!item.is_read ? testids.UNREAD_INDICATOR : undefined}
    >
      {/* Category indicator bar */}
      <div className={cn('absolute left-0 top-0 h-full w-1', categoryColor)} />

      <div className="px-5 py-4 pl-6 sm:px-6 sm:pl-7">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            {/* Header row */}
            <div className="flex items-center gap-2">
              {!item.is_read && <span className="h-2 w-2 rounded-full bg-primary" />}
              <h3
                className={cn(
                  'font-semibold leading-tight',
                  item.is_read ? 'text-muted-foreground' : 'text-foreground',
                )}
              >
                {item.title}
              </h3>
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-medium',
                    category === 'lease' && 'bg-primary/10 text-primary',
                    category === 'billing' && 'bg-primary/10 text-primary',
                    category === 'tenant' && 'bg-primary/10 text-primary',
                    category === 'system' && 'bg-muted text-muted-foreground',
                  )}
                >
                  {getNotificationCategoryLabel(category)}
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {typeLabel}
                </span>
              </div>
            </div>

            {/* Content */}
            {item.content && (
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                {item.content}
              </p>
            )}

            {/* Footer */}
            <div className="mt-3 flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span title={formatDateTime(item.created_at)}>{formatRelativeTime(item.created_at)}</span>
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button type="text" size="small" className="gap-1" onClick={onOpen}>
              {actionLabel}
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Button>
            {!item.is_read && (
              <Button
                type="text"
                size="small"
                className="gap-1"
                onClick={onMarkRead}
                disabled={isMarking}
                data-testid={testids.MARK_READ_BTN}
              >
                {isMarking ? '处理中...' : '标为已读'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
