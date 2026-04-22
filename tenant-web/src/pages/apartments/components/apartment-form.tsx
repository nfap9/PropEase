import { UseFormReturn, Controller } from 'react-hook-form';
import { Input, Form } from 'antd';
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
  const numberRegister = (
    name: keyof ApartmentFormData,
    formInstance: UseFormReturn<ApartmentFormData>
  ) => ({
    ...formInstance.register(name, {
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
      <Form.Item
        label="描述"
        validateStatus={form.formState.errors.description ? 'error' : ''}
        help={form.formState.errors.description?.message}
      >
        <Input {...form.register('description')} />
      </Form.Item>
      <div className="grid grid-cols-3 gap-4">
        <Form.Item
          label="楼层数"
          validateStatus={form.formState.errors.floors ? 'error' : ''}
          help={form.formState.errors.floors?.message}
        >
          <Input
            type="number"
            min={1}
            {...numberRegister('floors', form)}
            placeholder="请输入楼层数"
          />
        </Form.Item>
        <Form.Item
          label="用地面积（亩）"
          validateStatus={form.formState.errors.land_area ? 'error' : ''}
          help={form.formState.errors.land_area?.message}
        >
          <Input
            type="number"
            min={0}
            step={0.01}
            {...numberRegister('land_area', form)}
            placeholder="请输入用地面积"
          />
        </Form.Item>
        <Form.Item
          label="总面积（㎡）"
          validateStatus={form.formState.errors.total_area ? 'error' : ''}
          help={form.formState.errors.total_area?.message}
        >
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
