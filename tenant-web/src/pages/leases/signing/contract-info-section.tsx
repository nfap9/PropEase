import { forwardRef, useImperativeHandle } from 'react';
import { Form, Input, DatePicker, InputNumber } from 'antd';
import { FeeItemsEditor, type FeeItem } from './fee-items-editor';

const { TextArea } = Input;

export interface ContractInfoSectionRef {
  validate: () => Promise<void>;
  getValues: () => {
    start_date?: string;
    end_date?: string;
    monthly_rent?: number;
    deposit?: number;
    water_rate?: number;
    electricity_rate?: number;
    notes?: string;
  };
}

interface ContractInfoSectionProps {
  feeItems: FeeItem[];
  onFeeItemsChange: (items: FeeItem[]) => void;
  initialValues?: {
    start_date?: string;
    end_date?: string;
    monthly_rent?: number;
    deposit?: number;
    water_rate?: number;
    electricity_rate?: number;
    notes?: string;
  };
}

export const ContractInfoSection = forwardRef<ContractInfoSectionRef, ContractInfoSectionProps>(
  function ContractInfoSection({ feeItems, onFeeItemsChange, initialValues }, ref) {
    const [form] = Form.useForm();

    useImperativeHandle(ref, () => ({
      validate: async () => {
        await form.validateFields(['start_date', 'monthly_rent']);
      },
      getValues: () => {
        const values = form.getFieldsValue();
        return {
          ...values,
          start_date: values.start_date?.format ? values.start_date.format('YYYY-MM-DD') : values.start_date,
          end_date: values.end_date?.format ? values.end_date.format('YYYY-MM-DD') : values.end_date,
        };
      },
    }));

    return (
      <Form form={form} layout="vertical" initialValues={initialValues}>
        <Form.Item
          label="开始日期"
          name="start_date"
          rules={[{ required: true, message: '请选择开始日期' }]}
        >
          <DatePicker className="w-full" />
        </Form.Item>
        <Form.Item label="结束日期" name="end_date">
          <DatePicker className="w-full" />
        </Form.Item>
        <Form.Item
          label="月租"
          name="monthly_rent"
          rules={[{ required: true, message: '请输入月租' }]}
        >
          <InputNumber min={0} step={0.01} placeholder="0.00" className="w-full" />
        </Form.Item>
        <Form.Item label="押金" name="deposit">
          <InputNumber min={0} step={0.01} placeholder="0.00" className="w-full" />
        </Form.Item>
        <FeeItemsEditor items={feeItems} onChange={onFeeItemsChange} />
        <Form.Item label="水费单价" name="water_rate">
          <InputNumber min={0} step={0.01} placeholder="0.00" className="w-full" />
        </Form.Item>
        <Form.Item label="电费单价" name="electricity_rate">
          <InputNumber min={0} step={0.01} placeholder="0.00" className="w-full" />
        </Form.Item>
        <Form.Item label="备注" name="notes">
          <TextArea placeholder="补充条款..." rows={3} />
        </Form.Item>
      </Form>
    );
  }
);
