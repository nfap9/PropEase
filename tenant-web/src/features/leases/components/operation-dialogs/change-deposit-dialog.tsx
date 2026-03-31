'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { changeDepositSchema, type ChangeDepositFormData } from '../../schemas/lease-operations.schemas';
import { useChangeDeposit } from '../../hooks/use-lease-operations';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@apartment-ultra/shared-ui/components/ui';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@apartment-ultra/shared-ui/components/ui';
import { Input } from '@apartment-ultra/shared-ui/components/ui';

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

  const changeDeposit = useChangeDeposit(orgId, leaseId);

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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="newDeposit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>新押金 (元) *</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>原因备注</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="可选" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button type="submit" disabled={changeDeposit.isPending}>
                {changeDeposit.isPending ? '提交中...' : '确认变更'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
