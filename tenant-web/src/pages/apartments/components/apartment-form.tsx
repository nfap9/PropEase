import { UseFormReturn, Controller } from 'react-hook-form';
import { z } from 'zod';
import { Input, Form } from 'antd';
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
    <Form
      layout="vertical"
      onFinish={form.handleSubmit(onSubmit ?? (() => {}))}
      className="space-y-4"
      id={formId}
    >
      <Form.Item
        label="公寓名称"
        name="name"
        required
        validateStatus={form.formState.errors.name ? 'error' : ''}
        help={form.formState.errors.name?.message}
      >
        <Controller
          name="name"
          control={form.control}
          render={({ field }) => (
            <Input
              placeholder="请输入公寓名称"
              {...field}
            />
          )}
        />
      </Form.Item>
      <Form.Item
        label="地址"
        name="address"
        required
        validateStatus={form.formState.errors.address ? 'error' : ''}
        help={form.formState.errors.address?.message}
      >
        <Controller
          name="address"
          control={form.control}
          render={({ field }) => (
            <Input
              placeholder="请输入公寓地址"
              {...field}
            />
          )}
        />
      </Form.Item>
      <Form.Item label="描述" name="description">
        <Input {...form.register('description')} />
      </Form.Item>
      <div className="grid grid-cols-3 gap-4">
        <Form.Item label="楼层数">
          <Input
            type="number"
            min={1}
            {...numberRegister('floors', form)}
            placeholder="请输入楼层数"
          />
        </Form.Item>
        <Form.Item label="用地面积（亩）">
          <Input
            type="number"
            min={0}
            step={0.01}
            {...numberRegister('land_area', form)}
            placeholder="请输入用地面积"
          />
        </Form.Item>
        <Form.Item label="总面积（㎡）">
          <Input
            type="number"
            min={0}
            step={0.01}
            {...numberRegister('total_area', form)}
            placeholder="请输入总面积"
          />
        </Form.Item>
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
    </Form>
  );
}
