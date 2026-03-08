'use client';

import { useState, useEffect, useCallback } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2, DollarSign } from 'lucide-react';
import { feeTypesApi } from '@/lib/api';
import { useAuth } from '@/lib/auth/context';
import type { FeeType, FeeTypeCreate, FeeCategory, FeeSpecificationCreate } from '@apartment-ultra/api-contract';

export default function FeeTypesPage() {
  const { organization } = useAuth();
  const orgId = organization?.id;
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFeeType, setEditingFeeType] = useState<FeeType | null>(null);
  const [formData, setFormData] = useState<FeeTypeCreate>({
    name: '',
    code: '',
    description: '',
    category: 'fixed',
    specifications: [],
  });

  const loadFeeTypes = useCallback(async () => {
    if (!orgId) return;
    try {
      setLoading(true);
      const data = await feeTypesApi.list(orgId);
      setFeeTypes(data);
    } catch (error) {
      console.error('加载费用类型失败:', error);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    if (orgId) {
      loadFeeTypes();
    }
  }, [orgId, loadFeeTypes]);

  const handleOpenDialog = (feeType?: FeeType) => {
    if (feeType) {
      setEditingFeeType(feeType);
      setFormData({
        name: feeType.name,
        code: feeType.code,
        description: feeType.description || '',
        category: feeType.category,
        specifications: (feeType.specifications || []).map((spec): FeeSpecificationCreate => ({
          name: spec.name,
          description: spec.description ?? undefined,
          price_monthly: spec.price_monthly,
          price_yearly: spec.price_yearly ?? undefined,
          unit: spec.unit ?? undefined,
          is_default: spec.is_default,
          sort_order: spec.sort_order,
        })),
      });
    } else {
      setEditingFeeType(null);
      setFormData({
        name: '',
        code: '',
        description: '',
        category: 'fixed',
        specifications: [],
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingFeeType(null);
  };

  const handleSave = async () => {
    if (!orgId) return;
    try {
      if (editingFeeType) {
        await feeTypesApi.update(orgId, editingFeeType.id, {
          name: formData.name,
          description: formData.description,
          category: formData.category,
        });
      } else {
        await feeTypesApi.create(orgId, formData);
      }
      handleCloseDialog();
      loadFeeTypes();
    } catch (error) {
      console.error('保存费用类型失败:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!orgId) return;
    if (confirm('确定要删除这个费用类型吗？')) {
      try {
        await feeTypesApi.delete(orgId, id);
        loadFeeTypes();
      } catch (error) {
        console.error('删除费用类型失败:', error);
      }
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <DollarSign className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold" data-testid="fee-types-heading">费用类型管理</h1>
              <p className="text-muted-foreground">管理公寓费用类型和规格和定价</p>
            </div>
          </div>
          <Button onClick={() => handleOpenDialog()} data-testid="fee-types-new-btn">
            <Plus className="mr-2 h-4 w-4" />
            新增费用类型
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8">加载中...</div>
        ) : feeTypes.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              暂无费用类型，请点击&ldquo;新增费用类型&rdquo;创建
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" data-testid="fee-types-list">
            {feeTypes.map((feeType) => (
              <Card key={feeType.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {feeType.name}
                        {feeType.organization_id === null && (
                          <span className="text-xs bg-muted px-2 py-0.5 rounded">系统预设</span>
                        )}
                      </CardTitle>
                      <CardDescription>
                        编码: {feeType.code} | 分类: {feeType.category}
                      </CardDescription>
                    </div>
                    {feeType.organization_id !== null && (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(feeType)}
                          data-testid={`fee-types-edit-btn-${feeType.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(feeType.id)}
                          data-testid={`fee-types-delete-btn-${feeType.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {feeType.specifications && feeType.specifications.length > 0 ? (
                    <Table>
                    <TableHeader>
                    <TableRow>
                      <TableHead>规格名称</TableHead>
                      <TableHead>月付价格</TableHead>
                      <TableHead>年付价格</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feeType.specifications.map((spec) => (
                      <TableRow key={spec.id}>
                        <TableCell>{spec.name}</TableCell>
                        <TableCell>¥{Number(spec.price_monthly)}</TableCell>
                        <TableCell>
                          {spec.price_yearly ? `¥${Number(spec.price_yearly)}` : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">暂无规格配置</p>
              )}
            </CardContent>
          </Card>
            ))}
        </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogHeader>
            <DialogTitle>{editingFeeType ? '编辑费用类型' : '新增费用类型'}</DialogTitle>
            <DialogDescription>
              {editingFeeType ? '修改费用类型信息' : '创建新的自定义费用类型'}
            </DialogDescription>
          </DialogHeader>
          <DialogContent className="space-y-4" data-testid={editingFeeType ? 'fee-types-edit-dialog' : 'fee-types-create-dialog'}>
            <div className="space-y-2">
              <Label htmlFor="name">费用名称</Label>
              <Input
                id="name"
                data-testid="fee-types-name-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="如：网费、物业费、停车费"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">费用编码</Label>
              <Input
                id="code"
                data-testid="fee-types-code-input"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="如：internet, parking"
                disabled={!!editingFeeType}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">费用分类</Label>
              <select
                id="category"
                data-testid="fee-types-category-select"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as FeeCategory })}
                className="w-full rounded-md border border-input px-3 py-2"
              >
                <option value="fixed">固定费用</option>
                <option value="utility">计量费用</option>
                <option value="optional">可选费用</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Input
                id="description"
                data-testid="fee-types-description-input"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="费用类型描述（可选）"
              />
            </div>
          </DialogContent>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog} data-testid="fee-types-cancel-btn">
              取消
            </Button>
            <Button onClick={handleSave} data-testid="fee-types-confirm-btn">
              {editingFeeType ? '保存' : '创建'}
            </Button>
          </DialogFooter>
        </Dialog>
      </div>
    </MainLayout>
  );
}
