'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leasesApi } from '@/api';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@apartment-ultra/shared-ui/components/ui';
import { Input } from '@apartment-ultra/shared-ui/components/ui';
import { Label } from '@apartment-ultra/shared-ui/components/ui';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@apartment-ultra/shared-ui/components/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@apartment-ultra/shared-ui/components/ui';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { appToast } from '@apartment-ultra/shared-ui/components/ui';

/** 预置费用类型 */
const PREDEFINED_FEE_TYPES = [
  { name: '管理费', code: 'management' },
  { name: '卫生费', code: 'cleaning' },
  { name: '网费', code: 'internet' },
  { name: '停车费', code: 'parking' },
  { name: '其他', code: 'other' },
] as const;

type BillingCycle = 'monthly' | 'quarterly' | 'yearly' | 'one_time';

const CYCLE_LABELS: Record<BillingCycle, string> = {
  monthly: '每月',
  quarterly: '每季',
  yearly: '每年',
  one_time: '一次性',
};

interface LeaseDirectFeeItem {
  id: string;
  name: string;
  amount: number;
  cycle: BillingCycle;
  notes: string;
}

interface LeaseFeeItemRaw {
  id: string;
  fee_name?: string;
  fee_amount?: number;
  fee_cycle?: string;
  notes?: string;
}

interface LeaseFeeItemsTabProps {
  leaseId: string;
  orgId: string;
}

