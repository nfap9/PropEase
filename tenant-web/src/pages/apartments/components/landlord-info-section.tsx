import dayjs from 'dayjs';
import { forwardRef, useImperativeHandle } from 'react';
import { DatePicker, Input, Form, InputNumber } from 'antd';
import type { FormInstance } from 'antd';

export interface LandlordInfoSectionRef {
  validate: () => Promise<void>;
  getValues: () => Record<string, unknown>;
  setFieldsValue: (values: Record<string, unknown>) => void;
}

interface LandlordInfoSectionProps {
  initialValues?: {
    landlord_name?: string;
    landlord_contact?: string;
    contract_start?: string;
    contract_end?: string;
    landlord_rent?: number;
  };
}

export const LandlordInfoSection = forwardRef<LandlordInfoSectionRef, LandlordInfoSectionProps>(
  ({ initialValues }, ref) => {
    const [form] = Form.useForm();

    useImperativeHandle(ref, () => ({
      validate: () => form.validateFields(),
      getValues: () => form.getFieldsValue(),
      setFieldsValue: (values: Record<string, unknown>) => form.setFieldsValue(values as Parameters<typeof form.setFieldsValue>[0]),
    }));

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="landlord_name"
            label="房东姓名"
            rules={[{ required: true, message: '请输入房东姓名' }]}
            initialValue={initialValues?.landlord_name}
          >
            <Input placeholder="请输入房东姓名" />
          </Form.Item>
          <Form.Item
            name="landlord_contact"
            label="联系方式"
            initialValue={initialValues?.landlord_contact}
          >
            <Input placeholder="请输入联系方式" />
          </Form.Item>
          <Form.Item
            name="contract_start"
            label="合同开始"
            rules={[{ required: true, message: '请选择合同开始日期' }]}
            initialValue={initialValues?.contract_start ? dayjs(initialValues.contract_start) : undefined}
          >
            <DatePicker className="w-full" />
          </Form.Item>
          <Form.Item
            name="contract_end"
            label="合同结束"
            rules={[{ required: true, message: '请选择合同结束日期' }]}
            initialValue={initialValues?.contract_end ? dayjs(initialValues.contract_end) : undefined}
          >
            <DatePicker className="w-full" />
          </Form.Item>
          <Form.Item
            name="landlord_rent"
            label="房东租金（元/月）"
            rules={[{ required: true, message: '请输入房东租金' }, { type: 'number', min: 0, message: '租金不能为负' }]}
            initialValue={initialValues?.landlord_rent}
          >
            <InputNumber min={0} step={0.01} placeholder="请输入房东租金" style={{ width: '100%' }} />
          </Form.Item>
        </div>
      </div>
    );
  }
);

LandlordInfoSection.displayName = 'LandlordInfoSection';
