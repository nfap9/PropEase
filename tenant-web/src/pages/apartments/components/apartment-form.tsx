import { UseFormReturn, Controller } from 'react-hook-form';
import { z } from 'zod';
import { Input } from 'antd';
import type { HTMLAttributes } from 'react';
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
  landlord_name: z.string().min(1, '请输入房东姓名'),
  landlord_contact: z.string().optional(),
  contract_start: z.string().min(1, '请选择合同开始时间'),
  contract_end: z.string().min(1, '请选择合同结束时间'),
  landlord_rent: z.number().min(0, '请输入房东租金'),
});

export type ApartmentFormData = z.infer<typeof apartmentSchema>;

interface LabelProps {
  children: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
  className?: string;
}

function Label({ required, children, htmlFor, className }: LabelProps) {
  return (
    <label htmlFor={htmlFor} className={`text-sm font-medium ${className || ''}`}>
      {children}
      {required && <span className="text-destructive ml-1">*</span>}
    </label>
  );
}

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
        <Label htmlFor={`${idPrefix}name`} required>
          公寓名称
        </Label>
        <Controller
          name="name"
          control={form.control}
          render={({ field }) => (
            <Input
              id={`${idPrefix}name`}
              placeholder="请输入公寓名称"
              {...field}
            />
          )}
        />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}address`} required>
          地址
        </Label>
        <Controller
          name="address"
          control={form.control}
          render={({ field }) => (
            <Input
              id={`${idPrefix}address`}
              placeholder="请输入公寓地址"
              {...field}
            />
          )}
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
            placeholder="请输入楼层数"
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
            placeholder="请输入用地面积"
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
            placeholder="请输入总面积"
          />
        </div>
      </div>

      {/* 分割线 */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">上游信息</span>
        </div>
      </div>

      <LandlordInfoSection form={form} />
    </form>
  );
}