export function LeaseFeeItemsTab({ leaseId, orgId }: LeaseFeeItemsTabProps) {
  const [openDialog, setOpenDialog] = useState(false);
  const [directFees, setDirectFees] = useState<LeaseDirectFeeItem[]>([]);
  const [editingFee, setEditingFee] = useState<LeaseDirectFeeItem | null>(null);
  const [feeFormData, setFeeFormData] = useState({ name: '', customName: '', amount: '', cycle: 'monthly' as BillingCycle, notes: '' });
  const [showFeeDialog, setShowFeeDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: lease, isLoading } = useQuery({
    queryKey: ['lease', leaseId],
    queryFn: () => leasesApi.get(orgId, leaseId),
  });

  const setFeeItemsMutation = useMutation({
    mutationFn: (feeItems: Array<{
      fee_type_id?: string;
      fee_name: string;
      fee_amount: number;
      fee_cycle: BillingCycle;
      quantity?: number;
      notes?: string;
    }>) => leasesApi.setLeaseFeeItems(orgId, leaseId, feeItems),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lease', leaseId] });
      appToast.success('费用项目已更新');
      setOpenDialog(false);
    },
    onError: () => {
      appToast.error('更新费用项目失败');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // 转换存储的数据格式
  const currentItems: LeaseDirectFeeItem[] = (lease as { fee_items?: LeaseFeeItemRaw[] })?.fee_items?.map((item: LeaseFeeItemRaw) => ({
    id: item.id,
    name: item.fee_name || '-',
    amount: Number(item.fee_amount || 0),
    cycle: (item.fee_cycle as BillingCycle) || 'monthly',
    notes: item.notes || '',
  })) || [];

  // 当对话框打开时，用当前费用项目初始化
  const handleOpenDialog = (open: boolean) => {
    if (open) {
      setDirectFees(currentItems);
    }
    setOpenDialog(open);
  };

  // 打开费用对话框
  const openFeeDialog = (fee?: LeaseDirectFeeItem) => {
    if (fee) {
      setEditingFee(fee);
      const predefined = PREDEFINED_FEE_TYPES.find((t) => t.name === fee.name);
      if (predefined) {
        setFeeFormData({ name: predefined.code, customName: '', amount: String(fee.amount), cycle: fee.cycle, notes: fee.notes });
      } else {
        setFeeFormData({ name: 'custom', customName: fee.name, amount: String(fee.amount), cycle: fee.cycle, notes: fee.notes });
      }
    } else {
      setEditingFee(null);
      setFeeFormData({ name: '', customName: '', amount: '', cycle: 'monthly', notes: '' });
    }
    setShowFeeDialog(true);
  };


  // 保存费用
  const saveFee = () => {
    const name = feeFormData.name === 'custom' ? feeFormData.customName.trim() : PREDEFINED_FEE_TYPES.find(t => t.code === feeFormData.name)?.name || feeFormData.customName;
    if (!name || !feeFormData.amount) return;

    const newFee: LeaseDirectFeeItem = {
      id: editingFee?.id || crypto.randomUUID(),
      name,
      amount: parseFloat(feeFormData.amount),
      cycle: feeFormData.cycle,
      notes: feeFormData.notes,
    };

    if (editingFee) {
      setDirectFees((prev) => prev.map((f) => (f.id === editingFee.id ? newFee : f)));
    } else {
      setDirectFees((prev) => [...prev, newFee]);
    }
    setShowFeeDialog(false);
  };

  // 移除费用
  const removeFee = (feeId: string) => {
    setDirectFees((prev) => prev.filter((f) => f.id !== feeId));
  };

  // 保存所有费用
  const handleSave = () => {
    const feeItems = directFees.map((fee) => ({
      fee_name: fee.name,
      fee_amount: fee.amount,
      fee_cycle: fee.cycle,
      quantity: 1,
      notes: fee.notes || undefined,
    }));
    setFeeItemsMutation.mutate(feeItems);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">费用项目</h2>
        <Button variant="outline" size="sm" onClick={() => handleOpenDialog(true)}>
          <Pencil className="h-4 w-4 mr-2" />
          编辑
        </Button>
      </div>

      {currentItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <p>暂无费用项目</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">费用明细</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b">
                  <th className="pb-2 font-medium">费用类型</th>
                  <th className="pb-2 font-medium text-right">金额</th>
                  <th className="pb-2 font-medium text-right">周期</th>
                  <th className="pb-2 font-medium text-right">小计</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="py-2">{item.name}</td>
                    <td className="py-2 text-right">
                      ¥{item.amount.toLocaleString()}
                    </td>
                    <td className="py-2 text-right text-muted-foreground">
                      {CYCLE_LABELS[item.cycle]}
                    </td>
                    <td className="py-2 text-right font-medium">
                      ¥{item.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* 编辑费用对话框 */}
      <Dialog open={openDialog} onOpenChange={handleOpenDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>编辑费用项目</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">费用列表</span>
              <Button type="button" variant="outline" size="sm" onClick={() => openFeeDialog()}>
                <Plus className="h-4 w-4 mr-1" />
                添加
              </Button>
            </div>

            {directFees.length > 0 && (
              <div className="space-y-2">
                {directFees.map((fee) => (
                  <div key={fee.id} className="flex items-center gap-3 bg-muted/50 rounded-lg p-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{fee.name}</span>
                        <span className="text-sm text-muted-foreground">¥{fee.amount}/{CYCLE_LABELS[fee.cycle]}</span>
                      </div>
                      {fee.notes && <p className="text-xs text-muted-foreground mt-1">{fee.notes}</p>}
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => openFeeDialog(fee)}>
                      编辑
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeFee(fee.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {directFees.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">暂无费用项目，点击添加</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleOpenDialog(false)}>取消</Button>
            <Button onClick={handleSave} disabled={setFeeItemsMutation.isPending}>
              {setFeeItemsMutation.isPending ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 费用项编辑对话框 */}
      <Dialog open={showFeeDialog} onOpenChange={setShowFeeDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingFee ? '编辑费用' : '添加费用'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>费用类型</Label>
              <Select value={feeFormData.name} onValueChange={(value) => setFeeFormData((prev) => ({ ...prev, name: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="选择费用类型" />
                </SelectTrigger>
                <SelectContent>
                  {PREDEFINED_FEE_TYPES.map((type) => (
                    <SelectItem key={type.code} value={type.code}>
                      {type.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">自定义</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {feeFormData.name === 'custom' && (
              <div className="space-y-2">
                <Label>自定义费用名称</Label>
                <Input
                  placeholder="输入费用名称"
                  value={feeFormData.customName}
                  onChange={(e) => setFeeFormData((prev) => ({ ...prev, customName: e.target.value }))}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>金额（元）</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={feeFormData.amount}
                onChange={(e) => setFeeFormData((prev) => ({ ...prev, amount: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>计费周期</Label>
              <Select value={feeFormData.cycle} onValueChange={(value) => setFeeFormData((prev) => ({ ...prev, cycle: value as BillingCycle }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">每月</SelectItem>
                  <SelectItem value="quarterly">每季</SelectItem>
                  <SelectItem value="yearly">每年</SelectItem>
                  <SelectItem value="one_time">一次性</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>备注</Label>
              <Input
                placeholder="可选"
                value={feeFormData.notes}
                onChange={(e) => setFeeFormData((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFeeDialog(false)}>取消</Button>
            <Button onClick={saveFee} disabled={!feeFormData.name || (feeFormData.name === 'custom' && !feeFormData.customName.trim()) || !feeFormData.amount}>
              {editingFee ? '保存' : '添加'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
