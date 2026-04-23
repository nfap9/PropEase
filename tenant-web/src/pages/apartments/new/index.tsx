import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Input, DatePicker, Form, InputNumber, Space } from 'antd';
import dayjs from 'dayjs';
import { apartmentsApi } from '@/api/apartments';
import { useAuth } from '@/contexts/auth';
import { getErrorMessage } from '@/utils/error';
import { filterEmptyStrings } from '@/utils/form';
import { apartmentSchema, type ApartmentFormData } from '@/pages/apartments/components';

export default function NewApartmentPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { organization } = useAuth();
  const orgId = organization?.id;

  const form = useForm<ApartmentFormData>({
    resolver: zodResolver(apartmentSchema),
    defaultValues: {
      name: '',
      address: '',
      description: '',
      floors: undefined,
      land_area: undefined,
      total_area: undefined,
      landlord_name: '',
      landlord_contact: '',
      contract_start: '',
      contract_end: '',
      landlord_rent: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: ApartmentFormData) => apartmentsApi.create(filterEmptyStrings(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apartments', orgId] });
      toast.success('公寓创建成功');
      navigate('/workspace/apartments');
    },
    onError: (error) => toast.error(getErrorMessage(error, '创建失败，请重试')),
  });

  const onSubmit = (data: ApartmentFormData) => {
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
          公寓信息
        </h3>
      </div>

      {/* 可滚动表单 */}
      <Form layout="vertical" className="flex flex-1 flex-col gap-6 overflow-y-auto px-1">
        <div className="grid grid-cols-2 gap-4">
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
        </div>

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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Controller
              name="contract_start"
              control={form.control}
              render={({ field, fieldState }) => (
                <Form.Item label="合同开始" required validateStatus={fieldState.error ? 'error' : ''} help={fieldState.error?.message}>
                  <DatePicker
                    value={field.value ? dayjs(field.value) : null}
                    onChange={(date) => field.onChange(date?.format('YYYY-MM-DD') ?? '')}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              )}
            />
            <Controller
              name="contract_end"
              control={form.control}
              render={({ field, fieldState }) => (
                <Form.Item label="合同结束" required validateStatus={fieldState.error ? 'error' : ''} help={fieldState.error?.message}>
                  <DatePicker
                    value={field.value ? dayjs(field.value) : null}
                    onChange={(date) => field.onChange(date?.format('YYYY-MM-DD') ?? '')}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              )}
            />
          </div>

          <Controller
            name="landlord_rent"
            control={form.control}
            render={({ field, fieldState }) => (
              <Form.Item
                label="房东租金（元/月）"
                required
                validateStatus={fieldState.error ? 'error' : ''}
                help={fieldState.error?.message}
              >
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
