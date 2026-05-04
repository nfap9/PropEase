/**
 * ReportsPage - 报表页面入口
 *
 * 职责：组合视图组件，权限检查。
 */
import { PermissionPageGuard } from '@/components/layout/permission-page-guard';
import { Skeleton } from 'antd';
import { Building2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth';
import { ReportsView } from './list';

function ReportsFallback() {
  return (
    <div className="space-y-6">
      <Skeleton.Input active size="large" style={{ width: 200, height: 32 }} />
      <Skeleton active paragraph={{ rows: 10 }} />
    </div>
  );
}

export default function ReportsPage() {
  const { organization, isLoading: authLoading } = useAuth();

  if (authLoading) {
    return <ReportsFallback />;
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
      <ReportsView />
    </PermissionPageGuard>
  );
}
