'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
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
  id: string;
  name: string;
  amount: number;
  cycle: BillingCycle;
  notes: string;
}

interface FeeItemsEditorProps {
  items: FeeItem[];
  onChange: (items: FeeItem[]) => void;
  disabled?: boolean;
}

export function FeeItemsEditor({ items, onChange, disabled }: FeeItemsEditorProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<FeeItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    customName: '',
    amount: '',
    cycle: 'monthly' as BillingCycle,
    notes: '',
  });

  // 打开费用对话框
  const openDialog = (item?: FeeItem) => {
    if (item) {
      setEditingItem(item);
      const predefined = PREDEFINED_FEE_TYPES.find((t) => t.name === item.name);
      if (predefined) {
        setFormData({ name: predefined.code, customName: '', amount: String(item.amount), cycle: item.cycle, notes: item.notes });
      } else {
        setFormData({ name: 'custom', customName: item.name, amount: String(item.amount), cycle: item.cycle, notes: item.notes });
      }
    } else {
      setEditingItem(null);
      setFormData({ name: '', customName: '', amount: '', cycle: 'monthly', notes: '' });
    }
    setShowDialog(true);
  };

  // 保存费用
  const handleSave = () => {
    const name = formData.name === 'custom'
      ? formData.customName.trim()
      : PREDEFINED_FEE_TYPES.find(t => t.code === formData.name)?.name || formData.customName;

    if (!name || !formData.amount) return;

    const newItem: FeeItem = {
      id: editingItem?.id || crypto.randomUUID(),
      name,
      amount: parseFloat(formData.amount),
      cycle: formData.cycle,
      notes: formData.notes,
    };

    if (editingItem) {
      onChange(items.map((f) => (f.id === editingItem.id ? newItem : f)));
    } else {
      onChange([...items, newItem]);
    }
    setShowDialog(false);
  };

  // 移除费用
  const handleRemove = (id: string) => {
    onChange(items.filter((f) => f.id !== id));
  };

  return (
    <>
      <div className="space-y-3 border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base">费用项目</Label>
            <p className="text-sm text-muted-foreground">添加租金外的其他费用，按所选周期与房租一起出账</p>
          </div>
          {!disabled && (
            <Button type="button" variant="outline" size="sm" onClick={() => openDialog()}>
              <Plus className="h-4 w-4 mr-1" />
              添加费用
            </Button>
          )}
        </div>

        {/* 已添加的费用列表 */}
        {items.length > 0 && (
          <div className="space-y-2">
            {items.map((fee) => (
              <div key={fee.id} className="flex items-center gap-3 bg-muted/50 rounded-lg p-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{fee.name}</span>
                    <span className="text-sm text-muted-foreground">¥{fee.amount}/{CYCLE_LABELS[fee.cycle]}</span>
                  </div>
                  {fee.notes && <p className="text-xs text-muted-foreground mt-1">{fee.notes}</p>}
                </div>
                {!disabled && (
                  <>
                    <Button type="button" variant="ghost" size="sm" onClick={() => openDialog(fee)}>
                      编辑
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => handleRemove(fee.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {items.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">暂无费用项目</p>
        )}
      </div>

      {/* 费用编辑对话框 */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingItem ? '编辑费用' : '添加费用'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>费用类型</Label>
              <Select value={formData.name} onValueChange={(value) => setFormData((prev) => ({ ...prev, name: value }))}>
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
              <Select value={formData.cycle} onValueChange={(value) => setFormData((prev) => ({ ...prev, cycle: value as BillingCycle }))}>
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
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>取消</Button>
            <Button
              onClick={handleSave}
              disabled={
                !formData.name ||
                (formData.name === 'custom' && !formData.customName.trim()) ||
                !formData.amount
              }
            >
              {editingItem ? '保存' : '添加'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
