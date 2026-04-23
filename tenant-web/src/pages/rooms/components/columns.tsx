
import { Link } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { Tag, Dropdown, Button } from 'antd';
import type { MenuProps } from 'antd';
import { Room, RoomStatus } from '@/types';
import { ROOM_STATUS_CONFIG } from '@/constants/status';
import { FileText, Ban, Wrench, CheckCircle, MoreHorizontal } from 'lucide-react';

export interface UseColumnsOptions {
  onLease: (room: Room) => void;
  onTerminate: (room: Room) => void;
  onStatusChange: (room: Room, status: RoomStatus) => void;
}

export function useColumns({
  onLease,
  onTerminate,
  onStatusChange,
}: UseColumnsOptions): ColumnsType<Room> {
  return [
    {
      title: '房间号',
      dataIndex: 'room_number',
      key: 'room_number',
      width: 120,
      minWidth: 100,
    },
    {
      title: '所属公寓',
      dataIndex: 'apartment_name',
      key: 'apartment',
      width: 180,
      minWidth: 150,
      render: (_, record) => {
        const apartment = record.apartment;
        return apartment ? (
          <Link to={`/workspace/apartments/${apartment.id}`} className="text-primary hover:underline">
            {apartment.name}
          </Link>
        ) : (
          '-'
        );
      },
    },
    {
      title: '户型',
      dataIndex: 'layout',
      key: 'layout',
      width: 100,
      minWidth: 80,
      render: (_, record) => record.layout || '-',
    },
    {
      title: '面积',
      dataIndex: 'area',
      key: 'area',
      width: 100,
      minWidth: 80,
      render: (_, record) => (record.area ? `${record.area} m²` : '-'),
    },
    {
      title: '月租',
      dataIndex: 'monthly_rent',
      key: 'monthly_rent',
      width: 120,
      minWidth: 100,
      render: (_, record) => {
        const rent = record.pricing?.monthly_rent;
        return rent ? `¥${rent.toLocaleString()}` : '-';
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      minWidth: 80,
      render: (_, record) => {
        const status = ROOM_STATUS_CONFIG[record.status];
        return <Tag color={status.color}>{status.label}</Tag>;
      },
    },
    {
      title: '备注',
      dataIndex: 'notes',
      key: 'notes',
      width: 200,
      minWidth: 120,
      render: (_, record) => <span className="text-muted-foreground">{record.notes || '-'}</span>,
    },
    {
      title: '操作',
      key: 'actions',
      width: 80,
      minWidth: 60,
      render: (_, record) => {
        const room = record;
        const isAvailable = room.status === 'available';
        const isOccupied = room.status === 'occupied';
        const isMaintenance = room.status === 'maintenance';

        const menuItems: MenuProps['items'] = [
          ...(isAvailable ? [{
            key: 'lease',
            icon: <FileText className="h-4 w-4" />,
            label: '签约',
            onClick: () => onLease(room),
          }] : []),
          ...(isOccupied ? [{
            key: 'terminate',
            icon: <Ban className="h-4 w-4" />,
            label: '退租',
            danger: true,
            onClick: () => onTerminate(room),
          }] : []),
          ...(isAvailable ? [{
            key: 'maintenance',
            icon: <Wrench className="h-4 w-4" />,
            label: '开始维修',
            onClick: () => onStatusChange(room, 'maintenance'),
          }] : []),
          ...(isMaintenance ? [{
            key: 'available',
            icon: <CheckCircle className="h-4 w-4" />,
            label: '完成维修',
            onClick: () => onStatusChange(room, 'available'),
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
