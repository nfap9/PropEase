/**
 * ApartmentsPage - 公寓列表入口
 *
 * 职责：组合视图组件，权限检查。
 */
import { PermissionPageGuard } from '@/components/layout/permission-page-guard';
import { useAuth } from '@/contexts/auth';
import { Skeleton } from 'antd';
import { Building2 } from 'lucide-react';
import { ApartmentsListView } from './list';

export default function ApartmentsPage() {
  const { organization, isLoading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="space-y-page">
        <Skeleton.Input active size="large" style={{ width: 200, height: 32 }} />
        <div className="grid gap-card-gap md:grid-cols-2 lg:grid-cols-3">
          <Skeleton active className="h-48" />
          <Skeleton active className="h-48" />
          <Skeleton active className="h-48" />
        </div>
      </div>
    );
  }

  if (!organization?.id) {
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-4">
        <Building2 className="h-16 w-16 text-gray-400" />
        <h2 className="text-xl font-semibold">请先创建或加入团队</h2>
        <p className="text-gray-500">在顶部导航栏选择或创建一个团队开始使用</p>
      </div>
    );
  }

  return (
    <PermissionPageGuard>
      <ApartmentsListView />
    </PermissionPageGuard>
  );
}
