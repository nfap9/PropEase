import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Input, DatePicker, Form, InputNumber, Space } from 'antd';
import dayjs from 'dayjs';
import { apartmentsApi } from '@/api/apartments';
import { useAuth } from '@/contexts/auth';
import { getErrorMessage } from '@propease/web-shared';

export default function NewApartmentPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { organization } = useAuth();
  const orgId = organization?.id;

  const [form] = Form.useForm();

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apartmentsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apartments', orgId] });
      toast.success('公寓创建成功');
      navigate('/workspace/apartments');
    },
    onError: (error) => toast.error(getErrorMessage(error, '创建失败，请重试')),
  });

  const onFinish = (values: Record<string, unknown>) => {
    // 过滤空字符串和undefined，转换数字字段
    const filtered = Object.fromEntries(
      Object.entries(values).filter(([, v]) => v !== '' && v !== undefined)
    );
    // 确保数字字段是number类型
    const data = {
      ...filtered,
      floors: filtered.floors ? Number(filtered.floors) : undefined,
      land_area: filtered.land_area ? Number(filtered.land_area) : undefined,
      total_area: filtered.total_area ? Number(filtered.total_area) : undefined,
      landlord_rent: filtered.landlord_rent ? Number(filtered.landlord_rent) : 0,
    };
    createMutation.mutate(data);
  };

  return (
    <div className="flex h-full flex-col">
      {/* 固定头部 */}
      <div className="shrink-0 px-1 pb-4">
        <h3 className="flex items-center gap-2 text-base font-medium text-gray-900">
          <button type="button" onClick={() => navigate(-1)} className="flex items-center justify-center">
            <ArrowLeft className="h-4 w-4" />
          </button>
          新增公寓
        </h3>
      </div>

      {/* 可滚动表单 */}
      <Form
        form={form}
        layout="vertical"
        className="flex flex-1 flex-col gap-6 overflow-y-auto px-1"
        onFinish={onFinish}
      >
        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="name"
            label="公寓名称"
            required
            rules={[{ required: true, message: '请输入公寓名称' }]}
          >
            <Input placeholder="请输入公寓名称" />
          </Form.Item>
          <Form.Item
            name="address"
            label="地址"
            required
            rules={[{ required: true, message: '请输入公寓地址' }]}
          >
            <Input placeholder="请输入公寓地址" />
          </Form.Item>
        </div>

        <Form.Item name="description" label="描述">
          <Input.TextArea placeholder="请输入描述" rows={2} />
        </Form.Item>

        <div className="grid grid-cols-3 gap-4">
          <Form.Item
            name="floors"
            label="楼层数"
            rules={[{ type: 'number', min: 1, message: '楼层数至少为1' }]}
          >
            <InputNumber min={1} placeholder="请输入楼层数" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="land_area"
            label="用地面积（亩）"
            rules={[{ type: 'number', min: 0, message: '面积不能为负' }]}
          >
            <InputNumber min={0} step={0.01} placeholder="请输入用地面积" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="total_area"
            label="总面积（㎡）"
            rules={[{ type: 'number', min: 0, message: '面积不能为负' }]}
          >
            <InputNumber min={0} step={0.01} placeholder="请输入总面积" style={{ width: '100%' }} />
          </Form.Item>
        </div>

        {/* 分割线 */}
        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-dashed border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500">上游信息</span>
          </div>
        </div>

        {/* 上游信息 */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="landlord_name"
              label="房东姓名"
            >
              <Input placeholder="请输入房东姓名" />
            </Form.Item>
            <Form.Item name="landlord_contact" label="联系方式">
              <Input placeholder="请输入联系方式" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="contract_start"
              label="合同开始"
              required
              rules={[{ required: true, message: '请选择合同开始时间' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="contract_end"
              label="合同结束"
              required
              rules={[{ required: true, message: '请选择合同结束时间' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <Form.Item
            name="landlord_rent"
            label="房东租金（元/月）"
            required
            rules={[{ type: 'number', min: 0, message: '请输入有效的租金' }]}
          >
            <InputNumber min={0} step={0.01} placeholder="请输入房东租金" style={{ width: '100%' }} />
          </Form.Item>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Space>
            <Button onClick={() => navigate(-1)}>取消</Button>
            <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
              {createMutation.isPending ? '创建中...' : '创建'}
            </Button>
          </Space>
        </div>
      </Form>
    </div>
  );
}
