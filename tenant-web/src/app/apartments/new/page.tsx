'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { appToast } from '@apartment-ultra/shared-ui/components/ui';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Input } from '@apartment-ultra/shared-ui/components/ui';
import { Label } from '@apartment-ultra/shared-ui/components/ui';
import { DateTimePicker } from '@apartment-ultra/shared-ui/components/ui';
import { MainLayout } from '@/components/layout/main-layout';
import { apartmentsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth/context';
import { getErrorMessage } from '@/lib/utils/error';
import { filterEmptyStrings } from '@/lib/utils/form';
import { apartmentSchema, type ApartmentFormData } from '@/components/apartments';

export default function NewApartmentPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { organization } = useAuth();
  const orgId = organization?.id;

  const form = useForm<ApartmentFormData>({
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
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: ApartmentFormData) => apartmentsApi.create(orgId!, filterEmptyStrings(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apartments', orgId] });
      appToast.success('公寓创建成功');
      router.push('/apartments');
    },
    onError: (error) => appToast.error(getErrorMessage(error, '创建失败，请重试')),
  });

  const numberRegister = (name: keyof ApartmentFormData) => ({
    ...form.register(name, {
      valueAsNumber: true,
      setValueAs: (v: unknown) => (v === '' || (typeof v === 'number' && isNaN(v)) ? undefined : v),
    }),
  });

  const onSubmit = (data: ApartmentFormData) => {
    createMutation.mutate(data);
  };

  return (
    <MainLayout>
      <div className="flex h-full flex-col">
        {/* 固定头部 */}
        <div className="shrink-0 px-1 pb-4">
          <h3 className="flex items-center gap-2 text-base font-medium text-foreground">
            <button type="button" onClick={() => router.back()} className="flex items-center justify-center">
              <ArrowLeft className="h-4 w-4" />
            </button>
            公寓信息
          </h3>
        </div>

        {/* 可滚动表单 */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 flex-col gap-6 overflow-y-auto px-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" required>
                公寓名称
              </Label>
              <Input id="name" {...form.register('name')} placeholder="请输入公寓名称" />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address" required>
                地址
              </Label>
              <Input id="address" {...form.register('address')} placeholder="请输入公寓地址" />
              {form.formState.errors.address && (
                <p className="text-sm text-destructive">{form.formState.errors.address.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">描述</Label>
            <Input id="description" {...form.register('description')} placeholder="请输入描述" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="floors">楼层数</Label>
              <Input id="floors" type="number" min={1} {...numberRegister('floors')} placeholder="请输入楼层数" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="land_area">用地面积（亩）</Label>
              <Input
                id="land_area"
                type="number"
                min={0}
                step={0.01}
                {...numberRegister('land_area')}
                placeholder="请输入用地面积"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="total_area">总面积（㎡）</Label>
              <Input
                id="total_area"
                type="number"
                min={0}
                step={0.01}
                {...numberRegister('total_area')}
                placeholder="请输入总面积"
              />
            </div>
          </div>

          {/* 分割线 */}
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-dashed border-border/60" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">上游信息</span>
            </div>
          </div>

          {/* 上游信息 */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="landlord_name" required>
                  房东姓名
                </Label>
                <Input id="landlord_name" {...form.register('landlord_name')} placeholder="请输入房东姓名" />
                {form.formState.errors.landlord_name && (
                  <p className="text-sm text-destructive">{form.formState.errors.landlord_name.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="landlord_contact">联系方式</Label>
                <Input id="landlord_contact" {...form.register('landlord_contact')} placeholder="请输入联系方式" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="contract_start" required>
                  合同开始
                </Label>
                <DateTimePicker
                  id="contract_start"
                  mode="date"
                  value={form.watch('contract_start')}
                  onChange={(value) => form.setValue('contract_start', value)}
                  placeholder="选择合同开始日期"
                />
                {form.formState.errors.contract_start && (
                  <p className="text-sm text-destructive">{form.formState.errors.contract_start.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contract_end" required>
                  合同结束
                </Label>
                <DateTimePicker
                  id="contract_end"
                  mode="date"
                  value={form.watch('contract_end')}
                  onChange={(value) => form.setValue('contract_end', value)}
                  placeholder="选择合同结束日期"
                />
                {form.formState.errors.contract_end && (
                  <p className="text-sm text-destructive">{form.formState.errors.contract_end.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="landlord_rent" required>
                房东租金（元/月）
              </Label>
              <Input
                id="landlord_rent"
                type="number"
                min={0}
                step={0.01}
                {...numberRegister('landlord_rent')}
                placeholder="请输入房东租金"
              />
              {form.formState.errors.landlord_rent && (
                <p className="text-sm text-destructive">{form.formState.errors.landlord_rent.message}</p>
              )}
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              取消
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? '创建中...' : '创建'}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
