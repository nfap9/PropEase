'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { toast } from 'sonner';
import { MainLayout } from '@/components/layout/main-layout';
import { PermissionPageGuard } from '@/components/layout/permission-page-guard';
import { DataTable } from '@/components/common/data-table';
import { TableActions, TableAction } from '@/components/common/table-actions';
import { LeaseFormDialog, LeaseFormData } from '@/components/common/lease-form-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
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
import { ColumnDef } from '@tanstack/react-table';
import { leasesApi, apartmentsApi } from '@/lib/api';
import { filterEmptyStrings } from '@/lib/utils/form';
import { getErrorMessage } from '@/lib/utils/error';
import { formatDate, toDateInputValue } from '@/lib/date-utils';
import { useAuth } from '@/lib/auth/context';
import { Lease } from '@/types';
import { LeaseFilters, LeaseFiltersState } from './components';
import { Plus, Pencil, Trash2, Ban, Building2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const leaseSchema = z.object({
  room_id: z.string().min(1, '请选择房间'),
  tenant_id: z.string().min(1, '请选择租客'),
  start_date: z.string().min(1, '请选择开始日期'),
  end_date: z.string().optional(),
  monthly_rent: z.coerce.number().min(0, '月租不能为负'),
  deposit: z.coerce.number().min(0, '押金不能为负').optional(),
  water_rate: z.coerce.number().min(0).optional(),
  electricity_rate: z.coerce.number().optional(),
  notes: z.string().optional(),
});

export default function LeasesPage() {
  const queryClient = useQueryClient();
  const { organization, isLoading: authLoading } = useAuth();
  const orgId = organization?.id;

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isTerminateOpen, setIsTerminateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedLease, setSelectedLease] = useState<Lease | null>(null);
  const [filters, setFilters] = useState<LeaseFiltersState>({
    apartmentId: null,
    keyword: null,
    startDateFrom: null,
    startDateTo: null,
    endDateFrom: null,
    endDateTo: null,
  });

  const { data: apartments } = useQuery({
    queryKey: ['apartments', orgId],
    queryFn: () => apartmentsApi.list(orgId!),
    enabled: !!orgId,
  });

  const { data: leases, isLoading: leasesLoading } = useQuery({
    queryKey: ['leases', orgId],
    queryFn: () => leasesApi.list(orgId!),
    enabled: !!orgId,
  });

  const editForm = useForm<LeaseFormData>({
    resolver: zodResolver(leaseSchema),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: LeaseFormData }) =>
      leasesApi.update(orgId!, id, filterEmptyStrings(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leases', orgId] });
      setIsEditOpen(false);
      setSelectedLease(null);
      toast.success('租约更新成功');
    },
    onError: (error) => toast.error(getErrorMessage(error, '更新失败，请重试')),
  });

  const terminateMutation = useMutation({
    mutationFn: (id: string) => leasesApi.terminate(orgId!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leases', orgId] });
      queryClient.invalidateQueries({ queryKey: ['rooms', orgId] });
      setIsTerminateOpen(false);
      setSelectedLease(null);
      toast.success('租约已终止');
    },
    onError: (error) => toast.error(getErrorMessage(error, '终止失败，请重试')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => leasesApi.delete(orgId!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leases', orgId] });
      setIsDeleteOpen(false);
      setSelectedLease(null);
      toast.success('租约删除成功');
    },
    onError: (error) => toast.error(getErrorMessage(error, '删除失败，请重试')),
  });

  const handleEdit = (lease: Lease) => {
    setSelectedLease(lease);
    editForm.reset({
      room_id: lease.room_id,
      tenant_id: lease.tenant_id,
      start_date: toDateInputValue(lease.start_date),
      end_date: toDateInputValue(lease.end_date),
      monthly_rent: lease.monthly_rent,
      deposit: lease.deposit ?? 0,
      water_rate: lease.water_rate ?? 0,
      electricity_rate: lease.electricity_rate ?? 0,
      notes: lease.notes ?? '',
    });
    setIsEditOpen(true);
  };

  const handleTerminate = (lease: Lease) => {
    setSelectedLease(lease);
    setIsTerminateOpen(true);
  };

  const handleDelete = (lease: Lease) => {
    setSelectedLease(lease);
    setIsDeleteOpen(true);
  };

  const filteredLeases = useMemo(() => {
    if (!leases) return [];
    return leases.filter((lease) => {
      if (filters.apartmentId && lease.room?.apartment_id !== filters.apartmentId) {
        return false;
      }
      if (filters.keyword) {
        const kw = filters.keyword.toLowerCase();
        const roomNum = lease.room?.room_number?.toLowerCase() ?? '';
        const tenantName = lease.tenant?.name?.toLowerCase() ?? '';
        const tenantPhone = lease.tenant?.phone ?? '';
        const tenantIdCard = lease.tenant?.id_card ?? '';
        const match =
          roomNum.includes(kw) ||
          tenantName.includes(kw) ||
          tenantPhone.includes(kw) ||
          tenantIdCard.includes(kw);
        if (!match) return false;
      }
      if (filters.startDateFrom) {
        const start = lease.start_date.slice(0, 10);
        if (start < filters.startDateFrom) return false;
      }
      if (filters.startDateTo) {
        const start = lease.start_date.slice(0, 10);
        if (start > filters.startDateTo) return false;
      }
      const endDate = lease.end_date ? lease.end_date.slice(0, 10) : null;
      if (filters.endDateFrom) {
        if (!endDate || endDate < filters.endDateFrom) return false;
      }
      if (filters.endDateTo) {
        if (!endDate || endDate > filters.endDateTo) return false;
      }
      return true;
    });
  }, [leases, filters]);

  const handleFilterChange = (key: keyof LeaseFiltersState, value: unknown) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      apartmentId: null,
      keyword: null,
      startDateFrom: null,
      startDateTo: null,
      endDateFrom: null,
      endDateTo: null,
    });
  };

  const columns: ColumnDef<Lease>[] = [
    {
      accessorKey: 'room',
      header: '房间',
      cell: ({ row }) => {
        const room = row.original.room;
        if (!room) return '-';
        const apartment = room.apartment;
        return (
          <div className="flex flex-col">
            {apartment && (
              <Link
                href={`/apartments/${apartment.id}`}
                className="text-xs text-muted-foreground hover:underline"
              >
                {apartment.name}
              </Link>
            )}
            <span>{room.room_number}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'tenant',
      header: '租客',
      cell: ({ row }) => row.original.tenant?.name || '-',
    },
    {
      accessorKey: 'start_date',
      header: '开始日期',
      cell: ({ row }) => formatDate(row.original.start_date),
    },
    {
      accessorKey: 'end_date',
      header: '结束日期',
      cell: ({ row }) => row.original.end_date ? formatDate(row.original.end_date) : '长期',
    },
    {
      accessorKey: 'monthly_rent',
      header: '月租',
      cell: ({ row }) => `¥${row.original.monthly_rent.toLocaleString()}`,
    },
    {
      accessorKey: 'is_active',
      header: '状态',
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? 'default' : 'secondary'}>
          {row.original.is_active ? '生效中' : '已终止'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const lease = row.original;
        const actions: TableAction[] = [
          {
            label: '编辑',
            icon: Pencil,
            onClick: () => handleEdit(lease),
          },
          {
            label: '终止',
            icon: Ban,
            onClick: () => handleTerminate(lease),
            show: lease.is_active,
          },
          {
            label: '删除',
            icon: Trash2,
            onClick: () => handleDelete(lease),
            variant: 'destructive',
          },
        ];
        return <TableActions actions={actions} maxInline={2} />;
      },
    },
  ];

  if (authLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-96" />
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
            <h1 className="text-3xl font-bold">租约管理</h1>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              新增租约
            </Button>
          </div>

          <LeaseFilters
            apartments={apartments?.map((a) => ({ id: a.id, name: a.name })) ?? []}
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />

          {leasesLoading ? (
            <Skeleton className="h-96" />
          ) : (
            <DataTable columns={columns} data={filteredLeases} />
          )}
      </div>

      {/* Create Dialog */}
      <LeaseFormDialog
        orgId={orgId!}
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>编辑租约</DialogTitle>
            <DialogDescription>修改租约信息</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form
              id="edit-lease-form"
              onSubmit={editForm.handleSubmit(
                (data) => updateMutation.mutate({ id: selectedLease!.id, data }),
                () => toast.error('请检查表单填写是否正确')
              )}
              className="space-y-4"
            >
              <input type="hidden" {...editForm.register('room_id')} />
              <input type="hidden" {...editForm.register('tenant_id')} />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-room">房间</Label>
                  <Input
                    id="edit-room"
                    value={
                      selectedLease?.room
                        ? `${selectedLease.room.apartment?.name || ''} - ${selectedLease.room.room_number}`
                        : ''
                    }
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-tenant">租客</Label>
                  <Input id="edit-tenant" value={selectedLease?.tenant?.name || ''} disabled />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>开始日期 *</FormLabel>
                      <FormControl>
                        <Input id="edit-start_date" type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>结束日期</FormLabel>
                      <FormControl>
                        <Input id="edit-end_date" type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={editForm.control}
                  name="monthly_rent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>月租 (元) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.value === '' ? 0 : Number(e.target.value))
                          }
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="deposit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>押金 (元)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.value === '' ? 0 : Number(e.target.value))
                          }
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>备注</FormLabel>
                    <FormControl>
                      <Input id="edit-notes" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                  取消
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? '保存中...' : '保存'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Terminate Alert Dialog */}
      <AlertDialog open={isTerminateOpen} onOpenChange={setIsTerminateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认终止租约</AlertDialogTitle>
            <AlertDialogDescription>
              确定要终止此租约吗？终止后房间将变为空置状态。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => terminateMutation.mutate(selectedLease!.id)}
            >
              {terminateMutation.isPending ? '处理中...' : '确认终止'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Alert Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除此租约吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(selectedLease!.id)}
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
