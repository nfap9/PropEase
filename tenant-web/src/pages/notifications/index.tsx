/**
 * NotificationsPage - 通知页面入口
 *
 * 职责：组合视图组件。
 */
import { PermissionPageGuard } from '@/components/layout/permission-page-guard';
import { useNotificationsPage } from './hooks/use-notifications-page';
import { NotificationsView } from './list';

export default function NotificationsPage() {
  const {
    list,
    listLoading,
    unreadCount,
    canAccessNotifications,
    statusFilter,
    categoryFilter,
    setStatusFilter,
    setCategoryFilter,
    markingId,
    isMarkingAll,
    handleMarkRead,
    handleOpen,
    handleMarkAllRead,
  } = useNotificationsPage();

  return (
    <PermissionPageGuard>
      {canAccessNotifications ? (
        <NotificationsView
          list={list}
          listLoading={listLoading}
          unreadCount={unreadCount}
          canAccessNotifications={canAccessNotifications}
          statusFilter={statusFilter}
          categoryFilter={categoryFilter}
          setStatusFilter={setStatusFilter}
          setCategoryFilter={setCategoryFilter}
          markingId={markingId}
          isMarkingAll={isMarkingAll}
          handleMarkRead={handleMarkRead}
          handleOpen={handleOpen}
          handleMarkAllRead={handleMarkAllRead}
        />
      ) : null}
    </PermissionPageGuard>
  );
}
