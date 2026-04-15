'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Trash2 } from 'lucide-react';
import { StatusBadge } from '@apartment-ultra/shared-ui/components/ui';
import { TableActions } from '@/components/common/table-actions';
import { BOOLEAN_YES_NO_CONFIG } from '@/lib/status-config';
import type { ServiceProduct } from '@/lib/api/admin-client';

export function createServicePricingColumns({
  onEdit,
  onDelete,
}: {
  onEdit: (service: ServiceProduct) => void;
  onDelete: (service: ServiceProduct) => void;
}): ColumnDef<ServiceProduct>[] {
  return [
    { accessorKey: 'name', header: '服务名称', size: 160, minSize: 120 },
    { accessorKey: 'code', header: '代码', size: 120, minSize: 80 },
    {
      id: 'pricing',
      header: '定价',
      size: 200,
      minSize: 160,
      cell: ({ row }) => {
        const service = row.original;
        if (service.pricing && service.pricing.length > 0) {
          const activePricing = service.pricing.filter((pricing) => pricing.is_active);
          if (activePricing.length > 0) {
            return activePricing.map((pricing) => `${pricing.months}月¥${pricing.price}`).join(' / ');
          }
        }
        return '-';
      },
    },
    {
      id: 'limits',
      header: '服务内容',
      size: 280,
      minSize: 200,
      cell: ({ row }) => {
        const service = row.original;
        const orgs = service.max_organizations == null ? '∞' : service.max_organizations;
        return `团队${orgs} / 公寓${service.max_apartments} / 房间${service.max_rooms} / 团队成员${service.max_members}`;
      },
    },
    {
      accessorKey: 'is_active',
      header: '启用',
      size: 80,
      minSize: 60,
      cell: ({ row }) => {
        const config = row.original.is_active ? BOOLEAN_YES_NO_CONFIG.yes : BOOLEAN_YES_NO_CONFIG.no;
        return <StatusBadge variant={config.variant}>{config.label}</StatusBadge>;
      },
    },
    { accessorKey: 'sort_order', header: '排序', size: 80, minSize: 60 },
    {
      id: 'actions',
      header: '操作',
      size: 100,
      minSize: 80,
      cell: ({ row }) => (
        <TableActions
          actions={[
            { icon: Pencil, label: '编辑', onClick: () => onEdit(row.original) },
            {
              icon: Trash2,
              label: '删除',
              variant: 'destructive',
              onClick: () => onDelete(row.original),
            },
          ]}
        />
      ),
    },
  ];
}
