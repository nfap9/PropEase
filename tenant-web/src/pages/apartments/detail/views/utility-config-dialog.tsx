import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Modal, Button, InputNumber, Space, Form } from 'antd';
import { Zap } from 'lucide-react';
import { utilityConfigApi } from '@/api/apartments';
import { getErrorMessage } from '@apartment-ultra/web-shared';

interface UtilityConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  apartmentId: string;
  apartmentName: string;
}

export function UtilityConfigDialog({
  open,
  onOpenChange,
  orgId,
  apartmentId,
  apartmentName,
}: UtilityConfigDialogProps) {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();

  const { data: config, isLoading } = useQuery({
    queryKey: ['utility-config', orgId, apartmentId],
    queryFn: () => utilityConfigApi.get(apartmentId),
    enabled: !!orgId && !!apartmentId && open,
    retry: false,
  });

  useEffect(() => {
    if (open) {
      if (config) {
        form.setFieldsValue({
          water_price_per_unit: config.water_price_per_unit ?? 0,
          electricity_price_per_unit: config.electricity_price_per_unit ?? 0,
        });
      } else {
        form.setFieldsValue({
          water_price_per_unit: 0,
          electricity_price_per_unit: 0,
        });
      }
    }
  }, [open, config, form]);

  const saveMutation = useMutation({
    mutationFn: (data: { water_price_per_unit: number; electricity_price_per_unit: number }) =>
      utilityConfigApi.createOrUpdate(apartmentId, {
        water_price_per_unit: data.water_price_per_unit,
        electricity_price_per_unit: data.electricity_price_per_unit,
      }),
    onSuccess: () => {
      toast.success('水电单价已保存');
      queryClient.invalidateQueries({ queryKey: ['utility-config', orgId, apartmentId] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, '保存失败，请重试'));
    },
  });

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      saveMutation.mutate(values);
    });
  };

  return (
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      title={<span className="flex items-center gap-2"><Zap className="h-5 w-5" />水电配置</span>}
      footer={
        <Space>
          <Button onClick={() => onOpenChange(false)}>取消</Button>
          <Button type="primary" loading={saveMutation.isPending} onClick={handleSubmit}>保存</Button>
        </Space>
      }
    >
      <p className="mb-4 text-sm text-gray-600">配置 {apartmentName} 的水电单价</p>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <span className="text-gray-400">加载中...</span>
        </div>
      ) : (
        <Form form={form} layout="vertical" className="space-y-4">
          <Form.Item
            name="water_price_per_unit"
            label="水费单价（元/吨）"
            rules={[{ type: 'number', min: 0, message: '单价不能为负' }]}
          >
            <InputNumber
              min={0}
              step={0.01}
              placeholder="请输入水费单价"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="electricity_price_per_unit"
            label="电费单价（元/度）"
            rules={[{ type: 'number', min: 0, message: '单价不能为负' }]}
          >
            <InputNumber
              min={0}
              step={0.01}
              placeholder="请输入电费单价"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
}

export default UtilityConfigDialog;
