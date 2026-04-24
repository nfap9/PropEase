import React from 'react';
import { BellOff } from 'lucide-react';

const NOTIFICATIONS = {
  EMPTY_STATE: 'notifications-empty-state',
} as const;

export function NotificationsEmptyState() {
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
