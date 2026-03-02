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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { filterEmptyStrings } from '@/lib/utils/form';

const apartmentSchema = z.object({
  name: z.string().min(1, '请输入公寓名称'),
  address: z.string().min(1, '请输入公寓地址'),
  description: z.string().optional(),
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

  const { data: apartments, isLoading: apartmentsLoading } = useQuery({
    queryKey: ['apartments', orgId],
    queryFn: () => apartmentsApi.list(orgId!),
    enabled: !!orgId,
  });

  const createForm = useForm<ApartmentFormData>({
    resolver: zodResolver(apartmentSchema),
    defaultValues: { name: '', address: '', description: '' },
  });

  const editForm = useForm<ApartmentFormData>({
    resolver: zodResolver(apartmentSchema),
  });

  const createMutation = useMutation({
    mutationFn: (data: ApartmentFormData) =>
      apartmentsApi.create(orgId!, filterEmptyStrings(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apartments', orgId] });
      setIsCreateOpen(false);
      createForm.reset();
      toast.success('公寓创建成功');
    },
    onError: () => {
      toast.error('创建失败，请重试');
    },
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
    onError: () => {
      toast.error('更新失败，请重试');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apartmentsApi.delete(orgId!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apartments', orgId] });
      setIsDeleteOpen(false);
      setSelectedApartment(null);
      toast.success('公寓删除成功');
    },
    onError: () => {
      toast.error('删除失败，请重试');
    },
  });

  const handleEdit = (apartment: ApartmentWithStats) => {
    setSelectedApartment(apartment);
    editForm.reset({
      name: apartment.name,
      address: apartment.address ?? '',
      description: apartment.description ?? '',
    });
    setIsEditOpen(true);
  };

  const handleDelete = (apartment: ApartmentWithStats) => {
    setSelectedApartment(apartment);
    setIsDeleteOpen(true);
  };

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
        <div className="flex flex-col items-center justify-center h-full space-y-4">
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
              <h1 className="text-3xl font-bold">公寓管理</h1>
              <p className="text-muted-foreground mt-1">管理您的所有公寓和房间</p>
            </div>
            <PermissionGuard permission={PERMISSIONS.APARTMENT_CREATE}>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                新增公寓
              </Button>
            </PermissionGuard>
          </div>

        {apartmentsLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        ) : apartments && apartments.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {apartments.map((apartment) => (
              <Link key={apartment.id} href={`/apartments/${apartment.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1 min-w-0">
                        <CardTitle className="flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-primary flex-shrink-0" />
                          <span className="truncate">{apartment.name}</span>
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{apartment.address || '暂无地址'}</span>
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" aria-label="更多操作">
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
                      <div className="flex flex-col items-center p-2 bg-muted/50 rounded-lg">
                        <Home className="h-4 w-4 text-muted-foreground mb-1" />
                        <span className="text-lg font-semibold">{apartment.room_stats.total}</span>
                        <span className="text-xs text-muted-foreground">总房间</span>
                      </div>
                      <div className="flex flex-col items-center p-2 bg-green-50 dark:bg-green-950/30 rounded-lg">
                        <Home className="h-4 w-4 text-green-600 mb-1" />
                        <span className="text-lg font-semibold text-green-600">{apartment.room_stats.available}</span>
                        <span className="text-xs text-muted-foreground">空房</span>
                      </div>
                      <div className="flex flex-col items-center p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                        <Users className="h-4 w-4 text-blue-600 mb-1" />
                        <span className="text-lg font-semibold text-blue-600">{apartment.room_stats.occupied}</span>
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
                    <div className="w-full flex items-center justify-between text-sm text-muted-foreground">
                      <span>入住率</span>
                      <span className="font-medium">
                        {apartment.room_stats.total > 0
                          ? Math.round((apartment.room_stats.occupied / apartment.room_stats.total) * 100)
                          : 0}%
                      </span>
                    </div>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">暂无公寓</h3>
              <p className="text-muted-foreground text-sm mb-4">点击下方按钮添加您的第一个公寓</p>
              <PermissionGuard permission={PERMISSIONS.APARTMENT_CREATE}>
                <Button onClick={() => setIsCreateOpen(true)} aria-label="新增公寓（空状态）">
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
        <DialogContent>
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
              <Input
                id="name"
                {...createForm.register('name')}
                placeholder="例如：阳光公寓A栋"
              />
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                取消
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? '创建中...' : '创建'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
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
              <Input id="edit-name" {...editForm.register('name')} />
              {editForm.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {editForm.formState.errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">地址</Label>
              <Input id="edit-address" {...editForm.register('address')} />
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                取消
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? '保存中...' : '保存'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Alert Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除公寓 &ldquo;{selectedApartment?.name}&rdquo; 吗？此操作不可撤销，关联的房间数据也将被删除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(selectedApartment!.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
