'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { renewSchema, type RenewFormData } from '../../schemas/lease-operations.schemas';
import { useRenew } from '../../hooks/use-lease-operations';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { DateTimePicker } from '@apartment-ultra/shared-ui/components/ui';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@apartment-ultra/shared-ui/components/ui';
import { Input } from '@apartment-ultra/shared-ui/components/ui';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@apartment-ultra/shared-ui/components/ui';

interface RenewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  leaseId: string;
  currentEndDate?: string | null;
}

export function RenewSheet({ open, onOpenChange, orgId, leaseId, currentEndDate }: RenewSheetProps) {
  const form = useForm<RenewFormData>({
    resolver: zodResolver(renewSchema),
    defaultValues: { newEndDate: '', reason: '' },
  });

  const renew = useRenew(orgId, leaseId);

  const onSubmit = (data: RenewFormData) => {
    renew.mutate(data, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>续约</SheetTitle>
          <SheetDescription>
            当前结束日期：{currentEndDate ? new Date(currentEndDate).toLocaleDateString() : '长期'}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="newEndDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>新结束日期 *</FormLabel>
                  <FormControl>
                    <DateTimePicker
                      mode="date"
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="选择新结束日期"
                    />
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
            <SheetFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button type="submit" disabled={renew.isPending}>
                {renew.isPending ? '提交中...' : '确认续约'}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
