/**
 * ApartmentDetailPage - 公寓详情入口
 *
 * 职责：组合视图组件，权限检查。
 */
import { PermissionPageGuard } from '@/components/layout/permission-page-guard';
import { ApartmentDetailView } from './views/apartment-detail-view';

export default function ApartmentDetailPage() {
  return (
    <PermissionPageGuard>
      <ApartmentDetailView />
    </PermissionPageGuard>
  );
}
