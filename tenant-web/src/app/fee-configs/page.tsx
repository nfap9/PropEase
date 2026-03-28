'use client';

import { useState, useEffect, useCallback } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@apartment-ultra/shared-ui/components/ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@apartment-ultra/shared-ui/components/ui';
import { Input } from '@apartment-ultra/shared-ui/components/ui';
import { Label } from '@apartment-ultra/shared-ui/components/ui';
import { Plus, Pencil, Trash2, DollarSign, ChevronDown, ChevronRight } from 'lucide-react';
import { feeTypesApi } from '@/lib/api';
import { useAuth } from '@/lib/auth/context';
import { PermissionPageGuard } from '@/components/layout/permission-page-guard';
import { usePermissions, PERMISSIONS } from '@/hooks/use-permissions';
import { canAccessRule } from '@/lib/permission-access';
import type { FeeType, FeeSpecification } from '@apartment-ultra/api-contract';

export default function FeeConfigPage() {
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

  // 规格对话框
  const [specDialogOpen, setSpecDialogOpen] = useState(false);
  const [parentType, setParentType] = useState<FeeType | null>(null);
  const [editingSpec, setEditingSpec] = useState<FeeSpecification | null>(null);
  const [specName, setSpecName] = useState('');
  const [specPrice, setSpecPrice] = useState('');

  // 展开状态
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());

  const loadData = useCallback(async () => {
    if (!orgId || !canAccessFeeConfigs) return;
    try {
      setLoading(true);
      const data = await feeTypesApi.list(orgId);
      setFeeTypes(data);
    } catch (error) {
      console.error('加载失败:', error);
    } finally {
      setLoading(false);
    }
  }, [canAccessFeeConfigs, orgId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 切换展开
  const toggleExpand = (typeId: string) => {
    setExpandedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(typeId)) {
        next.delete(typeId);
      } else {
        next.add(typeId);
      }
      return next;
    });
  };

  // 打开费用类型对话框
  const openTypeDialog = (type?: FeeType) => {
    if (type) {
      setEditingType(type);
      setTypeName(type.name);
    } else {
      setEditingType(null);
      setTypeName('');
    }
    setTypeDialogOpen(true);
  };

  // 保存费用类型
  const saveType = async () => {
    if (!orgId || !typeName.trim()) return;
    try {
      if (editingType) {
        await feeTypesApi.update(orgId, editingType.id, { name: typeName });
      } else {
        await feeTypesApi.create(orgId, {
          name: typeName,
          code: `fee_${Date.now()}`,
          category: 'optional',
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
    } else {
      setEditingSpec(null);
      setSpecName('');
      setSpecPrice('');
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
        });
      } else {
        await feeTypesApi.addSpecification(orgId, parentType.id, {
          name: specName,
          price_monthly: parseFloat(specPrice),
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
            <Button onClick={() => openTypeDialog()} data-testid="fee-types-new-btn">
              <Plus className="mr-2 h-4 w-4" />
              添加费用类型
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">加载中...</div>
          ) : feeTypes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>暂无费用类型</p>
                <p className="text-sm mt-2">点击上方&ldquo;添加费用类型&rdquo;开始配置</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4" data-testid="fee-types-list">
            {feeTypes.map((type) => {
              const isExpanded = expandedTypes.has(type.id);
              const specs = type.specifications || [];

              return (
                <Card key={type.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div
                        className="flex items-center gap-2 cursor-pointer flex-1"
                        onClick={() => toggleExpand(type.id)}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        )}
                        <CardTitle className="text-lg">{type.name}</CardTitle>
                        <span className="text-sm text-muted-foreground">
                          ({specs.length} 个规格)
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openTypeDialog(type)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteType(type.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {isExpanded && (
                    <CardContent className="pt-0">
                      {specs.length > 0 ? (
                        <div className="space-y-2 mb-3">
                          {specs.map((spec) => (
                            <div
                              key={spec.id}
                              className="flex items-center justify-between rounded-lg border p-3"
                            >
                              <div>
                                <span className="font-medium">{spec.name}</span>
                                <span className="ml-3 text-muted-foreground">
                                  ¥{Number(spec.price_monthly)}
                                </span>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openSpecDialog(type, spec)}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteSpec(spec.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground mb-3">暂无规格</p>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openSpecDialog(type)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        添加规格
                      </Button>
                    </CardContent>
                  )}
                </Card>
              );
            })}
            </div>
          )}

          {/* 费用类型对话框 */}
          <Dialog open={typeDialogOpen} onOpenChange={setTypeDialogOpen}>
          <DialogContent className="max-w-sm" data-testid={editingType ? 'fee-types-edit-dialog' : 'fee-types-create-dialog'}>
            <DialogHeader>
              <DialogTitle>{editingType ? '编辑费用类型' : '添加费用类型'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>类型名称</Label>
                <Input
                  placeholder="如：网费、物业费"
                  value={typeName}
                  onChange={(e) => setTypeName(e.target.value)}
                  data-testid="fee-types-name-input"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setTypeDialogOpen(false)} data-testid="fee-types-cancel-btn">
                取消
              </Button>
              <Button onClick={saveType} disabled={!typeName.trim()} data-testid="fee-types-confirm-btn">
                {editingType ? '保存' : '添加'}
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
                <Label>价格（元）</Label>
                <Input
                  type="number"
                  placeholder="100"
                  value={specPrice}
                  onChange={(e) => setSpecPrice(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSpecDialogOpen(false)}>
                取消
              </Button>
              <Button
                onClick={saveSpec}
                disabled={!specName.trim() || !specPrice}
              >
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
