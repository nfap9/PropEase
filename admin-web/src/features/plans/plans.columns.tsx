'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@apartment-ultra/shared-ui/components/ui';
import { TableActions } from '@/components/common/table-actions';
import { BOOLEAN_YES_NO_CONFIG } from '@/lib/status-config';
import type { AdminPlan } from '@/lib/api/admin-client';
import { formatPlanLimits, formatPlanPricing } from './plans.utils';
import { adminMessages } from '@/lib/i18n';

interface CreatePlanColumnsOptions {
  onEdit: (plan: AdminPlan) => void;
  onDelete: (plan: AdminPlan) => void;
}

export function createPlanColumns({
  onEdit,
  onDelete,
}: CreatePlanColumnsOptions): ColumnDef<AdminPlan>[] {
  return [
    { accessorKey: 'name', header: adminMessages.plans.columns.name },
    { accessorKey: 'code', header: adminMessages.plans.columns.code },
    {
      id: 'pricing',
      header: adminMessages.plans.columns.pricing,
      cell: ({ row }) => formatPlanPricing(row.original),
    },
    {
      id: 'limits',
      header: adminMessages.plans.columns.limits,
      cell: ({ row }) => formatPlanLimits(row.original),
    },
    {
      accessorKey: 'is_purchasable',
      header: adminMessages.plans.columns.purchasable,
      cell: ({ row }) => {
        const config = row.original.is_purchasable
          ? BOOLEAN_YES_NO_CONFIG.yes
          : BOOLEAN_YES_NO_CONFIG.no;
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      accessorKey: 'is_active',
      header: adminMessages.plans.columns.enabled,
      cell: ({ row }) => {
        const config = row.original.is_active ? BOOLEAN_YES_NO_CONFIG.yes : BOOLEAN_YES_NO_CONFIG.no;
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    { accessorKey: 'sort_order', header: adminMessages.plans.columns.sortOrder },
    {
      id: 'actions',
      header: adminMessages.plans.columns.actions,
      cell: ({ row }) => (
        <TableActions
          actions={[
            {
              icon: Pencil,
              label: adminMessages.plans.actions.edit,
              onClick: () => onEdit(row.original),
            },
            {
              icon: Trash2,
              label: adminMessages.plans.actions.delete,
              variant: 'destructive',
              onClick: () => onDelete(row.original),
            },
          ]}
        />
      ),
    },
  ];
}
