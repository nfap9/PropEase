
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Lease } from '@/types';
import { Dropdown, Button, Input, Select, Modal, InputNumber } from 'antd';
import type { MenuProps } from 'antd';
import { toast } from 'sonner';
import { MoreHorizontal, Home, RefreshCw, User, TrendingUp, Droplets, DollarSign, Layers, LogOut, Plus, Trash2 } from 'lucide-react';
import { leasesApi } from '@/api/leases';
import { Label } from '@/components/common/label';
import { ChangeRoomSheet } from '../operations/change-room-sheet';
import { RenewSheet } from '../operations/renew-sheet';
import { ChangeRentSheet } from '../operations/change-rent-sheet';
import { ChangeUtilityRatesSheet } from '../operations/change-utility-rates-sheet';
import { SettleLeaseSheet } from '../operations/settle-lease-sheet';
import { UpdateTenantDialog } from '../operations/update-tenant-dialog';
import { ChangeDepositDialog } from '../operations/change-deposit-dialog';
import { useUpdateTenant, useChangeDeposit } from '../signing/use-lease-operations';

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
    }>) => leasesApi.setLeaseFeeItems(leaseId, feeItems),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lease', leaseId] });
      toast.success('费用项目已更新');
      setFeeItemsDialogOpen(false);
    },
    onError: () => {
      toast.error('更新费用项目失败');
    },
  });

  const updateTenantMutation = useUpdateTenant(leaseId);
  const changeDepositMutation = useChangeDeposit(leaseId);

  // 转换存储的数据格式
  const currentFeeItems: LeaseDirectFeeItem[] = (lease as { fee_items?: LeaseFeeItemRaw[] })?.fee_items?.map((item: LeaseFeeItemRaw) => ({
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

  const items: MenuProps['items'] = [
    { key: 'change-room', label: <span><Home className="h-4 w-4 mr-2 inline" />换房</span>, onClick: () => setOpenSheet('change-room') },
    { key: 'renew', label: <span><RefreshCw className="h-4 w-4 mr-2 inline" />续约</span>, onClick: () => setOpenSheet('renew') },
    { key: 'update-tenant', label: <span><User className="h-4 w-4 mr-2 inline" />编辑租客</span>, onClick: () => setOpenDialog('update-tenant') },
    { type: 'divider' },
    { key: 'change-rent', label: <span><TrendingUp className="h-4 w-4 mr-2 inline" />房租变更</span>, onClick: () => setOpenSheet('change-rent') },
    { key: 'change-utility-rates', label: <span><Droplets className="h-4 w-4 mr-2 inline" />水电单价变更</span>, onClick: () => setOpenSheet('change-utility-rates') },
    { key: 'change-deposit', label: <span><DollarSign className="h-4 w-4 mr-2 inline" />押金变更</span>, onClick: () => setOpenDialog('change-deposit') },
    { key: 'fee-items', label: <span><Layers className="h-4 w-4 mr-2 inline" />编辑费用项目</span>, onClick: () => openFeeItemsDialog(true) },
  ];

  if (isActive) {
    items.push(
      { type: 'divider' },
      { key: 'settle', label: <span className="text-red-500"><LogOut className="h-4 w-4 mr-2 inline" />退租结算</span>, onClick: () => setOpenSheet('settle') }
    );
  }

  return (
    <>
      <Dropdown menu={{ items }} trigger={['click']}>
        <Button>
          <MoreHorizontal className="h-4 w-4 mr-2" />
          操作
        </Button>
      </Dropdown>

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
        onSubmit={(newTenantId) =>
          updateTenantMutation.mutate({ newTenantId }, { onSuccess: () => setOpenDialog(null) })
        }
        isPending={updateTenantMutation.isPending}
      />
      <ChangeDepositDialog
        open={openDialog === 'change-deposit'}
        onOpenChange={(open) => setOpenDialog(open ? 'change-deposit' : null)}
        currentDeposit={Number(lease.deposit || 0)}
        onSubmit={(data) => changeDepositMutation.mutate(data, { onSuccess: () => setOpenDialog(null) })}
        isPending={changeDepositMutation.isPending}
      />

      {/* 费用编辑对话框 */}
      <Modal
        open={feeItemsDialogOpen}
        onCancel={() => openFeeItemsDialog(false)}
        title="编辑费用项目"
        footer={[
          <Button key="cancel" onClick={() => openFeeItemsDialog(false)}>取消</Button>,
          <Button key="submit" type="primary" loading={setFeeItemsMutation.isPending} onClick={handleFeeItemsSave}>
            {setFeeItemsMutation.isPending ? '保存中...' : '保存'}
          </Button>,
        ]}
      >
        <div className="space-y-4 py-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">费用列表</span>
            <Button size="small" onClick={() => openFeeDialog()}>
              <Plus className="h-4 w-4 mr-1" />
              添加
            </Button>
          </div>

          {directFees.length > 0 && (
            <div className="space-y-2">
              {directFees.map((fee) => (
                <div key={fee.id} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{fee.name}</span>
                      <span className="text-sm text-gray-500">¥{fee.amount}/{CYCLE_LABELS[fee.cycle]}</span>
                    </div>
                    {fee.notes && <p className="text-xs text-gray-500 mt-1">{fee.notes}</p>}
                  </div>
                  <Button type="text" size="small" onClick={() => openFeeDialog(fee)}>
                    编辑
                  </Button>
                  <Button type="text" size="small" danger onClick={() => removeFee(fee.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {directFees.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">暂无费用项目，点击添加</p>
          )}
        </div>
      </Modal>

      {/* 费用项编辑对话框 */}
      <Modal
        open={showFeeDialog}
        onCancel={() => setShowFeeDialog(false)}
        title={editingFee ? '编辑费用' : '添加费用'}
        footer={[
          <Button key="cancel" onClick={() => setShowFeeDialog(false)}>取消</Button>,
          <Button key="submit" type="primary" onClick={saveFee} disabled={!feeFormData.name || (feeFormData.name === 'custom' && !feeFormData.customName.trim()) || !feeFormData.amount}>
            {editingFee ? '保存' : '添加'}
          </Button>,
        ]}
      >
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>费用类型</Label>
            <Select value={feeFormData.name} onChange={(value) => setFeeFormData((prev) => ({ ...prev, name: value }))} placeholder="选择费用类型">
              {PREDEFINED_FEE_TYPES.map((type) => (
                <Select.Option key={type.code} value={type.code}>
                  {type.name}
                </Select.Option>
              ))}
              <Select.Option value="custom">自定义</Select.Option>
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
            <InputNumber
              value={feeFormData.amount ? parseFloat(feeFormData.amount) : undefined}
              onChange={(val) => setFeeFormData((prev) => ({ ...prev, amount: val !== null && val !== undefined ? String(val) : '' }))}
              min={0}
              step={0.01}
              placeholder="0.00"
              style={{ width: '100%' }}
            />
          </div>

          <div className="space-y-2">
            <Label>计费周期</Label>
            <Select value={feeFormData.cycle} onChange={(value) => setFeeFormData((prev) => ({ ...prev, cycle: value as BillingCycle }))}>
              <Select.Option value="monthly">每月</Select.Option>
              <Select.Option value="quarterly">每季</Select.Option>
              <Select.Option value="yearly">每年</Select.Option>
              <Select.Option value="one_time">一次性</Select.Option>
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
      </Modal>
    </>
  );
}
