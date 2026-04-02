'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { settleLeaseSchema, type SettleLeaseFormData } from '../../schemas/lease-operations.schemas';
import { useSettleLease } from '../../hooks/use-lease-operations';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@apartment-ultra/shared-ui/components/ui';
import { Input } from '@apartment-ultra/shared-ui/components/ui';
import { AppDrawer } from '@apartment-ultra/shared-ui/components/ui';
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

  const settleLease = useSettleLease(orgId, leaseId);
  const watchForm = form.watch();

  const onSubmit = (data: SettleLeaseFormData) => {
    settleLease.mutate(data, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="退租结算"
      description="完成租约的最终结算，包括最后一期账单和押金处理"
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button type="submit" disabled={settleLease.isPending} variant="destructive">
            {settleLease.isPending ? '处理中...' : '确认退租结算'}
          </Button>
        </>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              退租结算后，租约将自动终止，房间将变为空置状态
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="finalWaterReading"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>最终水表读数</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} placeholder="请输入" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="finalElectricityReading"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>最终电表读数</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} placeholder="请输入" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="penaltyAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>违约金金额</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} placeholder="如有违约金请输入" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="remarks"
            render={({ field }) => (
              <FormItem>
                <FormLabel>备注</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="可选备注" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
      </Form>
    </AppDrawer>
  );
}
