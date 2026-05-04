/**
 * PermissionsPage - 权限管理入口
 *
 * 职责：组合视图组件，权限检查。
 */
import { PermissionPageGuard } from '@/components/layout/permission-page-guard';
import { useAuth } from '@/contexts/auth';
import { Shield } from 'lucide-react';
import { PermissionsView } from './list';

export default function PermissionsPage() {
  const { organization } = useAuth();

  if (!organization) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground">请先选择一个团队</p>
      </div>
    );
  }

  return (
    <PermissionPageGuard>
      <PermissionsView />
    </PermissionPageGuard>
  );
}
