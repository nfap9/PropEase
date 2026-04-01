'use client';

import { useState, useEffect, useCallback } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Card, CardContent } from '@apartment-ultra/shared-ui/components/ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@apartment-ultra/shared-ui/components/ui';
import { Input } from '@apartment-ultra/shared-ui/components/ui';
import { Label } from '@apartment-ultra/shared-ui/components/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@apartment-ultra/shared-ui/components/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@apartment-ultra/shared-ui/components/ui';
import {
  Plus,
  Pencil,
  Trash2,
  DollarSign,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { feeItemsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth/context';
import { PermissionPageGuard } from '@/components/layout/permission-page-guard';
import { usePermissions, PERMISSIONS } from '@/hooks/use-permissions';
import { canAccessRule } from '@/lib/permission-access';
import type { OrgFeeItem, FeeCycle, FeeCategory } from '@apartment-ultra/api-contract';

const CATEGORY_LABELS: Record<FeeCategory, string> = {
  fixed: '固定费用',
  utility: '水电费用',
  optional: '可选费用',
};

const CYCLE_LABELS: Record<FeeCycle, string> = {
  monthly: '每月',
  quarterly: '每季',
  yearly: '每年',
  one_time: '一次性',
};

export default function FeeConfigPage() {
  const pageSizeOptions = [5, 10, 20];
  const { organization } = useAuth();
  const { permissions, hasPermission, isSuperAdmin } = usePermissions();
  const orgId = organization?.id;
  const canAccessFeeConfigs = canAccessRule(
    { requiresOrganization: true, permission: PERMISSIONS.SETTINGS_VIEW },
    {
      organization,
      permissions,
      isSuperAdmin,
      hasPermission,
    }
  );
  const [feeItems, setFeeItems] = useState<OrgFeeItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 费用项目对话框
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<OrgFeeItem | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState<FeeCategory>('optional');
  const [itemAmount, setItemAmount] = useState('');
  const [itemCycle, setItemCycle] = useState<FeeCycle>('monthly');

  // 展开状态（保留兼容性，但新 API 没有规格）
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [pageSize, setPageSize] = useState(10);
  const [pageIndex, setPageIndex] = useState(0);

  const loadData = useCallback(async () => {
    if (!orgId || !canAccessFeeConfigs) return;
    try {
      setLoading(true);
      const data = await feeItemsApi.list(orgId);
      setFeeItems(data);
    } catch (error) {
      console.error('加载失败:', error);
    } finally {
      setLoading(false);
    }
  }, [canAccessFeeConfigs, orgId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setPageIndex(0);
  }, [pageSize]);

  // 切换展开（保留 UI 兼容性）
  const toggleExpand = (itemId: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  // 打开费用项目对话框
  const openDialog = (item?: OrgFeeItem) => {
    if (item) {
      setEditingItem(item);
      setItemName(item.name);
      setItemCategory(item.category);
      setItemAmount(String(item.amount));
      setItemCycle(item.cycle);
    } else {
      setEditingItem(null);
      setItemName('');
      setItemCategory('optional');
      setItemAmount('');
      setItemCycle('monthly');
    }
    setDialogOpen(true);
  };

  // 保存费用项目
  const saveItem = async () => {
    if (!orgId || !itemName.trim() || !itemAmount) return;
    try {
      const data = {
        name: itemName.trim(),
        category: itemCategory,
        amount: parseFloat(itemAmount),
        cycle: itemCycle,
      };
      if (editingItem) {
        await feeItemsApi.update(orgId, editingItem.id, data);
      } else {
        await feeItemsApi.create(orgId, data);
      }
      setDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('保存失败:', error);
    }
  };

  // 删除费用项目
  const deleteItem = async (id: string) => {
    if (!orgId) return;
    if (confirm('确定要删除这个费用项目吗？')) {
      try {
        await feeItemsApi.delete(orgId, id);
        loadData();
      } catch (error) {
        console.error('删除失败:', error);
      }
    }
  };

  const pageCount = Math.max(Math.ceil(feeItems.length / pageSize), 1);
  const safePageIndex = Math.min(pageIndex, pageCount - 1);
  const pagedFeeItems = feeItems.slice(safePageIndex * pageSize, safePageIndex * pageSize + pageSize);

  return (
    <PermissionPageGuard>
      {canAccessFeeConfigs ? (
        <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <DollarSign className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-semibold tracking-tight" data-testid="fee-types-heading">费用配置</h1>
              </div>
            </div>
            <Button onClick={() => openDialog()} data-testid="fee-types-new-btn">
              <Plus className="mr-2 h-4 w-4" />
              添加费用项目
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">加载中...</div>
          ) : feeItems.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>暂无费用项目</p>
                <p className="text-sm mt-2">点击上方&ldquo;添加费用项目&rdquo;开始配置</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="overflow-hidden" data-testid="fee-types-list">
              <CardContent className="p-0 sm:p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%] text-left">名称</TableHead>
                      <TableHead className="w-[16%]">类型</TableHead>
                      <TableHead className="w-[18%]">金额</TableHead>
                      <TableHead className="w-[14%]">周期</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedFeeItems.map((item) => {
                      const isExpanded = expandedItems.has(item.id);

                      return (
                        <TableRow key={item.id}>
                          <TableCell className="text-left">
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0" />
                              )}
                              <span className="font-medium">{item.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {CATEGORY_LABELS[item.category]}
                          </TableCell>
                          <TableCell>¥{Number(item.amount)}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {CYCLE_LABELS[item.cycle]}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="sm" onClick={() => openDialog(item)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => deleteItem(item.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                <div className="flex flex-col gap-3 px-4 py-3 sm:px-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-sm">
                    <span>
                      共 <span className="text-foreground font-semibold">{feeItems.length}</span> 个费用项目
                    </span>
                    <div className="flex items-center gap-2">
                      <span>每页</span>
                      <Select value={String(pageSize)} onValueChange={(value) => setPageSize(Number(value))}>
                        <SelectTrigger className="h-8 w-[92px] bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {pageSizeOptions.map((size) => (
                            <SelectItem key={size} value={String(size)}>
                              {size} 条
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-muted-foreground text-sm">
                      第 <span className="text-foreground font-semibold">{safePageIndex + 1}</span> /{' '}
                      <span className="text-foreground font-semibold">{pageCount}</span> 页
                    </span>
                    <Button variant="outline" size="sm" onClick={() => setPageIndex(0)} disabled={safePageIndex === 0}>
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPageIndex((current) => Math.max(current - 1, 0))}
                      disabled={safePageIndex === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPageIndex((current) => Math.min(current + 1, pageCount - 1))}
                      disabled={safePageIndex >= pageCount - 1}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPageIndex(pageCount - 1)}
                      disabled={safePageIndex >= pageCount - 1}
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 费用项目对话框 */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-sm" data-testid={editingItem ? 'fee-types-edit-dialog' : 'fee-types-create-dialog'}>
            <DialogHeader>
              <DialogTitle>{editingItem ? '编辑费用项目' : '添加费用项目'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>项目名称</Label>
                <Input
                  placeholder="如：网费、物业费"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  data-testid="fee-types-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label>类型</Label>
                <Select value={itemCategory} onValueChange={(value) => setItemCategory(value as FeeCategory)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">固定费用</SelectItem>
                    <SelectItem value="utility">水电费用</SelectItem>
                    <SelectItem value="optional">可选费用</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>金额（元）</Label>
                <Input
                  type="number"
                  placeholder="100"
                  value={itemAmount}
                  onChange={(e) => setItemAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>计费周期</Label>
                <Select value={itemCycle} onValueChange={(value) => setItemCycle(value as FeeCycle)}>
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
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} data-testid="fee-types-cancel-btn">
                取消
              </Button>
              <Button onClick={saveItem} disabled={!itemName.trim() || !itemAmount} data-testid="fee-types-confirm-btn">
                {editingItem ? '保存' : '添加'}
              </Button>
            </DialogFooter>
          </DialogContent>
          </Dialog>
        </div>
        </MainLayout>
      ) : null}
    </PermissionPageGuard>
  );
}
