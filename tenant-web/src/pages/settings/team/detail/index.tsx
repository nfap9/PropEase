/**
 * TeamDetailPage - 团队详情设置入口
 *
 * 职责：组合视图组件。
 */
import { PermissionPageGuard } from '@/components/layout/permission-page-guard';
import { TeamDetailView } from './team-detail-view';

export default function TeamDetailPage() {
  return (
    <PermissionPageGuard>
      <TeamDetailView />
    </PermissionPageGuard>
  );
}
