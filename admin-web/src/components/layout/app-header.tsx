import { useNavigate } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { Dropdown, Avatar, Button } from 'antd';
import type { MenuProps } from 'antd';
import { adminMessages } from '@/i18n';
import { adminApiEndpoints } from '@/api/admin-client';

/**
 * Header 用户菜单
 */
export function AppHeaderUserMenu() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await adminApiEndpoints.logout();
    } catch {
      // 即使失败也继续清除本地状态
    }
    localStorage.removeItem('admin_access_token');
    document.cookie = 'admin_access_token=; path=/; max-age=0; SameSite=Lax';
    navigate('/login');
  };

  const menuItems: MenuProps['items'] = [
    {
      key: 'logout',
      icon: <LogOut className="h-4 w-4" />,
      label: adminMessages.layout.logout,
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <Dropdown menu={{ items: menuItems }} placement="bottomRight" trigger={['click']}>
      <Button
        type="text"
        className="h-auto gap-2 px-2 py-1.5"
      >
        <Avatar size={28} className="bg-gray-200 text-gray-600 text-xs">
          A
        </Avatar>
      </Button>
    </Dropdown>
  );
}
