'use client';

import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable, StatusBadge } from '@apartment-ultra/shared-ui/components/ui';
import { useBillingOrders } from '../billing.hooks';
import {
  formatOrderAmount,
  getOrderStatusLabel,
  getOrderTypeLabel,
  BILLING_ORDER_STATUS_OPTIONS,
  BILLING_ORDER_TYPE_OPTIONS,
} from '../billing.types';
import type { BillingOrder, BillingOrderStatus, BillingOrderType } from '@apartment-ultra/api-contract';

export function OrdersPageContent() {
  const [typeFilter, setTypeFilter] = useState<BillingOrderType | undefined>();
  const [statusFilter, setStatusFilter] = useState<BillingOrderStatus | undefined>();
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const { orders, total, loading } = useBillingOrders({
    order_type: typeFilter,
    status: statusFilter,
    limit: pageSize,
    offset: page * pageSize,
  });

  const columns: ColumnDef<BillingOrder>[] = [
    {
      accessorKey: 'order_no',
      header: '订单号',
      size: 180,
      cell: ({ row }) => <span className="font-mono text-sm">{row.original.order_no}</span>,
    },
    {
      accessorKey: 'order_type',
      header: '类型',
      size: 100,
      cell: ({ row }) => (
        <StatusBadge variant={row.original.order_type === 'subscription' ? 'info' : 'warning'}>
          {getOrderTypeLabel(row.original.order_type)}
        </StatusBadge>
      ),
    },
    {
      accessorKey: 'amount',
      header: '金额',
      size: 100,
      cell: ({ row }) => formatOrderAmount(row.original),
    },
    {
      accessorKey: 'status',
      header: '状态',
      size: 100,
      cell: ({ row }) => {
        const statusMap: Record<BillingOrderStatus, 'success' | 'warning' | 'destructive' | 'default'> = {
          pending: 'warning',
          paid: 'success',
          cancelled: 'destructive',
          expired: 'default',
        };
        return (
          <StatusBadge variant={statusMap[row.original.status] ?? 'default'}>
            {getOrderStatusLabel(row.original.status)}
          </StatusBadge>
        );
      },
    },
    {
      accessorKey: 'organization_id',
      header: '组织',
      size: 200,
      cell: ({ row }) => row.original.organization_id ?? '-',
    },
    {
      accessorKey: 'created_at',
      header: '创建时间',
      size: 180,
      cell: ({ row }) => new Date(row.original.created_at).toLocaleString('zh-CN'),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <div className="flex gap-2 items-center">
          <label className="text-sm text-gray-600">类型:</label>
          <select
            className="border rounded px-2 py-1 text-sm"
            value={typeFilter ?? ''}
            onChange={(e) => {
              setTypeFilter(e.target.value ? (e.target.value as BillingOrderType) : undefined);
              setPage(0);
            }}
          >
            <option value="">全部</option>
            {BILLING_ORDER_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 items-center">
          <label className="text-sm text-gray-600">状态:</label>
          <select
            className="border rounded px-2 py-1 text-sm"
            value={statusFilter ?? ''}
            onChange={(e) => {
              setStatusFilter(e.target.value ? (e.target.value as BillingOrderStatus) : undefined);
              setPage(0);
            }}
          >
            <option value="">全部</option>
            {BILLING_ORDER_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <DataTable columns={columns} data={orders} isLoading={loading} getRowId={(row) => row.id} emptyTitle="暂无订单" />

      {total > pageSize && (
        <div className="flex justify-center gap-2">
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            上一页
          </button>
          <span className="px-3 py-1">
            第 {page + 1} 页，共 {Math.ceil(total / pageSize)} 页
          </span>
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            disabled={(page + 1) * pageSize >= total}
            onClick={() => setPage((p) => p + 1)}
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
