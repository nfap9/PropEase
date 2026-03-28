'use client';

import { UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import { Input } from '@apartment-ultra/shared-ui/components/ui';
import { Label } from '@apartment-ultra/shared-ui/components/ui';
import { LandlordInfoSection } from './landlord-info-section';

export const apartmentSchema = z.object({
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

export type ApartmentFormData = z.infer<typeof apartmentSchema>;

interface ApartmentFormProps {
  form: UseFormReturn<ApartmentFormData>;
  mode: 'create' | 'edit';
  formId?: string;
  onSubmit?: (data: ApartmentFormData) => void;
}

export function ApartmentForm({
  form,
  mode,
  formId = 'apartment-form',
  onSubmit,
}: ApartmentFormProps) {
  const idPrefix = mode === 'edit' ? 'edit-' : '';

  const numberRegister = (
    name: keyof ApartmentFormData,
    form: UseFormReturn<ApartmentFormData>
  ) => ({
    ...form.register(name, {
      valueAsNumber: true,
      setValueAs: (v: unknown) => (v === '' || (typeof v === 'number' && isNaN(v)) ? undefined : v),
    }),
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit ?? (() => {}))} className="space-y-4" id={formId}>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}name`}>公寓名称</Label>
        <Input
          id={`${idPrefix}name`}
          {...form.register('name')}
          placeholder="例如：阳光公寓A栋"
        />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}address`}>地址</Label>
        <Input
          id={`${idPrefix}address`}
          {...form.register('address')}
          placeholder="例如：北京市朝阳区xxx路xxx号"
        />
        {form.formState.errors.address && (
          <p className="text-sm text-destructive">{form.formState.errors.address.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}description`}>描述</Label>
        <Input id={`${idPrefix}description`} {...form.register('description')} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}floors`}>楼层数</Label>
          <Input
            id={`${idPrefix}floors`}
            type="number"
            min={1}
            {...numberRegister('floors', form)}
            placeholder="如：5"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}land_area`}>用地面积（亩）</Label>
          <Input
            id={`${idPrefix}land_area`}
            type="number"
            min={0}
            step={0.01}
            {...numberRegister('land_area', form)}
            placeholder="如：2.5"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}total_area`}>总面积（㎡）</Label>
          <Input
            id={`${idPrefix}total_area`}
            type="number"
            min={0}
            step={0.01}
            {...numberRegister('total_area', form)}
            placeholder="如：500"
          />
        </div>
      </div>

      <LandlordInfoSection form={form} />
    </form>
  );
}
