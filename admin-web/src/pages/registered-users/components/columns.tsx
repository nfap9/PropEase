
import type { MenuProps } from 'antd';
import { Dropdown, Tag } from 'antd';
import { Button } from 'antd';
import { formatDateTime } from '@/utils/date';
import { ORG_STATUS_CONFIG } from '@/utils/status';
import type { AdminRegisteredUser } from '@/api/admin-client';
import { adminMessages } from '@/i18n';
import { MoreHorizontal, Eye, Power, PowerOff, Trash2 } from 'lucide-react';

interface CreateRegisteredUsersColumnsOptions {
  onView: (userId: string) => void;
  onEnable: (userId: string) => void;
  onDisable: (userId: string) => void;
  onDelete: (userId: string) => void;
}

const statusColorMap: Record<string, string> = {
  success: 'success',
  warning: 'warning',
  destructive: 'error',
  default: 'default',
  info: 'processing',
};

export function createRegisteredUsersColumns({
  onView,
  onEnable,
  onDisable,
  onDelete,
}: CreateRegisteredUsersColumnsOptions) {
  return [
    { title: adminMessages.registeredUsers.columns.phone, dataIndex: 'phone', key: 'phone', width: 140 },
    { title: adminMessages.registeredUsers.columns.name, dataIndex: 'full_name', key: 'full_name', width: 140 },
    {
      title: adminMessages.registeredUsers.columns.status,
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      render: (_: any, user: any) => {
        const config = user.is_active ? ORG_STATUS_CONFIG.active : ORG_STATUS_CONFIG.inactive;
        return <Tag color={statusColorMap[config.variant] || 'default'}>{config.label}</Tag>;
      },
    },
    {
      title: adminMessages.registeredUsers.columns.createdAt,
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (created_at: any) => formatDateTime(created_at),
    },
    {
      title: adminMessages.registeredUsers.columns.actions,
      key: 'actions',
      width: 80,
      render: (_: any, user: any) => {
        const menuItems: MenuProps['items'] = [
          {
            key: 'view',
            icon: <Eye className="h-4 w-4" />,
            label: adminMessages.registeredUsers.actions.detail,
            onClick: () => onView(user.id),
          },
          user.is_active ? {
            key: 'disable',
            icon: <PowerOff className="h-4 w-4" />,
            label: adminMessages.registeredUsers.actions.disable,
            danger: true,
            onClick: () => onDisable(user.id),
          } : {
            key: 'enable',
            icon: <Power className="h-4 w-4" />,
            label: adminMessages.registeredUsers.actions.enable,
            onClick: () => onEnable(user.id),
          },
          {
            key: 'delete',
            icon: <Trash2 className="h-4 w-4" />,
            label: adminMessages.registeredUsers.actions.delete,
            danger: true,
            onClick: () => onDelete(user.id),
          },
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
