
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leasesApi } from '@/api/leases';
import { Button, Card, Input, Select, Modal, InputNumber } from 'antd';
import { Label } from '@/components/common/label';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

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
    queryFn: () => leasesApi.get(leaseId),
  });

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
      setOpenDialog(false);
    },
    onError: () => {
      toast.error('更新费用项目失败');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
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
        <Button onClick={() => handleOpenDialog(true)}>
          <Pencil className="h-4 w-4 mr-2" />
          编辑
        </Button>
      </div>

      {currentItems.length === 0 ? (
        <Card>
          <Card.Meta description="暂无费用项目" />
        </Card>
      ) : (
        <Card title="费用明细">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
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
                  <td className="py-2 text-right text-gray-500">
                    {CYCLE_LABELS[item.cycle]}
                  </td>
                  <td className="py-2 text-right font-medium">
                    ¥{item.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* 编辑费用对话框 */}
      <Modal
        open={openDialog}
        onCancel={() => handleOpenDialog(false)}
        title="编辑费用项目"
        footer={[
          <Button key="cancel" onClick={() => handleOpenDialog(false)}>取消</Button>,
          <Button key="submit" type="primary" loading={setFeeItemsMutation.isPending} onClick={handleSave}>
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
    </div>
  );
}
