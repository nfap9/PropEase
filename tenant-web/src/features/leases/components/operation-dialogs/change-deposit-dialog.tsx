'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { changeDepositSchema, type ChangeDepositFormData } from '../../schemas/lease-operations.schemas';
import { useChangeDeposit } from '../../hooks/use-lease-operations';
import { FormDialog } from '@apartment-ultra/shared-ui/components/ui';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@apartment-ultra/shared-ui/components/ui';
import { Input } from '@/components/ui';

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
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="押金变更"
      description={`当前押金：¥${currentDeposit.toLocaleString()}`}
      onSubmit={form.handleSubmit(onSubmit)}
      isPending={changeDeposit.isPending}
      submitLabel={changeDeposit.isPending ? '提交中...' : '确认变更'}
    >
      <Form {...form}>
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
      </Form>
    </FormDialog>
  );
}
