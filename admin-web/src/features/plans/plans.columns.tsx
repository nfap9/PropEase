'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@apartment-ultra/shared-ui/components/ui';
import { TableActions } from '@/components/common/table-actions';
import { BOOLEAN_YES_NO_CONFIG } from '@/lib/status-config';
import type { AdminPlan } from '@/lib/api/admin-client';
import { formatPlanLimits, formatPlanPricing } from './plans.utils';

interface CreatePlanColumnsOptions {
  onEdit: (plan: AdminPlan) => void;
  onDelete: (plan: AdminPlan) => void;
}

export function createPlanColumns({
  onEdit,
  onDelete,
}: CreatePlanColumnsOptions): ColumnDef<AdminPlan>[] {
  return [
    { accessorKey: 'name', header: '名称' },
    { accessorKey: 'code', header: '代码' },
    {
      id: 'pricing',
      header: '价格',
      cell: ({ row }) => formatPlanPricing(row.original),
    },
    {
      id: 'limits',
      header: '限制',
      cell: ({ row }) => formatPlanLimits(row.original),
    },
    {
      accessorKey: 'is_purchasable',
      header: '可购买',
      cell: ({ row }) => {
        const config = row.original.is_purchasable
          ? BOOLEAN_YES_NO_CONFIG.yes
          : BOOLEAN_YES_NO_CONFIG.no;
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      accessorKey: 'is_active',
      header: '启用',
      cell: ({ row }) => {
        const config = row.original.is_active ? BOOLEAN_YES_NO_CONFIG.yes : BOOLEAN_YES_NO_CONFIG.no;
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    { accessorKey: 'sort_order', header: '排序' },
    {
      id: 'actions',
      header: '操作',
      cell: ({ row }) => (
        <TableActions
          actions={[
            {
              icon: Pencil,
              label: '编辑',
              onClick: () => onEdit(row.original),
            },
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
