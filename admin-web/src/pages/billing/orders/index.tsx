
import { useState } from 'react';
import { Tag, Table } from 'antd';
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

  const columns = [
    {
      title: '订单号',
      dataIndex: 'order_no',
      key: 'order_no',
      width: 180,
      render: (order_no: any) => <span className="font-mono text-sm">{order_no}</span>,
    },
    {
      title: '类型',
      dataIndex: 'order_type',
      key: 'order_type',
      width: 100,
      render: (_: any, order: any) => (
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
      render: (_: any, order: any) => formatOrderAmount(order),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (_: any, order: any) => {
        const statusColorMap: Record<string, string> = {
          pending: 'warning',
          paid: 'success',
          cancelled: 'error',
          expired: 'default',
        };
        return (
          <Tag color={statusColorMap[order.status] ?? 'default'}>
            {getOrderStatusLabel(order.status)}
          </Tag>
        );
      },
    },
    {
      title: '组织',
      dataIndex: 'organization_id',
      key: 'organization_id',
      width: 200,
      render: (organization_id: any) => organization_id ?? '-',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (created_at: any) => new Date(created_at).toLocaleString('zh-CN'),
    },
  ];

  const tableProps: TableProps = {
    dataSource: orders,
    columns,
    loading,
    rowKey: (record: any) => record.id,
    pagination: {
      current: page + 1,
      pageSize,
      total,
      showSizeChanger: true,
      showQuickJumper: true,
      pageSizeOptions: ['10', '20', '50', '100'],
      showTotal: (total: number) => `共 ${total} 条`,
    },
    onChange: (pagination) => {
      setPage((pagination.current ?? 1) - 1);
    },
    scroll: { x: 'max-content' },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">订单管理</h1>
        <p className="mt-1 text-sm text-gray-500">查看和管理所有订单</p>
      </div>
      <div className="flex gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm">类型:</span>
          <Select
            value={typeFilter ?? 'all'}
            onChange={(v) => {
              setTypeFilter(v === 'all' ? undefined : (v as BillingOrderType));
              setPage(0);
            }}
            style={{ width: 120 }}
          >
            <Select.Option value="all">全部</Select.Option>
            {BILLING_ORDER_TYPE_OPTIONS.map((opt) => (
              <Select.Option key={opt.value} value={opt.value}>
                {opt.label}
              </Select.Option>
            ))}
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm">状态:</span>
          <Select
            value={statusFilter ?? 'all'}
            onChange={(v) => {
              setStatusFilter(v === 'all' ? undefined : (v as BillingOrderStatus));
              setPage(0);
            }}
            style={{ width: 120 }}
          >
            <Select.Option value="all">全部</Select.Option>
            {BILLING_ORDER_STATUS_OPTIONS.map((opt) => (
              <Select.Option key={opt.value} value={opt.value}>
                {opt.label}
              </Select.Option>
            ))}
          </Select>
        </div>
      </div>
      <Table {...tableProps} />
    </div>
  );
}
