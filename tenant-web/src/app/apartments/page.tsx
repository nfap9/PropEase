'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { toast } from 'sonner';
import { MainLayout } from '@/components/layout/main-layout';
import { PermissionPageGuard } from '@/components/layout/permission-page-guard';
import { PermissionGuard } from '@/components/common/permission-guard';
import { PERMISSIONS } from '@/hooks/use-permissions';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Input } from '@apartment-ultra/shared-ui/components/ui';
import { Label } from '@apartment-ultra/shared-ui/components/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@apartment-ultra/shared-ui/components/ui';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@apartment-ultra/shared-ui/components/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@apartment-ultra/shared-ui/components/ui';
import { apartmentsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth/context';
import { ApartmentWithStats } from '@/types';
import {
  Plus,
  Pencil,
  Trash2,
  Building2,
  Home,
  Users,
  Wrench,
  MoreVertical,
  MapPin,
  Search,
} from 'lucide-react';
import { Skeleton } from '@apartment-ultra/shared-ui/components/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@apartment-ultra/shared-ui/components/ui';
import { filterEmptyStrings } from '@/lib/utils/form';
import { getErrorMessage } from '@/lib/utils/error';

const apartmentSchema = z.object({
  name: z.string().min(1, '请输入公寓名称'),
  address: z.string().min(1, '请输入公寓地址'),
  description: z.string().optional(),
  // 基本信息
  floors: z.number().int().min(1).optional(),
  land_area: z.number().min(0).optional(),
  total_area: z.number().min(0).optional(),
  // 上游信息
  landlord_name: z.string().optional(),
  landlord_contact: z.string().optional(),
  contract_start: z.string().optional(),
  contract_end: z.string().optional(),
  landlord_rent: z.number().min(0).optional(),
  // 经营成本
  operating_cost: z.number().min(0).optional(),
});

type ApartmentFormData = z.infer<typeof apartmentSchema>;

export default function ApartmentsPage() {
  const queryClient = useQueryClient();
  const { organization, isLoading: authLoading } = useAuth();
  const orgId = organization?.id;

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedApartment, setSelectedApartment] = useState<ApartmentWithStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: apartments, isLoading: apartmentsLoading } = useQuery({
    queryKey: ['apartments', orgId],
    queryFn: () => apartmentsApi.list(orgId!),
    enabled: !!orgId,
  });

  const createForm = useForm<ApartmentFormData>({
    resolver: zodResolver(apartmentSchema),
    defaultValues: {
      name: '',
      address: '',
      description: '',
      floors: undefined,
      land_area: undefined,
      total_area: undefined,
      landlord_name: '',
      landlord_contact: '',
      contract_start: '',
      contract_end: '',
      landlord_rent: undefined,
      operating_cost: undefined,
    },
  });

  const editForm = useForm<ApartmentFormData>({
    resolver: zodResolver(apartmentSchema),
  });

  const createMutation = useMutation({
    mutationFn: (data: ApartmentFormData) => apartmentsApi.create(orgId!, filterEmptyStrings(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apartments', orgId] });
      setIsCreateOpen(false);
      createForm.reset();
      toast.success('公寓创建成功');
    },
    onError: (error) => toast.error(getErrorMessage(error, '创建失败，请重试')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ApartmentFormData }) =>
      apartmentsApi.update(orgId!, id, filterEmptyStrings(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apartments', orgId] });
      setIsEditOpen(false);
      setSelectedApartment(null);
      toast.success('公寓更新成功');
    },
    onError: (error) => toast.error(getErrorMessage(error, '更新失败，请重试')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apartmentsApi.delete(orgId!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apartments', orgId] });
      setIsDeleteOpen(false);
      setSelectedApartment(null);
      toast.success('公寓删除成功');
    },
    onError: (error) => toast.error(getErrorMessage(error, '删除失败，请重试')),
  });

  const handleEdit = (apartment: ApartmentWithStats) => {
    setSelectedApartment(apartment);
    editForm.reset({
      name: apartment.name,
      address: apartment.address ?? '',
      description: apartment.description ?? '',
      floors: apartment.floors ?? undefined,
      land_area: apartment.land_area ?? undefined,
      total_area: apartment.total_area ?? undefined,
      landlord_name: apartment.landlord_name ?? '',
      landlord_contact: apartment.landlord_contact ?? '',
      contract_start: apartment.contract_start
        ? new Date(apartment.contract_start).toISOString().split('T')[0]
        : '',
      contract_end: apartment.contract_end
        ? new Date(apartment.contract_end).toISOString().split('T')[0]
        : '',
      landlord_rent: apartment.landlord_rent ?? undefined,
      operating_cost: apartment.operating_cost ?? undefined,
    });
    setIsEditOpen(true);
  };

  const handleDelete = (apartment: ApartmentWithStats) => {
    setSelectedApartment(apartment);
    setIsDeleteOpen(true);
  };

  // 过滤公寓列表
  const filteredApartments = apartments?.filter((apartment) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      apartment.name.toLowerCase().includes(query) ||
      (apartment.address?.toLowerCase().includes(query) ?? false)
    );
  });

  if (authLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </MainLayout>
    );
  }

  // 无组织时的提示
  if (!orgId) {
    return (
      <MainLayout>
        <div className="flex h-full flex-col items-center justify-center space-y-4">
          <Building2 className="h-16 w-16 text-muted-foreground" />
          <h2 className="text-xl font-semibold">请先创建或加入组织</h2>
          <p className="text-muted-foreground">在顶部导航栏选择或创建一个组织开始使用</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <PermissionPageGuard>
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold" data-testid="apartments-heading">公寓管理</h1>
              <p className="mt-1 text-muted-foreground">管理您的所有公寓和房间</p>
            </div>
            <PermissionGuard permission={PERMISSIONS.APARTMENT_CREATE}>
              <Button onClick={() => setIsCreateOpen(true)} data-testid="apartments-new-btn">
                <Plus className="mr-2 h-4 w-4" />
                新增公寓
              </Button>
            </PermissionGuard>
          </div>

          {/* 搜索栏 */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索公寓名称或地址..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="apartments-search-input"
            />
          </div>

          {apartmentsLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
            </div>
          ) : filteredApartments && filteredApartments.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" data-testid="apartments-list">
              {filteredApartments.map((apartment) => (
                <Link key={apartment.id} href={`/apartments/${apartment.id}`}>
                  <Card className="h-full cursor-pointer transition-shadow hover:shadow-md">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1 space-y-1">
                          <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 flex-shrink-0 text-primary" />
                            <span className="truncate">{apartment.name}</span>
                          </CardTitle>
                          <CardDescription className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{apartment.address || '暂无地址'}</span>
                          </CardDescription>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 flex-shrink-0"
                              aria-label="更多操作"
                              data-testid={`apartments-more-menu-${apartment.id}`}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={(e) => e.preventDefault()}>
                            <PermissionGuard permission={PERMISSIONS.APARTMENT_EDIT}>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleEdit(apartment);
                                }}
                                data-testid={`apartments-edit-btn-${apartment.id}`}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                编辑
                              </DropdownMenuItem>
                            </PermissionGuard>
                            <PermissionGuard permission={PERMISSIONS.APARTMENT_DELETE}>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleDelete(apartment);
                                }}
                                data-testid={`apartments-delete-btn-${apartment.id}`}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                删除
                              </DropdownMenuItem>
                            </PermissionGuard>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="flex flex-col items-center rounded-lg bg-muted/50 p-2">
                          <Home className="mb-1 h-4 w-4 text-muted-foreground" />
                          <span className="text-lg font-semibold">
                            {apartment.room_stats.total}
                          </span>
                          <span className="text-xs text-muted-foreground">总房间</span>
                        </div>
                        <div className="flex flex-col items-center rounded-lg bg-green-50 p-2 dark:bg-green-950/30">
                          <Home className="mb-1 h-4 w-4 text-green-600" />
                          <span className="text-lg font-semibold text-green-600">
                            {apartment.room_stats.available}
                          </span>
                          <span className="text-xs text-muted-foreground">空房</span>
                        </div>
                        <div className="flex flex-col items-center rounded-lg bg-blue-50 p-2 dark:bg-blue-950/30">
                          <Users className="mb-1 h-4 w-4 text-blue-600" />
                          <span className="text-lg font-semibold text-blue-600">
                            {apartment.room_stats.occupied}
                          </span>
                          <span className="text-xs text-muted-foreground">已租</span>
                        </div>
                      </div>
                      {apartment.room_stats.maintenance > 0 && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-orange-600">
                          <Wrench className="h-4 w-4" />
                          <span>{apartment.room_stats.maintenance} 间房间维修中</span>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="pt-0">
                      <div className="flex w-full items-center justify-between text-sm text-muted-foreground">
                        <span>入住率</span>
                        <span className="font-medium">
                          {apartment.room_stats.total > 0
                            ? Math.round(
                                (apartment.room_stats.occupied / apartment.room_stats.total) * 100
                              )
                            : 0}
                          %
                        </span>
                      </div>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          ) : apartments && apartments.length > 0 ? (
            <Card className="border-dashed" data-testid="apartments-empty-state">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Search className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-medium">未找到匹配的公寓</h3>
                <p className="text-sm text-muted-foreground">尝试使用其他关键词搜索</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed" data-testid="apartments-empty-state">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building2 className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-medium">暂无公寓</h3>
                <p className="mb-4 text-sm text-muted-foreground">点击下方按钮添加您的第一个公寓</p>
                <PermissionGuard permission={PERMISSIONS.APARTMENT_CREATE}>
                  <Button onClick={() => setIsCreateOpen(true)} aria-label="新增公寓（空状态）" data-testid="apartments-new-btn">
                    <Plus className="mr-2 h-4 w-4" />
                    新增公寓
                  </Button>
                </PermissionGuard>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Create Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent data-testid="apartments-create-dialog">
            <DialogHeader>
              <DialogTitle>新增公寓</DialogTitle>
              <DialogDescription>填写公寓信息创建新的公寓</DialogDescription>
            </DialogHeader>
            <form
              onSubmit={createForm.handleSubmit((data) => createMutation.mutate(data))}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="name">公寓名称</Label>
                <Input id="name" {...createForm.register('name')} placeholder="例如：阳光公寓A栋" data-testid="apartments-name-input" />
                {createForm.formState.errors.name && (
                  <p className="text-sm text-destructive">
                    {createForm.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">地址</Label>
                <Input
                  id="address"
                  {...createForm.register('address')}
                  placeholder="例如：北京市朝阳区xxx路xxx号"
                  data-testid="apartments-address-input"
                />
                {createForm.formState.errors.address && (
                  <p className="text-sm text-destructive">
                    {createForm.formState.errors.address.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">描述</Label>
                <Input id="description" {...createForm.register('description')} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="floors">楼层数</Label>
                  <Input id="floors" type="number" min={1} {...createForm.register('floors', { valueAsNumber: true })} placeholder="如：5" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="land_area">用地面积（亩）</Label>
                  <Input id="land_area" type="number" min={0} step={0.01} {...createForm.register('land_area', { valueAsNumber: true })} placeholder="如：2.5" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="total_area">总面积（㎡）</Label>
                  <Input id="total_area" type="number" min={0} step={0.01} {...createForm.register('total_area', { valueAsNumber: true })} placeholder="如：500" />
                </div>
              </div>

              <details className="group border rounded-md p-3">
                <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                  上游信息（点击展开）
                </summary>
                <div className="mt-3 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="landlord_name">房东姓名</Label>
                      <Input id="landlord_name" {...createForm.register('landlord_name')} placeholder="如：张三" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="landlord_contact">联系方式</Label>
                      <Input id="landlord_contact" {...createForm.register('landlord_contact')} placeholder="如：138xxxx" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contract_start">合同开始</Label>
                      <Input id="contract_start" type="date" {...createForm.register('contract_start')} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contract_end">合同结束</Label>
                      <Input id="contract_end" type="date" {...createForm.register('contract_end')} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="landlord_rent">房东租金（元/月）</Label>
                      <Input id="landlord_rent" type="number" min={0} step={0.01} {...createForm.register('landlord_rent', { valueAsNumber: true })} placeholder="如：5000" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="operating_cost">经营成本（元/月）</Label>
                      <Input id="operating_cost" type="number" min={0} step={0.01} {...createForm.register('operating_cost', { valueAsNumber: true })} placeholder="如：1000" />
                    </div>
                  </div>
                </div>
              </details>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} data-testid="apartments-cancel-btn">
                  取消
                </Button>
                <Button type="submit" disabled={createMutation.isPending} data-testid="apartments-confirm-btn">
                  {createMutation.isPending ? '创建中...' : '创建'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent data-testid="apartments-edit-dialog">
            <DialogHeader>
              <DialogTitle>编辑公寓</DialogTitle>
              <DialogDescription>修改公寓信息</DialogDescription>
            </DialogHeader>
            <form
              onSubmit={editForm.handleSubmit((data) =>
                updateMutation.mutate({ id: selectedApartment!.id, data })
              )}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="edit-name">公寓名称</Label>
                <Input id="edit-name" {...editForm.register('name')} data-testid="apartments-name-input" />
                {editForm.formState.errors.name && (
                  <p className="text-sm text-destructive">
                    {editForm.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-address">地址</Label>
                <Input id="edit-address" {...editForm.register('address')} data-testid="apartments-address-input" />
                {editForm.formState.errors.address && (
                  <p className="text-sm text-destructive">
                    {editForm.formState.errors.address.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">描述</Label>
                <Input id="edit-description" {...editForm.register('description')} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-floors">楼层数</Label>
                  <Input id="edit-floors" type="number" min={1} {...editForm.register('floors', { valueAsNumber: true })} placeholder="如：5" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-land_area">用地面积（亩）</Label>
                  <Input id="edit-land_area" type="number" min={0} step={0.01} {...editForm.register('land_area', { valueAsNumber: true })} placeholder="如：2.5" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-total_area">总面积（㎡）</Label>
                  <Input id="edit-total_area" type="number" min={0} step={0.01} {...editForm.register('total_area', { valueAsNumber: true })} placeholder="如：500" />
                </div>
              </div>

              <details className="group border rounded-md p-3">
                <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                  上游信息（点击展开）
                </summary>
                <div className="mt-3 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-landlord_name">房东姓名</Label>
                      <Input id="edit-landlord_name" {...editForm.register('landlord_name')} placeholder="如：张三" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-landlord_contact">联系方式</Label>
                      <Input id="edit-landlord_contact" {...editForm.register('landlord_contact')} placeholder="如：138xxxx" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-contract_start">合同开始</Label>
                      <Input id="edit-contract_start" type="date" {...editForm.register('contract_start')} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-contract_end">合同结束</Label>
                      <Input id="edit-contract_end" type="date" {...editForm.register('contract_end')} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-landlord_rent">房东租金（元/月）</Label>
                      <Input id="edit-landlord_rent" type="number" min={0} step={0.01} {...editForm.register('landlord_rent', { valueAsNumber: true })} placeholder="如：5000" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-operating_cost">经营成本（元/月）</Label>
                      <Input id="edit-operating_cost" type="number" min={0} step={0.01} {...editForm.register('operating_cost', { valueAsNumber: true })} placeholder="如：1000" />
                    </div>
                  </div>
                </div>
              </details>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} data-testid="apartments-cancel-btn">
                  取消
                </Button>
                <Button type="submit" disabled={updateMutation.isPending} data-testid="apartments-confirm-btn">
                  {updateMutation.isPending ? '保存中...' : '保存'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Alert Dialog */}
        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent data-testid="apartments-delete-confirm-dialog">
            <AlertDialogHeader>
              <AlertDialogTitle>确认删除</AlertDialogTitle>
              <AlertDialogDescription>
                确定要删除公寓 &ldquo;{selectedApartment?.name}&rdquo;
                吗？此操作不可撤销，关联的房间数据也将被删除。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="apartments-cancel-btn">取消</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteMutation.mutate(selectedApartment!.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-testid="apartments-confirm-delete-btn"
              >
                {deleteMutation.isPending ? '删除中...' : '删除'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </MainLayout>
    </PermissionPageGuard>
  );
}
