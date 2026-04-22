import dayjs from 'dayjs';
import { UseFormReturn, Controller } from 'react-hook-form';
import { DatePicker, Input, Form } from 'antd';
import { ApartmentFormData } from './apartment-form';

interface LandlordInfoSectionProps {
  form: UseFormReturn<ApartmentFormData>;
}

export function LandlordInfoSection({ form }: LandlordInfoSectionProps) {
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
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Form.Item
          label="房东姓名"
          required
          validateStatus={form.formState.errors.landlord_name ? 'error' : ''}
          help={form.formState.errors.landlord_name?.message}
        >
          <Controller
            name="landlord_name"
            control={form.control}
            render={({ field }) => (
              <Input placeholder="请输入房东姓名" {...field} />
            )}
          />
        </Form.Item>
        <Form.Item
          label="联系方式"
          validateStatus={form.formState.errors.landlord_contact ? 'error' : ''}
          help={form.formState.errors.landlord_contact?.message}
        >
          <Input
            {...form.register('landlord_contact')}
            placeholder="请输入联系方式"
          />
        </Form.Item>
        <Form.Item
          label="合同开始"
          required
          validateStatus={form.formState.errors.contract_start ? 'error' : ''}
          help={form.formState.errors.contract_start?.message}
        >
          <Controller
            name="contract_start"
            control={form.control}
            render={({ field }) => (
              <DatePicker
                className="w-full"
                value={field.value ? dayjs(field.value) : null}
                onChange={(date) => field.onChange(date?.format('YYYY-MM-DD') ?? '')}
              />
            )}
          />
        </Form.Item>
        <Form.Item
          label="合同结束"
          required
          validateStatus={form.formState.errors.contract_end ? 'error' : ''}
          help={form.formState.errors.contract_end?.message}
        >
          <Controller
            name="contract_end"
            control={form.control}
            render={({ field }) => (
              <DatePicker
                className="w-full"
                value={field.value ? dayjs(field.value) : null}
                onChange={(date) => field.onChange(date?.format('YYYY-MM-DD') ?? '')}
              />
            )}
          />
        </Form.Item>
        <Form.Item
          label="房东租金（元/月）"
          required
          validateStatus={form.formState.errors.landlord_rent ? 'error' : ''}
          help={form.formState.errors.landlord_rent?.message}
        >
          <Input
            type="number"
            min={0}
            step={0.01}
            {...numberRegister('landlord_rent', form)}
            placeholder="请输入房东租金"
          />
        </Form.Item>
      </div>
    </div>
  );
}
