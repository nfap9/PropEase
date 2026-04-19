
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { renewSchema, type RenewFormData } from '@/schemas/lease-operations';
import { useRenew } from '@/hooks/use-lease-operations';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { DatePickerComponent } from '@apartment-ultra/shared-ui/components/ui';
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
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col overflow-hidden p-0">
        <SheetHeader className="border-b px-6 py-5 text-left">
          <SheetTitle>续约</SheetTitle>
          <SheetDescription>{`当前结束日期：${currentEndDate ? new Date(currentEndDate).toLocaleDateString() : '长期'}`}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newEndDate">新结束日期 *</Label>
            <Controller
              name="newEndDate"
              control={form.control}
              render={({ field }) => (
                <DatePickerComponent
                  value={field.value || ''}
                  onChange={field.onChange}
                />
              )}
            />
            {form.formState.errors.newEndDate && (
              <p className="text-sm text-destructive">{form.formState.errors.newEndDate.message}</p>
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
        </form>
        </FormProvider>
        </div>

        <SheetFooter className="border-t px-6 py-4">
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={renew.isPending}>
              {renew.isPending ? '提交中...' : '确认续约'}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
