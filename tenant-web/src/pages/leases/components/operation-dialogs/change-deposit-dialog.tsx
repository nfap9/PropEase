
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { changeDepositSchema, type ChangeDepositFormData } from '@/schemas/lease-operations';
import { useChangeDeposit } from '@/hooks/use-lease-operations';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@apartment-ultra/shared-ui/components/ui';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Input } from '@apartment-ultra/shared-ui/components/ui';
import { Label } from '@apartment-ultra/shared-ui/components/ui';

interface ChangeDepositDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  leaseId: string;
  currentDeposit: number;
}

export function ChangeDepositDialog({ open, onOpenChange, orgId, leaseId, currentDeposit }: ChangeDepositDialogProps) {
  const form = useForm<ChangeDepositFormData>({
    resolver: zodResolver(changeDepositSchema),
    defaultValues: { newDeposit: currentDeposit, reason: '' },
  });

  const changeDeposit = useChangeDeposit(leaseId);

  const onSubmit = (data: ChangeDepositFormData) => {
    changeDeposit.mutate(data, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>押金变更</DialogTitle>
          <DialogDescription>当前押金：¥{currentDeposit.toLocaleString()}</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormProvider {...form}>
            <div className="space-y-2">
              <Label htmlFor="newDeposit">新押金 (元) *</Label>
              <Controller
                name="newDeposit"
                control={form.control}
                render={({ field }) => <Input type="number" step="0.01" {...field} />}
              />
              {form.formState.errors.newDeposit && (
                <p className="text-sm text-destructive">{form.formState.errors.newDeposit.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">原因备注</Label>
              <Controller
                name="reason"
                control={form.control}
                render={({ field }) => <Input {...field} placeholder="可选" />}
              />
              {form.formState.errors.reason && (
                <p className="text-sm text-destructive">{form.formState.errors.reason.message}</p>
              )}
            </div>
          </FormProvider>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={changeDeposit.isPending}>
              {changeDeposit.isPending ? '提交中...' : '确认变更'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
