import { useState } from 'react';
import { Tag } from 'antd';
import { Table } from 'antd';
import type { TableProps } from 'antd';
import { Select } from 'antd';
import { useBillingOrders } from '@/hooks/billing';
import {
  formatOrderAmount,
  getOrderStatusLabel,
  getOrderTypeLabel,
  BILLING_ORDER_STATUS_OPTIONS,
  BILLING_ORDER_TYPE_OPTIONS,
} from '@/types/billing';
import type { BillingOrder, BillingOrderStatus, BillingOrderType } from '@apartment-ultra/api-contract';

const STATUS_COLOR_MAP: Record<BillingOrderStatus, string> = {
  pending: 'orange',
  paid: 'green',
  cancelled: 'red',
  expired: 'default',
};

export function OrdersView() {
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

  const columns = [
    {
      title: '订单号',
      dataIndex: 'order_no',
      key: 'order_no',
      width: 180,
      render: (order_no: string) => <span className="font-mono text-sm">{order_no}</span>,
    },
    {
      title: '类型',
      dataIndex: 'order_type',
      key: 'order_type',
      width: 100,
      render: (_: unknown, order: BillingOrder) => (
        <Tag color={order.order_type === 'subscription' ? 'processing' : 'warning'}>
          {getOrderTypeLabel(order.order_type)}
        </Tag>
      ),
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      render: (_: unknown, order: BillingOrder) => formatOrderAmount(order),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (_: unknown, order: BillingOrder) => (
        <Tag color={STATUS_COLOR_MAP[order.status]}>{getOrderStatusLabel(order.status)}</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (created_at: string) => new Date(created_at).toLocaleString('zh-CN'),
    },
    {
      title: '付费时间',
      dataIndex: 'paid_at',
      key: 'paid_at',
      width: 160,
      render: (paid_at: string | null) => paid_at ? new Date(paid_at).toLocaleString('zh-CN') : '-',
    },
  ];

  const tableProps: TableProps<BillingOrder> = {
    dataSource: orders ?? [],
    columns,
    rowKey: 'id',
    loading,
    pagination: {
      current: page + 1,
      pageSize,
      total,
      onChange: (p, ps) => {
        setPage(p - 1);
      },
      showSizeChanger: false,
    },
  };

  return (
    <div className="space-y-page">
      <div>
        <h1 className="text-2xl font-semibold">订单管理</h1>
        <p className="text-sm text-gray-500 mt-1">查看和管理所有订单</p>
      </div>

      <div className="flex gap-4 flex-wrap">
        <Select
          allowClear
          placeholder="订单类型"
          style={{ width: 140 }}
          options={BILLING_ORDER_TYPE_OPTIONS}
          onChange={(v) => setTypeFilter(v)}
        />
        <Select
          allowClear
          placeholder="订单状态"
          style={{ width: 140 }}
          options={BILLING_ORDER_STATUS_OPTIONS}
          onChange={(v) => setStatusFilter(v)}
        />
      </div>

      <Table {...tableProps} />
    </div>
  );
}
