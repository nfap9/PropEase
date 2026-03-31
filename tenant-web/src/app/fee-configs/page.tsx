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
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  ChevronRight,
} from 'lucide-react';
import { feeTypesApi } from '@/lib/api';
import { useAuth } from '@/lib/auth/context';
import { PermissionPageGuard } from '@/components/layout/permission-page-guard';
import { usePermissions, PERMISSIONS } from '@/hooks/use-permissions';
import { canAccessRule } from '@/lib/permission-access';
import type { FeeType, FeeSpecification } from '@apartment-ultra/api-contract';

const CATEGORY_LABELS: Record<string, string> = {
  fixed: '固定',
  utility: '水电',
  optional: '可选',
};

export default function FeeConfigPage() {
  const pageSizeOptions = [10, 20, 50];
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
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
  const [loading, setLoading] = useState(true);

  // 费用类型对话框
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<FeeType | null>(null);
  const [typeName, setTypeName] = useState('');
  const [typeCategory, setTypeCategory] = useState<string>('optional');

  // 规格对话框
  const [specDialogOpen, setSpecDialogOpen] = useState(false);
  const [parentType, setParentType] = useState<FeeType | null>(null);
  const [editingSpec, setEditingSpec] = useState<FeeSpecification | null>(null);
  const [specName, setSpecName] = useState('');
  const [specPrice, setSpecPrice] = useState('');
  const [specPriceYearly, setSpecPriceYearly] = useState('');

  // 分页
  const [pageSize, setPageSize] = useState(20);
  const [pageIndex, setPageIndex] = useState(0);

  // 将所有费用项目和规格平铺
  const [flatItems, setFlatItems] = useState<
    Array<{
      id: string;
      typeId: string;
      name: string;
      category: string;
      isSpec: boolean;
      specId?: string;
      priceMonthly: number | null;
      priceYearly: number | null;
    }>
  >([]);

  const loadData = useCallback(async () => {
    if (!orgId || !canAccessFeeConfigs) return;
    try {
      setLoading(true);
      const data = await feeTypesApi.list(orgId);
      setFeeTypes(data);

      // 平铺所有项目和规格
      const flat: typeof flatItems = [];
      data.forEach((ft) => {
        if (ft.specifications && ft.specifications.length > 0) {
          ft.specifications.forEach((spec) => {
            flat.push({
              id: spec.id,
              typeId: ft.id,
              name: spec.name,
              category: ft.category,
              isSpec: true,
              specId: spec.id,
              priceMonthly: spec.price_monthly,
              priceYearly: spec.price_yearly,
            });
          });
        } else {
          flat.push({
            id: ft.id,
            typeId: ft.id,
            name: ft.name,
            category: ft.category,
            isSpec: false,
            priceMonthly: null,
            priceYearly: null,
          });
        }
      });
      setFlatItems(flat);
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

  // 打开费用类型对话框
  const openTypeDialog = (type?: FeeType) => {
    if (type) {
      setEditingType(type);
      setTypeName(type.name);
      setTypeCategory(type.category);
    } else {
      setEditingType(null);
      setTypeName('');
      setTypeCategory('optional');
    }
    setTypeDialogOpen(true);
  };

  // 保存费用类型
  const saveType = async () => {
    if (!orgId || !typeName.trim()) return;
    try {
      if (editingType) {
        await feeTypesApi.update(orgId, editingType.id, {
          name: typeName,
          category: typeCategory as 'fixed' | 'utility' | 'optional',
        });
      } else {
        await feeTypesApi.create(orgId, {
          name: typeName,
          code: `fee_${Date.now()}`,
          category: typeCategory as 'fixed' | 'utility' | 'optional',
        });
      }
      setTypeDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('保存失败:', error);
    }
  };

  // 删除费用类型
  const deleteType = async (id: string) => {
    if (!orgId) return;
    if (confirm('确定要删除这个费用类型吗？相关规格也会被删除。')) {
      try {
        await feeTypesApi.delete(orgId, id);
        loadData();
      } catch (error) {
        console.error('删除失败:', error);
      }
    }
  };

  // 打开规格对话框
  const openSpecDialog = (type: FeeType, spec?: FeeSpecification) => {
    setParentType(type);
    if (spec) {
      setEditingSpec(spec);
      setSpecName(spec.name);
      setSpecPrice(String(spec.price_monthly));
      setSpecPriceYearly(spec.price_yearly ? String(spec.price_yearly) : '');
    } else {
      setEditingSpec(null);
      setSpecName('');
      setSpecPrice('');
      setSpecPriceYearly('');
    }
    setSpecDialogOpen(true);
  };

  // 保存规格
  const saveSpec = async () => {
    if (!orgId || !parentType || !specName.trim() || !specPrice) return;
    try {
      if (editingSpec) {
        await feeTypesApi.updateSpecification(orgId, editingSpec.id, {
          name: specName,
          price_monthly: parseFloat(specPrice),
          price_yearly: specPriceYearly ? parseFloat(specPriceYearly) : undefined,
        });
      } else {
        await feeTypesApi.addSpecification(orgId, parentType.id, {
          name: specName,
          price_monthly: parseFloat(specPrice),
          price_yearly: specPriceYearly ? parseFloat(specPriceYearly) : undefined,
        });
      }
      setSpecDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('保存规格失败:', error);
    }
  };

  // 删除规格
  const deleteSpec = async (specId: string) => {
    if (!orgId) return;
    if (confirm('确定要删除这个规格吗？')) {
      try {
        await feeTypesApi.deleteSpecification(orgId, specId);
        loadData();
      } catch (error) {
        console.error('删除规格失败:', error);
      }
    }
  };

  const pageCount = Math.max(Math.ceil(flatItems.length / pageSize), 1);
  const safePageIndex = Math.min(pageIndex, pageCount - 1);
  const pagedItems = flatItems.slice(safePageIndex * pageSize, safePageIndex * pageSize + pageSize);

  // 获取费用类型名称
  const getTypeName = (typeId: string) => {
    return feeTypes.find((ft) => ft.id === typeId)?.name || '-';
  };

  return (
    <PermissionPageGuard>
      {canAccessFeeConfigs ? (
        <MainLayout>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <DollarSign className="h-8 w-8" />
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight" data-testid="fee-types-heading">
                    费用配置
                  </h1>
                </div>
              </div>
              <Button onClick={() => openTypeDialog()} data-testid="fee-types-new-btn">
                <Plus className="mr-2 h-4 w-4" />
                新建费用
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-8">加载中...</div>
            ) : flatItems.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>暂无法用项目</p>
                  <p className="text-sm mt-2">点击上方&quot;新建费用&quot;开始配置</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="overflow-hidden" data-testid="fee-types-list">
                <CardContent className="p-0 sm:p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[15%]">类型</TableHead>
                        <TableHead className="w-[20%]">所属费用</TableHead>
                        <TableHead className="w-[25%]">名称</TableHead>
                        <TableHead className="w-[15%] text-right">月价格</TableHead>
                        <TableHead className="w-[15%] text-right">年价格</TableHead>
                        <TableHead className="w-[10%] text-right">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagedItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                                item.isSpec
                                  ? 'bg-primary/10 text-primary'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {item.isSpec ? '规格' : '费用'}
                            </span>
                          </TableCell>
                          <TableCell>
                            {item.isSpec ? (
                              <span className="text-muted-foreground">{getTypeName(item.typeId)}</span>
                            ) : (
                              <span className="font-medium">{CATEGORY_LABELS[item.category] || item.category}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className={item.isSpec ? '' : 'font-medium'}>{item.name}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            {item.priceMonthly !== null ? `¥${item.priceMonthly}` : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.priceYearly !== null ? `¥${item.priceYearly}` : '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-1">
                              {item.isSpec ? (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const type = feeTypes.find((ft) => ft.id === item.typeId);
                                      if (type) openSpecDialog(type, type.specifications?.find((s) => s.id === item.specId));
                                    }}
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => deleteSpec(item.id)}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const type = feeTypes.find((ft) => ft.id === item.typeId);
                                      if (type) openSpecDialog(type);
                                    }}
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => openTypeDialog(feeTypes.find((ft) => ft.id === item.typeId)!)}>
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => deleteType(item.id)}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="flex flex-col gap-3 px-4 py-3 sm:px-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-sm">
                      <span>
                        共 <span className="text-foreground font-semibold">{flatItems.length}</span> 个费用项目
                      </span>
                      <div className="flex items-center gap-2">
                        <span>每页</span>
                        <Select
                          value={String(pageSize)}
                          onValueChange={(value) => setPageSize(Number(value))}
                        >
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPageIndex(0)}
                        disabled={safePageIndex === 0}
                      >
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

            {/* 费用类型对话框 */}
            <Dialog open={typeDialogOpen} onOpenChange={setTypeDialogOpen}>
              <DialogContent className="max-w-sm" data-testid={editingType ? 'fee-types-edit-dialog' : 'fee-types-create-dialog'}>
                <DialogHeader>
                  <DialogTitle>{editingType ? '编辑费用' : '新建费用'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>名称</Label>
                    <Input
                      placeholder="如：物业费"
                      value={typeName}
                      onChange={(e) => setTypeName(e.target.value)}
                      data-testid="fee-types-name-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>类型</Label>
                    <select
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                      value={typeCategory}
                      onChange={(e) => setTypeCategory(e.target.value)}
                    >
                      <option value="fixed">固定</option>
                      <option value="utility">水电</option>
                      <option value="optional">可选</option>
                    </select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setTypeDialogOpen(false)}
                    data-testid="fee-types-cancel-btn"
                  >
                    取消
                  </Button>
                  <Button onClick={saveType} disabled={!typeName.trim()} data-testid="fee-types-confirm-btn">
                    {editingType ? '保存' : '创建'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* 规格对话框 */}
            <Dialog open={specDialogOpen} onOpenChange={setSpecDialogOpen}>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>{editingSpec ? '编辑规格' : '添加规格'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>规格名称</Label>
                    <Input
                      placeholder="如：50M服务、标准"
                      value={specName}
                      onChange={(e) => setSpecName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>月价格（元）</Label>
                    <Input
                      type="number"
                      placeholder="100"
                      value={specPrice}
                      onChange={(e) => setSpecPrice(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>年价格（元，可选）</Label>
                    <Input
                      type="number"
                      placeholder="如：1000"
                      value={specPriceYearly}
                      onChange={(e) => setSpecPriceYearly(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSpecDialogOpen(false)}>
                    取消
                  </Button>
                  <Button onClick={saveSpec} disabled={!specName.trim() || !specPrice}>
                    {editingSpec ? '保存' : '添加'}
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
