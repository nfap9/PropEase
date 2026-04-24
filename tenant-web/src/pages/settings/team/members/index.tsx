/**
 * TeamMembersPage - 团队成员管理入口
 *
 * 职责：组合视图组件。
 */
import { PermissionPageGuard } from '@/components/layout/permission-page-guard';
import { TeamMembersView } from './views/team-members-view';

export default function TeamMembersPage() {
  return (
    <PermissionPageGuard>
      <TeamMembersView />
    </PermissionPageGuard>
  );
}
