
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { Tabs } from 'antd';
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

  const items = [
    {
      key: 'info',
      label: '团队信息',
    },
    {
      key: 'members',
      label: '成员管理',
    },
  ];

  return (
    <PermissionPageGuard>
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={items}
        className="space-y-6"
      />

      <Outlet />
    </PermissionPageGuard>
  );
}
