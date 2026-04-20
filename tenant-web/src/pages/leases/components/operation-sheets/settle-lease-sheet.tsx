
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { settleLeaseSchema, type SettleLeaseFormData } from '@/schemas/lease-operations';
import { useSettleLease } from '@/hooks/use-lease-operations';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Input } from '@apartment-ultra/shared-ui/components/ui';
import { Label } from '@apartment-ultra/shared-ui/components/ui';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@apartment-ultra/shared-ui/components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@apartment-ultra/shared-ui/components/ui';
import { Alert, AlertDescription } from '@apartment-ultra/shared-ui/components/ui';
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col overflow-hidden p-0">
        <SheetHeader className="border-b px-6 py-5 text-left">
          <SheetTitle>退租结算</SheetTitle>
          <SheetDescription>完成租约的最终结算，包括最后一期账单和押金处理</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              退租结算后，租约将自动终止，房间将变为空置状态
            </AlertDescription>
          </Alert>

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
                <p className="text-sm text-destructive">{form.formState.errors.finalWaterReading.message}</p>
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
                <p className="text-sm text-destructive">{form.formState.errors.finalElectricityReading.message}</p>
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
              <p className="text-sm text-destructive">{form.formState.errors.penaltyAmount.message}</p>
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
              <p className="text-sm text-destructive">{form.formState.errors.remarks.message}</p>
            )}
          </div>

          {(watchForm.finalWaterReading !== undefined || watchForm.finalElectricityReading !== undefined) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">结算预览</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">最终水表读数</span>
                  <span>{watchForm.finalWaterReading ?? '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">最终电表读数</span>
                  <span>{watchForm.finalElectricityReading ?? '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">违约金</span>
                  <span>¥{(watchForm.penaltyAmount || 0).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          )}
          </form>
          </FormProvider>
        </div>

        <SheetFooter className="border-t px-6 py-4">
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={settleLease.isPending} variant="destructive">
              {settleLease.isPending ? '处理中...' : '确认退租结算'}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
