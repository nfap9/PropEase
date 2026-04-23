import type { UseFormReturn } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { Input, Form, InputNumber } from 'antd';
import {
  ApartmentCreateSchema as apartmentSchema,
  type ApartmentFormData,
} from '@apartment-ultra/api-contract';
import { LandlordInfoSection } from './landlord-info-section';

// Re-export for consumers of this module
export { apartmentSchema };
export type { ApartmentFormData };

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
  return (
    <Form
      layout="vertical"
      onFinish={form.handleSubmit(onSubmit ?? (() => {}))}
      className="space-y-4"
      id={formId}
    >
      <Controller
        name="name"
        control={form.control}
        render={({ field, fieldState }) => (
          <Form.Item label="公寓名称" required validateStatus={fieldState.error ? 'error' : ''} help={fieldState.error?.message}>
            <Input placeholder="请输入公寓名称" {...field} />
          </Form.Item>
        )}
      />
      <Controller
        name="address"
        control={form.control}
        render={({ field, fieldState }) => (
          <Form.Item label="地址" required validateStatus={fieldState.error ? 'error' : ''} help={fieldState.error?.message}>
            <Input placeholder="请输入公寓地址" {...field} />
          </Form.Item>
        )}
      />
      <Controller
        name="description"
        control={form.control}
        render={({ field }) => (
          <Form.Item label="描述">
            <Input.TextArea {...field} value={field.value ?? ''} placeholder="请输入描述" rows={2} />
          </Form.Item>
        )}
      />
      <div className="grid grid-cols-3 gap-4">
        <Controller
          name="floors"
          control={form.control}
          render={({ field, fieldState }) => (
            <Form.Item label="楼层数" validateStatus={fieldState.error ? 'error' : ''} help={fieldState.error?.message}>
              <InputNumber
                {...field}
                value={field.value ?? ''}
                onChange={(val) => field.onChange(val ?? '')}
                min={1}
                placeholder="请输入楼层数"
                style={{ width: '100%' }}
              />
            </Form.Item>
          )}
        />
        <Controller
          name="land_area"
          control={form.control}
          render={({ field, fieldState }) => (
            <Form.Item label="用地面积（亩）" validateStatus={fieldState.error ? 'error' : ''} help={fieldState.error?.message}>
              <InputNumber
                {...field}
                value={field.value ?? ''}
                onChange={(val) => field.onChange(val ?? '')}
                min={0}
                step={0.01}
                placeholder="请输入用地面积"
                style={{ width: '100%' }}
              />
            </Form.Item>
          )}
        />
        <Controller
          name="total_area"
          control={form.control}
          render={({ field, fieldState }) => (
            <Form.Item label="总面积（㎡）" validateStatus={fieldState.error ? 'error' : ''} help={fieldState.error?.message}>
              <InputNumber
                {...field}
                value={field.value ?? ''}
                onChange={(val) => field.onChange(val ?? '')}
                min={0}
                step={0.01}
                placeholder="请输入总面积"
                style={{ width: '100%' }}
              />
            </Form.Item>
          )}
        />
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
