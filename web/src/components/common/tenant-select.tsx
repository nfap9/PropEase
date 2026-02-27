'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { tenantsApi } from '@/lib/api';
import { Tenant } from '@/types';
import { Plus } from 'lucide-react';

const tenantSchema = z.object({
  name: z.string().min(1, '请输入租客姓名'),
  phone: z.string().min(1, '请输入联系电话'),
  id_card: z.string().optional(),
  emergency_contact: z.string().optional(),
  emergency_phone: z.string().optional(),
  email: z.string().email('请输入有效的邮箱').optional().or(z.literal('')),
  notes: z.string().optional(),
});

type TenantFormData = z.infer<typeof tenantSchema>;

interface TenantSelectProps {
  orgId: number;
  value?: number;
  onValueChange: (value: number) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
}

export function TenantSelect({
  orgId,
  value,
  onValueChange,
  placeholder = '选择租客',
  disabled = false,
  error,
}: TenantSelectProps) {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: tenants } = useQuery({
    queryKey: ['tenants', orgId],
    queryFn: () => tenantsApi.list(orgId),
    enabled: !!orgId,
  });

  const createForm = useForm<TenantFormData>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      name: '',
      phone: '',
      id_card: '',
      emergency_contact: '',
      emergency_phone: '',
      email: '',
      notes: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: TenantFormData) => tenantsApi.create(orgId, data),
    onSuccess: (newTenant: Tenant) => {
      queryClient.invalidateQueries({ queryKey: ['tenants', orgId] });
      setIsCreateOpen(false);
      createForm.reset();
      onValueChange(newTenant.id);
      toast.success('租客创建成功');
    },
    onError: () => {
      toast.error('创建失败，请重试');
    },
  });

  const handleOpenCreate = () => {
    createForm.reset();
    setIsCreateOpen(true);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Select
          value={value?.toString() || ''}
          onValueChange={(v) => onValueChange(Number(v))}
          disabled={disabled}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {tenants?.map((tenant) => (
              <SelectItem key={tenant.id} value={tenant.id.toString()}>
                {tenant.name} - {tenant.phone}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleOpenCreate}
          disabled={disabled}
          title="新增租客"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Create Tenant Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>新增租客</DialogTitle>
            <DialogDescription>填写租客信息</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={createForm.handleSubmit((data) => createMutation.mutate(data))}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tenant-name">姓名 *</Label>
                <Input id="tenant-name" {...createForm.register('name')} />
                {createForm.formState.errors.name && (
                  <p className="text-sm text-destructive">
                    {createForm.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="tenant-phone">联系电话 *</Label>
                <Input id="tenant-phone" {...createForm.register('phone')} />
                {createForm.formState.errors.phone && (
                  <p className="text-sm text-destructive">
                    {createForm.formState.errors.phone.message}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tenant-id_card">身份证号</Label>
                <Input id="tenant-id_card" {...createForm.register('id_card')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tenant-email">邮箱</Label>
                <Input id="tenant-email" type="email" {...createForm.register('email')} />
                {createForm.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {createForm.formState.errors.email.message}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tenant-emergency_contact">紧急联系人</Label>
                <Input
                  id="tenant-emergency_contact"
                  {...createForm.register('emergency_contact')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tenant-emergency_phone">紧急联系电话</Label>
                <Input
                  id="tenant-emergency_phone"
                  {...createForm.register('emergency_phone')}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tenant-notes">备注</Label>
              <Input id="tenant-notes" {...createForm.register('notes')} />
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
    </div>
  );
}
