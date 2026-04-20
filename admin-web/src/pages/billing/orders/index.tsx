import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@apartment-ultra/shared-ui/components/ui';
import { DataTable } from '@apartment-ultra/shared-ui/components/ui';
import { useBillingOrders } from '@/hooks/billing';
import {
  formatOrderAmount,
  getOrderStatusLabel,
  getOrderTypeLabel,
  BILLING_ORDER_STATUS_OPTIONS,
  BILLING_ORDER_TYPE_OPTIONS,
} from '@/types/billing';
import type { BillingOrder, BillingOrderStatus, BillingOrderType } from '@apartment-ultra/api-contract';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@apartment-ultra/shared-ui/components/ui';
import { Label } from '@apartment-ultra/shared-ui/components/ui';

export default function BillingOrdersPage() {
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
        <Badge variant={row.original.order_type === 'subscription' ? 'info' : 'warning'}>
          {getOrderTypeLabel(row.original.order_type)}
        </Badge>
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
          <Badge variant={statusMap[row.original.status] ?? 'default'}>
            {getOrderStatusLabel(row.original.status)}
          </Badge>
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">订单管理</h1>
        <p className="mt-1 text-sm text-gray-500">查看和管理所有订单</p>
      </div>
      <DataTable
        columns={columns}
        data={orders}
        loading={loading}
        getRowId={(row) => row.id}
        emptyTitle="暂无订单"
        enablePagination={true}
        manualPagination={true}
        pageCount={Math.ceil(total / pageSize)}
        pagination={{ pageIndex: page, pageSize }}
        onPaginationChange={({ pageIndex }) => setPage(pageIndex)}
        total={total}
        toolbar={
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-sm">类型:</Label>
              <Select
                value={typeFilter ?? 'all'}
                onValueChange={(v) => {
                  setTypeFilter(v === 'all' ? undefined : (v as BillingOrderType));
                  setPage(0);
                }}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="全部" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  {BILLING_ORDER_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm">状态:</Label>
              <Select
                value={statusFilter ?? 'all'}
                onValueChange={(v) => {
                  setStatusFilter(v === 'all' ? undefined : (v as BillingOrderStatus));
                  setPage(0);
                }}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="全部" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  {BILLING_ORDER_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        }
      />
    </div>
  );
}
