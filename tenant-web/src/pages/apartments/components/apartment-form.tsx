import dayjs from 'dayjs';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { Input, Form, InputNumber } from 'antd';
import { ApartmentCreateSchema as apartmentSchema, type ApartmentFormData } from '@apartment-ultra/api-contract';
import { LandlordInfoSection, type LandlordInfoSectionRef } from './landlord-info-section';

export { apartmentSchema };
export type { ApartmentFormData };

export interface ApartmentFormRef {
  submit: () => Promise<void>;
  setFieldsValue: (values: Partial<ApartmentFormData>) => void;
}

interface ApartmentFormProps {
  initialValues?: Partial<ApartmentFormData>;
  onFinish?: (data: ApartmentFormData) => void;
}

export const ApartmentForm = forwardRef<ApartmentFormRef, ApartmentFormProps>(
  ({ initialValues, onFinish }, ref) => {
    const [form] = Form.useForm();
    const landlordRef = useRef<LandlordInfoSectionRef>(null);

    useImperativeHandle(ref, () => ({
      submit: async () => {
        try {
          const mainValues = await form.validateFields();
          await landlordRef.current?.validate();
          const landlordValues = landlordRef.current?.getValues() ?? {};
          const combined = { ...mainValues, ...landlordValues };
          if (combined.contract_start && typeof combined.contract_start !== 'string') {
            combined.contract_start = (combined.contract_start as dayjs.Dayjs).format('YYYY-MM-DD');
          }
          if (combined.contract_end && typeof combined.contract_end !== 'string') {
            combined.contract_end = (combined.contract_end as dayjs.Dayjs).format('YYYY-MM-DD');
          }
          onFinish?.(combined as ApartmentFormData);
        } catch {
          // validation failed
        }
      },
      setFieldsValue: (values) => {
        form.setFieldsValue(values);
        landlordRef.current?.setFieldsValue(values);
      },
    }));

    return (
      <Form
        form={form}
        layout="vertical"
        className="space-y-4"
        initialValues={initialValues}
      >
        <Form.Item
          name="name"
          label="公寓名称"
          rules={[{ required: true, message: '请输入公寓名称' }]}
        >
          <Input placeholder="请输入公寓名称" />
        </Form.Item>
        <Form.Item
          name="address"
          label="地址"
          rules={[{ required: true, message: '请输入公寓地址' }]}
        >
          <Input placeholder="请输入公寓地址" />
        </Form.Item>
        <Form.Item name="description" label="描述">
          <Input.TextArea placeholder="请输入描述" rows={2} />
        </Form.Item>
        <div className="grid grid-cols-3 gap-4">
          <Form.Item
            name="floors"
            label="楼层数"
            rules={[{ required: true, message: '请输入楼层数' }]}
          >
            <InputNumber min={1} placeholder="请输入楼层数" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="land_area"
            label="用地面积（亩）"
          >
            <InputNumber min={0} step={0.01} placeholder="请输入用地面积" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="total_area"
            label="总面积（㎡）"
          >
            <InputNumber min={0} step={0.01} placeholder="请输入总面积" style={{ width: '100%' }} />
          </Form.Item>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">上游信息</span>
          </div>
        </div>

        <LandlordInfoSection ref={landlordRef} initialValues={initialValues} />
      </Form>
    );
  }
);

ApartmentForm.displayName = 'ApartmentForm';
