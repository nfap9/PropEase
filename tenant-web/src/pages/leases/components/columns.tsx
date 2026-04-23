
import { Link } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { Ban, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import { Tag, Dropdown, Button } from 'antd';
import type { MenuProps } from 'antd';
import { formatDate } from '@/utils/date';
import { LEASE_STATUS_CONFIG } from '@/constants/status';
import type { Lease } from '@/types';

interface CreateLeaseColumnsOptions {
  onEdit: (lease: Lease) => void;
  onTerminate: (lease: Lease) => void;
  onDelete: (lease: Lease) => void;
  /** 是否有编辑租约权限 */
  canEditLease?: boolean;
  /** 是否有删除租约权限 */
  canDeleteLease?: boolean;
}

export function createLeaseColumns({
  onEdit,
  onTerminate,
  onDelete,
  canEditLease = true,
  canDeleteLease = true,
}: CreateLeaseColumnsOptions): ColumnsType<Lease> {
  return [
    {
      title: '房间',
      dataIndex: 'room',
      key: 'room',
      width: 180,
      minWidth: 150,
      render: (_, record) => {
        const room = record.room;
        if (!room) {
          return '-';
        }
        return (
          <Link
            to={`/leases/${record.id}`}
            className="flex flex-col hover:underline"
          >
            {room.apartment && (
              <span className="text-xs text-muted-foreground">
                {room.apartment.name}
              </span>
            )}
            <span>{room.room_number}</span>
          </Link>
        );
      },
    },
    {
      title: '租客',
      dataIndex: 'tenant',
      key: 'tenant',
      width: 120,
      minWidth: 100,
      render: (_, record) => record.tenant?.name || '-',
    },
    {
      title: '开始日期',
      dataIndex: 'start_date',
      key: 'start_date',
      width: 120,
      minWidth: 100,
      render: (_, record) => formatDate(record.start_date),
    },
    {
      title: '结束日期',
      dataIndex: 'end_date',
      key: 'end_date',
      width: 120,
      minWidth: 100,
      render: (_, record) => (record.end_date ? formatDate(record.end_date) : '长期'),
    },
    {
      title: '月租',
      dataIndex: 'monthly_rent',
      key: 'monthly_rent',
      width: 120,
      minWidth: 100,
      render: (_, record) => `¥${record.monthly_rent.toLocaleString()}`,
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      minWidth: 80,
      render: (_, record) => {
        const config = record.is_active ? LEASE_STATUS_CONFIG.active : LEASE_STATUS_CONFIG.inactive;
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 80,
      minWidth: 60,
      render: (_, record) => {
        const lease = record;
        const menuItems: MenuProps['items'] = [
          ...(canEditLease ? [{
            key: 'edit',
            icon: <Pencil className="h-4 w-4" />,
            label: '编辑',
            onClick: () => onEdit(lease),
          }] : []),
          ...(canEditLease && lease.is_active ? [{
            key: 'terminate',
            icon: <Ban className="h-4 w-4" />,
            label: '终止',
            danger: true,
            onClick: () => onTerminate(lease),
          }] : []),
          ...(canDeleteLease ? [{
            key: 'delete',
            icon: <Trash2 className="h-4 w-4" />,
            label: '删除',
            danger: true,
            onClick: () => onDelete(lease),
          }] : []),
        ];

        return (
          <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
            <Button type="text" size="small" icon={<MoreHorizontal className="h-4 w-4" />} />
          </Dropdown>
        );
      },
    },
  ];
}
