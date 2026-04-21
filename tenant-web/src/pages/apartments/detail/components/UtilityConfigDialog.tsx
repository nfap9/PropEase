
import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Modal, Button, Input, message, Form } from 'antd';
import { Loader2, Zap } from 'lucide-react';
import { utilityConfigApi } from '@/api/apartments';
import { getErrorMessage } from '@/utils/error';

const utilityConfigSchema = z.object({
  water_price_per_unit: z.number().min(0, '单价不能为负'),
  electricity_price_per_unit: z.number().min(0, '单价不能为负'),
});

type UtilityConfigFormData = z.infer<typeof utilityConfigSchema>;

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

  // 获取现有配置
  const { data: config, isLoading } = useQuery({
    queryKey: ['utility-config', orgId, apartmentId],
    queryFn: () => utilityConfigApi.get(apartmentId),
    enabled: !!orgId && !!apartmentId && open,
    retry: false,
  });

  // 表单
  const form = useForm<UtilityConfigFormData>({
    resolver: zodResolver(utilityConfigSchema),
    defaultValues: {
      water_price_per_unit: 0,
      electricity_price_per_unit: 0,
    },
  });

  // 当配置加载完成后，设置表单值
  useEffect(() => {
    if (config) {
      form.reset({
        water_price_per_unit: config.water_price_per_unit ?? 0,
        electricity_price_per_unit: config.electricity_price_per_unit ?? 0,
      });
    } else {
      form.reset({
        water_price_per_unit: 0,
        electricity_price_per_unit: 0,
      });
    }
  }, [config, form]);

  // 保存配置
  const saveMutation = useMutation({
    mutationFn: (data: UtilityConfigFormData) =>
      utilityConfigApi.createOrUpdate(apartmentId, {
        water_price_per_unit: data.water_price_per_unit,
        electricity_price_per_unit: data.electricity_price_per_unit,
      }),
    onSuccess: () => {
      message.success('水电单价已保存');
      queryClient.invalidateQueries({ queryKey: ['utility-config', orgId, apartmentId] });
      onOpenChange(false);
    },
    onError: (error) => {
      message.error(getErrorMessage(error, '保存失败，请重试'));
    },
  });

  const onSubmit = (data: UtilityConfigFormData) => {
    saveMutation.mutate(data);
  };

  return (
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      title={<span className="flex items-center gap-2"><Zap className="h-5 w-5" />水电配置</span>}
      footer={[
        <Button key="cancel" onClick={() => onOpenChange(false)}>取消</Button>,
        <Button key="submit" type="primary" loading={saveMutation.isPending} onClick={form.handleSubmit(onSubmit)}>保存</Button>,
      ]}
    >
      <p className="mb-4 text-sm text-gray-600">配置 {apartmentName} 的水电单价</p>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <Form
          layout="vertical"
          onFinish={form.handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <Form.Item
            label="水费单价（元/吨）"
            name="water_price_per_unit"
            validateStatus={form.formState.errors.water_price_per_unit ? 'error' : ''}
            help={form.formState.errors.water_price_per_unit?.message}
          >
            <Input
              type="number"
              step="0.01"
              placeholder="请输入水费单价"
              {...form.register('water_price_per_unit', { valueAsNumber: true })}
            />
          </Form.Item>

          <Form.Item
            label="电费单价（元/度）"
            name="electricity_price_per_unit"
            validateStatus={form.formState.errors.electricity_price_per_unit ? 'error' : ''}
            help={form.formState.errors.electricity_price_per_unit?.message}
          >
            <Input
              type="number"
              step="0.01"
              placeholder="请输入电费单价"
              {...form.register('electricity_price_per_unit', { valueAsNumber: true })}
            />
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
}

export default UtilityConfigDialog;
