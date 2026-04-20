
import type { MenuProps } from 'antd';
import { Dropdown, Tag } from 'antd';
import { Button } from 'antd';
import { formatDateTime } from '@/utils/date';
import { ORG_STATUS_CONFIG } from '@/utils/status';
import { MoreHorizontal, Pencil, KeyRound, Trash2 } from 'lucide-react';

interface CreateAdminUsersColumnsOptions {
  onEdit: (user: any) => void;
  onResetPassword: (user: any) => void;
  onDelete: (user: any) => void;
}

const statusColorMap: Record<string, string> = {
  success: 'success',
  warning: 'warning',
  destructive: 'error',
  default: 'default',
  info: 'processing',
};

export function createAdminUsersColumns({
  onEdit,
  onResetPassword,
  onDelete,
}: CreateAdminUsersColumnsOptions) {
  return [
    { title: '用户名', dataIndex: 'username', key: 'username', width: 140 },
    { title: '姓名', dataIndex: 'name', key: 'name', width: 120 },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 200,
      render: (email: any) => email ?? '—',
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      render: (_: any, user: any) => {
        const config = user.is_active ? ORG_STATUS_CONFIG.active : ORG_STATUS_CONFIG.inactive;
        return <Tag color={statusColorMap[config.variant] || 'default'}>{config.label}</Tag>;
      },
    },
    {
      title: '最后登录',
      dataIndex: 'last_login_at',
      key: 'last_login_at',
      width: 180,
      render: (last_login_at: any) => last_login_at ? formatDateTime(last_login_at) : '—',
    },
    {
      title: '操作',
      key: 'actions',
      width: 80,
      render: (_: any, user: any) => {
        const menuItems: MenuProps['items'] = [
          {
            key: 'edit',
            icon: <Pencil className="h-4 w-4" />,
            label: '编辑',
            onClick: () => onEdit(user),
          },
          {
            key: 'reset',
            icon: <KeyRound className="h-4 w-4" />,
            label: '重置密码',
            onClick: () => onResetPassword(user),
          },
          ...(!user.is_system ? [{
            key: 'delete',
            icon: <Trash2 className="h-4 w-4" />,
            label: '删除',
            danger: true,
            onClick: () => onDelete(user),
          }] : []),
        ];

        return (
          <Dropdown menu={{ items: menuItems }} trigger={['click']}>
            <Button type="text" size="small">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </Dropdown>
        );
      },
    },
  ];
}
