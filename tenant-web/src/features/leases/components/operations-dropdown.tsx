'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Lease } from '@/types';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@apartment-ultra/shared-ui/components/ui';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
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
import { appToast } from '@apartment-ultra/shared-ui/components/ui';
import { MoreHorizontal, Home, RefreshCw, User, TrendingUp, Droplets, DollarSign, Layers, LogOut, Plus, Trash2 } from 'lucide-react';
import { leasesApi } from '@/lib/api';
import { ChangeRoomSheet } from './operation-sheets/change-room-sheet';
import { RenewSheet } from './operation-sheets/renew-sheet';
import { ChangeRentSheet } from './operation-sheets/change-rent-sheet';
import { ChangeUtilityRatesSheet } from './operation-sheets/change-utility-rates-sheet';
import { SettleLeaseSheet } from './operation-sheets/settle-lease-sheet';
import { UpdateTenantDialog } from './operation-dialogs/update-tenant-dialog';
import { ChangeDepositDialog } from './operation-dialogs/change-deposit-dialog';

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

interface OperationsDropdownProps {
  orgId: string;
  leaseId: string;
  lease: Lease;
}

export function OperationsDropdown({ orgId, leaseId, lease }: OperationsDropdownProps) {
  const [openSheet, setOpenSheet] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState<string | null>(null);
  const [feeItemsDialogOpen, setFeeItemsDialogOpen] = useState(false);
  const [directFees, setDirectFees] = useState<LeaseDirectFeeItem[]>([]);
  const [editingFee, setEditingFee] = useState<LeaseDirectFeeItem | null>(null);
  const [feeFormData, setFeeFormData] = useState({ name: '', customName: '', amount: '', cycle: 'monthly' as BillingCycle, notes: '' });
  const [showFeeDialog, setShowFeeDialog] = useState(false);
  const queryClient = useQueryClient();

  const isActive = lease.is_active;

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
      setFeeItemsDialogOpen(false);
    },
    onError: () => {
      appToast.error('更新费用项目失败');
    },
  });

  // 转换存储的数据格式
  const currentFeeItems: LeaseDirectFeeItem[] = (lease as any)?.fee_items?.map((item: any) => ({
    id: item.id,
    name: item.fee_name || '-',
    amount: Number(item.fee_amount || 0),
    cycle: (item.fee_cycle as BillingCycle) || 'monthly',
    notes: item.notes || '',
  })) || [];

  // 打开费用对话框
  const openFeeItemsDialog = (open: boolean) => {
    if (open) {
      setDirectFees(currentFeeItems);
    }
    setFeeItemsDialogOpen(open);
  };

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
  const handleFeeItemsSave = () => {
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
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreHorizontal className="h-4 w-4 mr-2" />
            操作
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setOpenSheet('change-room')}>
            <Home className="h-4 w-4 mr-2" />换房
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpenSheet('renew')}>
            <RefreshCw className="h-4 w-4 mr-2" />续约
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpenDialog('update-tenant')}>
            <User className="h-4 w-4 mr-2" />编辑租客
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setOpenSheet('change-rent')}>
            <TrendingUp className="h-4 w-4 mr-2" />房租变更
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpenSheet('change-utility-rates')}>
            <Droplets className="h-4 w-4 mr-2" />水电单价变更
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpenDialog('change-deposit')}>
            <DollarSign className="h-4 w-4 mr-2" />押金变更
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => openFeeItemsDialog(true)}>
            <Layers className="h-4 w-4 mr-2" />编辑费用项目
          </DropdownMenuItem>
          {isActive && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setOpenSheet('settle')}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="h-4 w-4 mr-2" />退租结算
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Sheet 组件 */}
      <ChangeRoomSheet
        open={openSheet === 'change-room'}
        onOpenChange={(open) => setOpenSheet(open ? 'change-room' : null)}
        orgId={orgId}
        leaseId={leaseId}
      />
      <RenewSheet
        open={openSheet === 'renew'}
        onOpenChange={(open) => setOpenSheet(open ? 'renew' : null)}
        orgId={orgId}
        leaseId={leaseId}
        currentEndDate={lease.end_date}
      />
      <ChangeRentSheet
        open={openSheet === 'change-rent'}
        onOpenChange={(open) => setOpenSheet(open ? 'change-rent' : null)}
        orgId={orgId}
        leaseId={leaseId}
        currentRent={Number(lease.monthly_rent)}
      />
      <ChangeUtilityRatesSheet
        open={openSheet === 'change-utility-rates'}
        onOpenChange={(open) => setOpenSheet(open ? 'change-utility-rates' : null)}
        orgId={orgId}
        leaseId={leaseId}
        currentWaterRate={Number(lease.water_rate || 0)}
        currentElectricityRate={Number(lease.electricity_rate || 0)}
      />
      <SettleLeaseSheet
        open={openSheet === 'settle'}
        onOpenChange={(open) => setOpenSheet(open ? 'settle' : null)}
        orgId={orgId}
        leaseId={leaseId}
      />

      {/* Dialog 组件 */}
      <UpdateTenantDialog
        open={openDialog === 'update-tenant'}
        onOpenChange={(open) => setOpenDialog(open ? 'update-tenant' : null)}
        orgId={orgId}
        leaseId={leaseId}
        currentTenantId={lease.tenant_id}
      />
      <ChangeDepositDialog
        open={openDialog === 'change-deposit'}
        onOpenChange={(open) => setOpenDialog(open ? 'change-deposit' : null)}
        orgId={orgId}
        leaseId={leaseId}
        currentDeposit={Number(lease.deposit || 0)}
      />

      {/* 费用编辑对话框 */}
      <Dialog open={feeItemsDialogOpen} onOpenChange={openFeeItemsDialog}>
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
            <Button variant="outline" onClick={() => openFeeItemsDialog(false)}>取消</Button>
            <Button onClick={handleFeeItemsSave} disabled={setFeeItemsMutation.isPending}>
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
    </>
  );
}
