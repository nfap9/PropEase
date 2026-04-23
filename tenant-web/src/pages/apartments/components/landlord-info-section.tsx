import dayjs from 'dayjs';
import type { UseFormReturn } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { DatePicker, Input, Form, InputNumber } from 'antd';
import type { ApartmentFormData } from './apartment-form';

interface LandlordInfoSectionProps {
  form: UseFormReturn<ApartmentFormData>;
}

export function LandlordInfoSection({ form }: LandlordInfoSectionProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Controller
          name="landlord_name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Form.Item label="房东姓名" required validateStatus={fieldState.error ? 'error' : ''} help={fieldState.error?.message}>
              <Input placeholder="请输入房东姓名" {...field} />
            </Form.Item>
          )}
        />
        <Controller
          name="landlord_contact"
          control={form.control}
          render={({ field, fieldState }) => (
            <Form.Item label="联系方式" validateStatus={fieldState.error ? 'error' : ''} help={fieldState.error?.message}>
              <Input placeholder="请输入联系方式" {...field} />
            </Form.Item>
          )}
        />
        <Controller
          name="contract_start"
          control={form.control}
          render={({ field, fieldState }) => (
            <Form.Item label="合同开始" required validateStatus={fieldState.error ? 'error' : ''} help={fieldState.error?.message}>
              <DatePicker className="w-full" value={field.value ? dayjs(field.value) : null} onChange={(date) => field.onChange(date?.format('YYYY-MM-DD') ?? '')} />
            </Form.Item>
          )}
        />
        <Controller
          name="contract_end"
          control={form.control}
          render={({ field, fieldState }) => (
            <Form.Item label="合同结束" required validateStatus={fieldState.error ? 'error' : ''} help={fieldState.error?.message}>
              <DatePicker className="w-full" value={field.value ? dayjs(field.value) : null} onChange={(date) => field.onChange(date?.format('YYYY-MM-DD') ?? '')} />
            </Form.Item>
          )}
        />
        <Controller
          name="landlord_rent"
          control={form.control}
          render={({ field, fieldState }) => (
            <Form.Item label="房东租金（元/月）" required validateStatus={fieldState.error ? 'error' : ''} help={fieldState.error?.message}>
              <InputNumber
                {...field}
                value={field.value ?? ''}
                onChange={(val) => field.onChange(val ?? '')}
                min={0}
                step={0.01}
                placeholder="请输入房东租金"
                style={{ width: '100%' }}
              />
            </Form.Item>
          )}
        />
      </div>
    </div>
  );
}
