import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@apartment-ultra/shared-ui/components/ui';
import { PermissionPageGuard } from '@/components/layout/permission-page-guard';

const TEAM_LAYOUT_TABS = {
  INFO_TAB: 'team-info-tab',
  MEMBERS_TAB: 'team-members-tab',
} as const;

export default function TeamSettingsLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  // 根据当前路径确定激活的 Tab
  const activeTab = location.pathname.includes('/members') ? 'members' : 'info';

  const handleTabChange = (value: string) => {
    if (value === 'info') {
      navigate('/workspace/team/info');
    } else if (value === 'members') {
      navigate('/workspace/team/members');
    }
  };

  return (
    <PermissionPageGuard>
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList>
          <TabsTrigger value="info" data-testid={TEAM_LAYOUT_TABS.INFO_TAB}>
            团队信息
          </TabsTrigger>
          <TabsTrigger value="members" data-testid={TEAM_LAYOUT_TABS.MEMBERS_TAB}>
            成员管理
          </TabsTrigger>
        </TabsList>

        <Outlet />
      </Tabs>
    </PermissionPageGuard>
  );
}
