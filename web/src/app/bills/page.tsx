'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { MainLayout } from '@/components/layout/main-layout';
import { DataTable } from '@/components/common/data-table';
import { TableActions, TableAction } from '@/components/common/table-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ColumnDef } from '@tanstack/react-table';
import { billsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth/context';
import { Bill, BillStatus, PaymentMethod } from '@/types';
import { Download, DollarSign, AlertCircle, CheckCircle, Clock, Building2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const paymentSchema = z.object({
  amount: z.number().min(0.01, '金额必须大于0'),
  payment_date: z.string().min(1, '请选择付款日期'),
  payment_method: z.enum(['cash', 'wechat', 'alipay', 'bank_transfer', 'other']),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

const STATUS_CONFIG: Record<BillStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof CheckCircle }> = {
  pending: { label: '待支付', variant: 'secondary', icon: Clock },
  partial: { label: '部分支付', variant: 'outline', icon: DollarSign },
  paid: { label: '已支付', variant: 'default', icon: CheckCircle },
  overdue: { label: '已逾期', variant: 'destructive', icon: AlertCircle },
};

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: '现金',
  wechat: '微信',
  alipay: '支付宝',
  bank_transfer: '银行转账',
  other: '其他',
};

export default function BillsPage() {
  const queryClient = useQueryClient();
  const { organization, isLoading: authLoading } = useAuth();
  const orgId = organization?.id;

  const [statusFilter, setStatusFilter] = useState<BillStatus | 'all'>('all');
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  const { data: bills, isLoading: billsLoading } = useQuery({
    queryKey: ['bills', orgId],
    queryFn: () => billsApi.list(orgId!),
    enabled: !!orgId,
  });

  const paymentForm = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: 0,
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'wechat',
      reference: '',
      notes: '',
    },
  });

  const paymentMutation = useMutation({
    mutationFn: (data: PaymentFormData) =>
      billsApi.createPayment(orgId!, selectedBill!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills', orgId] });
      setIsPaymentOpen(false);
      paymentForm.reset();
      setSelectedBill(null);
      toast.success('付款登记成功');
    },
    onError: () => {
      toast.error('登记失败，请重试');
    },
  });

  const handlePayment = (bill: Bill) => {
    setSelectedBill(bill);
    paymentForm.reset({
      amount: bill.total_amount - bill.paid_amount,
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'wechat',
      reference: '',
      notes: '',
    });
    setIsPaymentOpen(true);
  };

  const exportPdf = async (billId: number) => {
    const blob = await billsApi.exportPdf(orgId!, billId);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bill-${billId}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredBills = bills?.filter(
    (bill: Bill) => statusFilter === 'all' || bill.status === statusFilter
  );

  const stats = {
    total: bills?.length || 0,
    pending: bills?.filter((b: Bill) => b.status === 'pending').length || 0,
    partial: bills?.filter((b: Bill) => b.status === 'partial').length || 0,
    paid: bills?.filter((b: Bill) => b.status === 'paid').length || 0,
    overdue: bills?.filter((b: Bill) => b.status === 'overdue').length || 0,
    totalAmount: bills?.reduce((sum: number, b: Bill) => sum + b.total_amount, 0) || 0,
    paidAmount: bills?.reduce((sum: number, b: Bill) => sum + b.paid_amount, 0) || 0,
  };

  const columns: ColumnDef<Bill>[] = [
    {
      accessorKey: 'bill_month',
      header: '月份',
      cell: ({ row }) => `${row.original.bill_year}年${row.original.bill_month}月`,
    },
    {
      accessorKey: 'lease',
      header: '房间/租客',
      cell: ({ row }) => {
        const lease = row.original.lease;
        if (!lease) return '-';
        const room = lease.room;
        const tenant = lease.tenant;
        return (
          <div>
            <div>{room ? `${room.apartment?.name || ''} - ${room.room_number}` : '-'}</div>
            <div className="text-xs text-muted-foreground">{tenant?.name || '-'}</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'total_amount',
      header: '账单金额',
      cell: ({ row }) => `¥${row.original.total_amount.toLocaleString()}`,
    },
    {
      accessorKey: 'paid_amount',
      header: '已付金额',
      cell: ({ row }) => (
        <span className={row.original.paid_amount < row.original.total_amount ? 'text-orange-600' : 'text-green-600'}>
          ¥{row.original.paid_amount.toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: 'due_date',
      header: '到期日',
    },
    {
      accessorKey: 'status',
      header: '状态',
      cell: ({ row }) => {
        const config = STATUS_CONFIG[row.original.status];
        const Icon = config.icon;
        return (
          <Badge variant={config.variant} className="gap-1">
            <Icon className="h-3 w-3" />
            {config.label}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const bill = row.original;
        const actions: TableAction[] = [
          {
            label: '登记付款',
            icon: DollarSign,
            onClick: () => handlePayment(bill),
            show: bill.status !== 'paid',
          },
          {
            label: '导出PDF',
            icon: Download,
            onClick: () => exportPdf(bill.id),
          },
        ];
        return <TableActions actions={actions} />;
      },
    },
  ];

  if (authLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-96" />
        </div>
      </MainLayout>
    );
  }

  // 无组织时的提示
  if (!orgId) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-full space-y-4">
          <Building2 className="h-16 w-16 text-muted-foreground" />
          <h2 className="text-xl font-semibold">请先创建或加入组织</h2>
          <p className="text-muted-foreground">在顶部导航栏选择或创建一个组织开始使用</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">账单管理</h1>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">账单总数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">待收款</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                ¥{(stats.totalAmount - stats.paidAmount).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">{stats.pending + stats.partial} 笔</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">已收款</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ¥{stats.paidAmount.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">逾期账单</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center gap-4">
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as BillStatus | 'all')}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="筛选状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="pending">待支付</SelectItem>
              <SelectItem value="partial">部分支付</SelectItem>
              <SelectItem value="paid">已支付</SelectItem>
              <SelectItem value="overdue">已逾期</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {billsLoading ? (
          <Skeleton className="h-96" />
        ) : (
          <DataTable columns={columns} data={filteredBills || []} />
        )}
      </div>

      {/* Payment Dialog */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>登记付款</DialogTitle>
            <DialogDescription>
              账单金额: ¥{selectedBill?.total_amount.toLocaleString()}，
              已付: ¥{selectedBill?.paid_amount.toLocaleString()}，
              待付: ¥{((selectedBill?.total_amount || 0) - (selectedBill?.paid_amount || 0)).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={paymentForm.handleSubmit((data) => paymentMutation.mutate(data))}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="amount">付款金额 *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                {...paymentForm.register('amount', { valueAsNumber: true })}
              />
              {paymentForm.formState.errors.amount && (
                <p className="text-sm text-destructive">
                  {paymentForm.formState.errors.amount.message}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payment_date">付款日期 *</Label>
                <Input
                  id="payment_date"
                  type="date"
                  {...paymentForm.register('payment_date')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment_method">付款方式 *</Label>
                <Select
                  value={paymentForm.watch('payment_method')}
                  onValueChange={(value: PaymentMethod) =>
                    paymentForm.setValue('payment_method', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reference">交易号/参考号</Label>
              <Input id="reference" {...paymentForm.register('reference')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">备注</Label>
              <Input id="notes" {...paymentForm.register('notes')} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsPaymentOpen(false)}>
                取消
              </Button>
              <Button type="submit" disabled={paymentMutation.isPending}>
                {paymentMutation.isPending ? '处理中...' : '确认收款'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
