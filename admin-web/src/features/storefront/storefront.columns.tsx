'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { GripVertical, Pencil, Store, Trash2 } from 'lucide-react';
import { StatusBadge } from '@apartment-ultra/shared-ui/components/ui';
import { TableActions } from '@/components/common/table-actions';
import { BOOLEAN_YES_NO_CONFIG } from '@/lib/status-config';
import type { StorefrontConfig, StorefrontItem } from '@/lib/api/admin-client';
import { formatPricingDiscount } from './storefront.utils';

export function createStorefrontColumns({
  onManageItems,
  onEdit,
  onDelete,
}: {
  onManageItems: (storefront: StorefrontConfig) => void;
  onEdit: (storefront: StorefrontConfig) => void;
  onDelete: (storefront: StorefrontConfig) => void;
}): ColumnDef<StorefrontConfig>[] {
  return [
    { accessorKey: 'name', header: '商店名称', size: 180, minSize: 150 },
    { accessorKey: 'code', header: '代码', size: 120, minSize: 100 },
    {
      accessorKey: 'is_default',
      header: '默认',
      size: 80,
      minSize: 60,
      cell: ({ row }) => {
        const config = row.original.is_default ? BOOLEAN_YES_NO_CONFIG.yes : BOOLEAN_YES_NO_CONFIG.no;
        return <StatusBadge variant={config.variant}>{config.label}</StatusBadge>;
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
    {
      id: 'items_count',
      header: '服务数量',
      size: 100,
      minSize: 80,
      cell: ({ row }) => row.original.items?.length ?? 0,
    },
    {
      id: 'actions',
      header: '操作',
      size: 180,
      minSize: 160,
      cell: ({ row }) => (
        <TableActions
          actions={[
            { icon: Store, label: '管理商品', onClick: () => onManageItems(row.original) },
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

export function createStorefrontItemColumns({
  onEdit,
  onDelete,
}: {
  onEdit: (item: StorefrontItem) => void;
  onDelete: (item: StorefrontItem) => void;
}): ColumnDef<StorefrontItem>[] {
  return [
    {
      id: 'sort',
      header: '',
      size: 50,
      minSize: 40,
      cell: () => <GripVertical className="h-4 w-4 text-muted-foreground" />,
    },
    {
      id: 'service_name',
      header: '服务名称',
      size: 200,
      minSize: 150,
      cell: ({ row }) => row.original.service?.name ?? row.original.service_id,
    },
    {
      accessorKey: 'is_visible',
      header: '可见',
      size: 80,
      minSize: 60,
      cell: ({ row }) => {
        const config = row.original.is_visible ? BOOLEAN_YES_NO_CONFIG.yes : BOOLEAN_YES_NO_CONFIG.no;
        return <StatusBadge variant={config.variant}>{config.label}</StatusBadge>;
      },
    },
    {
      id: 'discounts',
      header: '折扣配置',
      size: 300,
      minSize: 200,
      cell: ({ row }) => {
        const discounts = row.original.pricing_discounts;
        if (!discounts || discounts.length === 0) {
          return '-';
        }
        return discounts.map((discount, index) => (
          <Badge key={`${row.original.id}-${index}`} variant="outline" className="mr-1">
            {formatPricingDiscount(discount)}
          </Badge>
        ));
      },
    },
    {
      id: 'actions',
      header: '操作',
      size: 120,
      minSize: 100,
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

