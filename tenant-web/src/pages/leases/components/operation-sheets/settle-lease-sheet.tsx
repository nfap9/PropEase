
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { settleLeaseSchema, type SettleLeaseFormData } from '@/schemas/lease-operations';
import { useSettleLease } from '@/hooks/use-lease-operations';
import { Button, Drawer, Input, Alert, Card } from 'antd';
import { Label } from '@/components/common/label';
import { AlertTriangle } from 'lucide-react';

interface SettleLeaseSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  leaseId: string;
}

export function SettleLeaseSheet({ open, onOpenChange, orgId, leaseId }: SettleLeaseSheetProps) {
  const form = useForm<SettleLeaseFormData>({
    resolver: zodResolver(settleLeaseSchema),
    defaultValues: {
      finalWaterReading: undefined,
      finalElectricityReading: undefined,
      penaltyAmount: undefined,
      remarks: '',
    },
  });

  const settleLease = useSettleLease(leaseId);
  const watchForm = form.watch();

  const onSubmit = (data: SettleLeaseFormData) => {
    settleLease.mutate(data, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <Drawer
      open={open}
      onClose={() => onOpenChange(false)}
      title="退租结算"
      width={400}
      footer={
        <div className="flex gap-3">
          <Button onClick={() => onOpenChange(false)}>取消</Button>
          <Button type="primary" danger loading={settleLease.isPending} onClick={form.handleSubmit(onSubmit)}>
            {settleLease.isPending ? '处理中...' : '确认退租结算'}
          </Button>
        </div>
      }
    >
      <p className="mb-4 text-sm text-gray-600">完成租约的最终结算，包括最后一期账单和押金处理</p>
      <FormProvider {...form}>
        <form className="space-y-4">
          <Alert
            message="退租结算后，租约将自动终止，房间将变为空置状态"
            type="warning"
            showIcon
            icon={<AlertTriangle className="h-4 w-4" />}
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="finalWaterReading">最终水表读数</Label>
              <Controller
                name="finalWaterReading"
                control={form.control}
                render={({ field }) => (
                  <Input type="number" step="0.01" {...field} placeholder="请输入" />
                )}
              />
              {form.formState.errors.finalWaterReading && (
                <p className="text-sm text-red-500">{form.formState.errors.finalWaterReading.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="finalElectricityReading">最终电表读数</Label>
              <Controller
                name="finalElectricityReading"
                control={form.control}
                render={({ field }) => (
                  <Input type="number" step="0.01" {...field} placeholder="请输入" />
                )}
              />
              {form.formState.errors.finalElectricityReading && (
                <p className="text-sm text-red-500">{form.formState.errors.finalElectricityReading.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="penaltyAmount">违约金金额</Label>
            <Controller
              name="penaltyAmount"
              control={form.control}
              render={({ field }) => (
                <Input type="number" step="0.01" {...field} placeholder="如有违约金请输入" />
              )}
            />
            {form.formState.errors.penaltyAmount && (
              <p className="text-sm text-red-500">{form.formState.errors.penaltyAmount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks">备注</Label>
            <Controller
              name="remarks"
              control={form.control}
              render={({ field }) => <Input {...field} placeholder="可选备注" />}
            />
            {form.formState.errors.remarks && (
              <p className="text-sm text-red-500">{form.formState.errors.remarks.message}</p>
            )}
          </div>

          {(watchForm.finalWaterReading !== undefined || watchForm.finalElectricityReading !== undefined) && (
            <Card title="结算预览" className="text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">最终水表读数</span>
                  <span>{watchForm.finalWaterReading ?? '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">最终电表读数</span>
                  <span>{watchForm.finalElectricityReading ?? '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">违约金</span>
                  <span>¥{(watchForm.penaltyAmount || 0).toLocaleString()}</span>
                </div>
              </div>
            </Card>
          )}
        </form>
      </FormProvider>
    </Drawer>
  );
}