import { useState } from 'react';
import { Button, Input, Modal, Select } from 'antd';
import { Label } from '@/components/common/label';
import { Plus, Trash2 } from 'lucide-react';

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

export interface FeeItem {
  name: string;
  amount: number;
  cycle: BillingCycle;
  notes?: string;
}

interface FeeItemsEditorProps {
  items: FeeItem[];
  onChange: (items: FeeItem[]) => void;
  disabled?: boolean;
}

export function FeeItemsEditor({ items, onChange, disabled }: FeeItemsEditorProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    customName: '',
    amount: '',
    cycle: 'monthly' as BillingCycle,
    notes: '',
  });

  const openDialog = (index?: number) => {
    if (index !== undefined && items[index]) {
      setEditingIndex(index);
      const item = items[index];
      const predefined = PREDEFINED_FEE_TYPES.find((t) => t.name === item.name);
      if (predefined) {
        setFormData({
          name: predefined.code,
          customName: '',
          amount: String(item.amount),
          cycle: item.cycle,
          notes: item.notes || '',
        });
      } else {
        setFormData({
          name: 'custom',
          customName: item.name,
          amount: String(item.amount),
          cycle: item.cycle,
          notes: item.notes || '',
        });
      }
    } else {
      setEditingIndex(null);
      setFormData({ name: '', customName: '', amount: '', cycle: 'monthly', notes: '' });
    }
    setShowDialog(true);
  };

  const handleSave = () => {
    const name =
      formData.name === 'custom'
        ? formData.customName.trim()
        : PREDEFINED_FEE_TYPES.find((t) => t.code === formData.name)?.name || formData.customName;

    if (!name || !formData.amount) return;

    const newItem: FeeItem = {
      name,
      amount: parseFloat(formData.amount),
      cycle: formData.cycle,
      notes: formData.notes || undefined,
    };

    if (editingIndex !== null) {
      onChange(items.map((f, i) => (i === editingIndex ? newItem : f)));
    } else {
      onChange([...items, newItem]);
    }
    setShowDialog(false);
  };

  const handleRemove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <>
      <div className="space-y-3 rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base">费用项目</Label>
          </div>
          {!disabled && (
            <Button onClick={() => openDialog()}>
              <Plus className="mr-1 h-4 w-4" />
              添加费用
            </Button>
          )}
        </div>

        {items.length > 0 && (
          <div className="space-y-2">
            {items.map((fee, index) => (
              <div key={`${fee.name}-${index}`} className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{fee.name}</span>
                    <span className="text-sm text-gray-500">
                      ¥{fee.amount}/{CYCLE_LABELS[fee.cycle]}
                    </span>
                  </div>
                  {fee.notes && <p className="mt-1 text-xs text-gray-500">{fee.notes}</p>}
                </div>
                {!disabled && (
                  <>
                    <Button onClick={() => openDialog(index)}>编辑</Button>
                    <Button onClick={() => handleRemove(index)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {items.length === 0 && <p className="py-4 text-center text-sm text-gray-500">暂无费用项目</p>}
      </div>

      <Modal
        open={showDialog}
        onCancel={() => setShowDialog(false)}
        title={editingIndex !== null ? '编辑费用' : '添加费用'}
        footer={[
          <Button key="cancel" onClick={() => setShowDialog(false)}>
            取消
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleSave}
            disabled={!formData.name || (formData.name === 'custom' && !formData.customName.trim()) || !formData.amount}
          >
            {editingIndex !== null ? '保存' : '添加'}
          </Button>,
        ]}
      >
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>费用类型</Label>
            <Select
              value={formData.name}
              onChange={(value) => setFormData((prev) => ({ ...prev, name: value }))}
              placeholder="选择费用类型"
            >
              {PREDEFINED_FEE_TYPES.map((type) => (
                <Select.Option key={type.code} value={type.code}>
                  {type.name}
                </Select.Option>
              ))}
              <Select.Option value="custom">自定义</Select.Option>
            </Select>
          </div>

          {formData.name === 'custom' && (
            <div className="space-y-2">
              <Label>自定义费用名称</Label>
              <Input
                placeholder="请输入费用名称"
                value={formData.customName}
                onChange={(e) => setFormData((prev) => ({ ...prev, customName: e.target.value }))}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>金额（元）</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="请输入金额"
              value={formData.amount}
              onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>计费周期</Label>
            <Select
              value={formData.cycle}
              onChange={(value) => setFormData((prev) => ({ ...prev, cycle: value as BillingCycle }))}
            >
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
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
            />
          </div>
        </div>
      </Modal>
    </>
  );
}
