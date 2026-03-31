'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appToast } from '@apartment-ultra/shared-ui/components/ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@apartment-ultra/shared-ui/components/ui';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Input } from '@apartment-ultra/shared-ui/components/ui';
import { Label } from '@apartment-ultra/shared-ui/components/ui';
import { Checkbox } from '@apartment-ultra/shared-ui/components/ui';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { feeTypesApi } from '@/lib/api';
import type { FeeType, FeeTypeCreate } from '@apartment-ultra/api-contract';

interface FeeItem {
  id: string;
  name: string;
  feeTypeId?: string;
  specification?: string;
  specificationId?: string;
  unitPrice: number;
  quantity: number;
  billingCycle: 'monthly' | 'yearly';
}

interface FeeItemsEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  leaseId: string;
  currentItems: FeeItem[];
  onSave: (items: FeeItem[]) => void;
}

type BillingCycle = 'monthly' | 'yearly';

const BILLING_CYCLE_LABELS: Record<BillingCycle, string> = {
  monthly: '每月',
  yearly: '每年',
};

const CATEGORY_LABELS: Record<string, string> = {
  fixed: '固定',
  utility: '水电',
  optional: '可选',
};

export function FeeItemsEditorDialog({
  open,
  onOpenChange,
  orgId,
  leaseId,
  currentItems,
  onSave,
}: FeeItemsEditorDialogProps) {
  // 已选中的费用项目（完整对象，可编辑单价）
  const [selectedItems, setSelectedItems] = useState<FeeItem[]>([]);
  // 是否显示新建表单
  const [isAddingNew, setIsAddingNew] = useState(false);

  // 新建费用类型表单状态
  const [newFeeName, setNewFeeName] = useState('');
  const [newFeeCategory, setNewFeeCategory] = useState<string>('fixed');
  const [newFeePrice, setNewFeePrice] = useState('');
  const [newFeeCycle, setNewFeeCycle] = useState<BillingCycle>('monthly');

  // 获取费用类型列表
  const { data: feeTypes, isLoading } = useQuery({
    queryKey: ['fee-types', orgId],
    queryFn: () => feeTypesApi.list(orgId),
    enabled: !!orgId && open,
  });

  const queryClient = useQueryClient();

  // 创建费用类型
  const createFeeTypeMutation = useMutation({
    mutationFn: async (data: FeeTypeCreate) => {
      return feeTypesApi.create(orgId, data);
    },
    onSuccess: (newFeeType) => {
      queryClient.invalidateQueries({ queryKey: ['fee-types', orgId] });
      appToast.success('费用类型创建成功');

      // 自动选中新创建的项目
      const newItem: FeeItem = {
        id: `new-${newFeeType.id}-${Date.now()}`,
        name: newFeeType.name,
        feeTypeId: newFeeType.id,
        unitPrice: parseFloat(newFeePrice) || 0,
        quantity: 1,
        billingCycle: newFeeCycle,
      };
      setSelectedItems((prev) => [...prev, newItem]);

      // 重置表单
      setNewFeeName('');
      setNewFeePrice('');
      setIsAddingNew(false);
    },
    onError: () => appToast.error('创建失败'),
  });

  // 初始化
  useEffect(() => {
    if (open) {
      setSelectedItems(currentItems.length > 0 ? [...currentItems] : []);
      setIsAddingNew(false);
    }
  }, [open, currentItems]);

  // 构建平铺的列表数据
  const flatItems = useMemo(() => {
    if (!feeTypes) return [];

    const result: Array<{
      key: string;
      feeTypeId: string;
      feeTypeName: string;
      feeTypeCategory: string;
      specId?: string;
      specName?: string;
      unitPrice: number;
      billingCycle: BillingCycle;
    }> = [];

    feeTypes.forEach((ft) => {
      if (!ft.is_active) return;

      if (ft.specifications && ft.specifications.length > 0) {
        ft.specifications
          .filter((s) => s.is_active)
          .forEach((spec) => {
            result.push({
              key: `${ft.id}-${spec.id}`,
              feeTypeId: ft.id,
              feeTypeName: ft.name,
              feeTypeCategory: ft.category,
              specId: spec.id,
              specName: spec.name,
              unitPrice: Number(spec.price_monthly),
              billingCycle: spec.price_yearly ? 'yearly' : 'monthly',
            });
          });
      } else {
        result.push({
          key: `${ft.id}-new`,
          feeTypeId: ft.id,
          feeTypeName: ft.name,
          feeTypeCategory: ft.category,
          unitPrice: 0,
          billingCycle: 'monthly',
        });
      }
    });

    return result;
  }, [feeTypes]);

  // 检查某项是否已选中
  const isItemSelected = (key: string) => {
    return selectedItems.some((item) => {
      const itemKey = item.specificationId
        ? `${item.feeTypeId}-${item.specificationId}`
        : `${item.feeTypeId}-new`;
      return itemKey === key;
    });
  };

  // 切换勾选状态
  const toggleItem = (item: {
    key: string;
    feeTypeId: string;
    feeTypeName: string;
    specId?: string;
    specName?: string;
    unitPrice: number;
    billingCycle: BillingCycle;
  }) => {
    const existingIndex = selectedItems.findIndex((sel) => {
      const selKey = sel.specificationId
        ? `${sel.feeTypeId}-${sel.specificationId}`
        : `${sel.feeTypeId}-new`;
      return selKey === item.key;
    });

    if (existingIndex >= 0) {
      // 取消选中
      setSelectedItems((prev) => prev.filter((_, idx) => idx !== existingIndex));
    } else {
      // 选中
      const newItem: FeeItem = {
        id: `${item.key}-${Date.now()}`,
        name: item.specName || item.feeTypeName,
        feeTypeId: item.feeTypeId,
        specification: item.specName,
        specificationId: item.specId,
        unitPrice: item.unitPrice,
        quantity: 1,
        billingCycle: item.billingCycle,
      };
      setSelectedItems((prev) => [...prev, newItem]);
    }
  };

  // 更新已选项目的数量
  const updateQuantity = (id: string, qty: number) => {
    setSelectedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: Math.max(1, qty) } : item))
    );
  };

  // 更新已选项目的单价
  const updateUnitPrice = (id: string, price: number) => {
    setSelectedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, unitPrice: Math.max(0, price) } : item))
    );
  };

  // 更新已选项目的周期
  const updateCycle = (id: string, cycle: BillingCycle) => {
    setSelectedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, billingCycle: cycle } : item))
    );
  };

  // 删除已选项目
  const removeItem = (id: string) => {
    setSelectedItems((prev) => prev.filter((item) => item.id !== id));
  };

  // 处理添加新费用类型
  const handleAddNewFeeType = () => {
    if (!newFeeName.trim()) {
      appToast.error('请输入费用名称');
      return;
    }
    const price = parseFloat(newFeePrice) || 0;

    const feeTypeData: FeeTypeCreate = {
      name: newFeeName.trim(),
      code: `fee_${Date.now()}`,
      category: newFeeCategory as 'fixed' | 'utility' | 'optional',
      specifications: [
        {
          name: newFeeName.trim(),
          price_monthly: price,
          price_yearly: newFeeCycle === 'yearly' ? price : undefined,
        },
      ],
    };

    createFeeTypeMutation.mutate(feeTypeData);
  };

  // 保存
  const handleSave = () => {
    onSave(selectedItems);
    onOpenChange(false);
  };

  const selectedCount = selectedItems.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>选择费用项目</DialogTitle>
          <DialogDescription>勾选要添加到租约的费用项目</DialogDescription>
        </DialogHeader>

        {/* 已选费用列表（可编辑单价） */}
        {selectedItems.length > 0 && (
          <div className="border rounded-md">
            <div className="bg-muted/50 px-3 py-2 text-sm font-medium">已选费用</div>
            <div className="max-h-40 overflow-y-auto">
              {selectedItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 px-3 py-2 border-t first:border-t-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{item.name}</div>
                    {item.specification && (
                      <div className="text-xs text-muted-foreground truncate">
                        {item.specification}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-xs text-muted-foreground">¥</span>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) =>
                        updateUnitPrice(item.id, parseFloat(e.target.value) || 0)
                      }
                      className="w-20 h-7 text-center text-sm"
                    />
                    <select
                      className="h-7 px-1 rounded border border-input bg-background text-xs"
                      value={item.billingCycle}
                      onChange={(e) => updateCycle(item.id, e.target.value as BillingCycle)}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="monthly">月</option>
                      <option value="yearly">年</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <span className="text-xs">-</span>
                    </Button>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateQuantity(item.id, parseInt(e.target.value) || 1)
                      }
                      className="w-14 h-7 text-center text-sm"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <span className="text-xs">+</span>
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 工具栏 */}
        <div className="flex justify-between items-center py-2">
          <span className="text-sm text-muted-foreground">
            已选择 {selectedCount} 项
          </span>
          <Button size="sm" onClick={() => setIsAddingNew(true)}>
            <Plus className="h-4 w-4 mr-1" />
            新建费用
          </Button>
        </div>

        {/* 费用项目表格 */}
        <div className="flex-1 overflow-y-auto border rounded-md">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : flatItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              暂无法费项目，点击上方&quot;新建费用&quot;添加
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  <th className="w-10 px-3 py-2 text-left"></th>
                  <th className="px-3 py-2 text-left font-medium">类型</th>
                  <th className="px-3 py-2 text-left font-medium">名称</th>
                  <th className="px-3 py-2 text-right font-medium">价格</th>
                  <th className="px-3 py-2 text-center font-medium">周期</th>
                </tr>
              </thead>
              <tbody>
                {flatItems.map((item) => {
                  const isSelected = isItemSelected(item.key);
                  return (
                    <tr
                      key={item.key}
                      className={`border-t hover:bg-muted/30 transition-colors cursor-pointer ${
                        isSelected ? 'bg-primary/5' : ''
                      }`}
                      onClick={() => toggleItem(item)}
                    >
                      <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={isSelected} onCheckedChange={() => toggleItem(item)} />
                      </td>
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-muted">
                          {CATEGORY_LABELS[item.feeTypeCategory] || item.feeTypeCategory}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-medium">{item.feeTypeName}</div>
                        {item.specName && (
                          <div className="text-xs text-muted-foreground">
                            → {item.specName}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        ¥{item.unitPrice.toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {BILLING_CYCLE_LABELS[item.billingCycle]}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* 合计 */}
        {selectedCount > 0 && (
          <div className="flex justify-between items-center py-3 border-t">
            <span className="font-medium">合计</span>
            <span className="text-lg font-bold">
              ¥
              {selectedItems
                .reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
                .toLocaleString()}
              /月
            </span>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={selectedCount === 0}>
            保存 ({selectedCount})
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* 新建费用弹窗（直接打开，不嵌套） */}
      <Dialog open={isAddingNew} onOpenChange={(open) => {
        setIsAddingNew(open);
        if (!open) {
          setNewFeeName('');
          setNewFeePrice('');
        }
      }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>新建费用</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label>费用名称 *</Label>
              <Input
                value={newFeeName}
                onChange={(e) => setNewFeeName(e.target.value)}
                placeholder="如：物业费"
              />
            </div>

            <div>
              <Label>类型</Label>
              <select
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                value={newFeeCategory}
                onChange={(e) => setNewFeeCategory(e.target.value)}
              >
                <option value="fixed">固定</option>
                <option value="utility">水电</option>
                <option value="optional">可选</option>
              </select>
            </div>

            <div>
              <Label>价格 *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={newFeePrice}
                onChange={(e) => setNewFeePrice(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label>周期</Label>
              <select
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                value={newFeeCycle}
                onChange={(e) => setNewFeeCycle(e.target.value as BillingCycle)}
              >
                <option value="monthly">每月</option>
                <option value="yearly">每年</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddingNew(false);
                setNewFeeName('');
                setNewFeePrice('');
              }}
            >
              取消
            </Button>
            <Button
              onClick={handleAddNewFeeType}
              disabled={createFeeTypeMutation.isPending || !newFeeName.trim()}
            >
              {createFeeTypeMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : null}
              创建并添加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
