/**
 * RoomsPage - 房间页面入口
 *
 * 职责：组合各组件，处理跨组件协调。
 * - 退租成功：需刷新账单/租约数据，由父组件协调
 * - 权限检查在入口处进行
 */
import { PermissionPageGuard } from '@/components/layout/permission-page-guard';
import { useAuth } from '@/contexts/auth';
import { Skeleton } from 'antd';
import { RoomsListView } from './list';

export default function RoomsPage() {
  const { organization, isLoading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <PermissionPageGuard>
      <RoomsListView />
    </PermissionPageGuard>
  );
}
