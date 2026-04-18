
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { changeRentSchema, type ChangeRentFormData } from '@/schemas/lease-operations';
import { useChangeRent } from '@/hooks/use-lease-operations';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@apartment-ultra/shared-ui/components/ui';

interface ChangeRentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  leaseId: string;
  currentRent: number;
}

export function ChangeRentSheet({ open, onOpenChange, orgId, leaseId, currentRent }: ChangeRentSheetProps) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const form = useForm<ChangeRentFormData>({
    resolver: zodResolver(changeRentSchema),
    defaultValues: {
      newRent: currentRent,
      effectiveFromYear: currentYear,
      effectiveFromMonth: currentMonth,
      reason: '',
    },
  });

  const changeRent = useChangeRent(orgId, leaseId);

  const onSubmit = (data: ChangeRentFormData) => {
    changeRent.mutate(data, {
      onSuccess: () => onOpenChange(false),
    });
  };

  const years = Array.from({ length: 5 }, (_, i) => currentYear + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col overflow-hidden p-0">
        <SheetHeader className="border-b px-6 py-5 text-left">
          <SheetTitle>房租变更</SheetTitle>
          <SheetDescription>{`当前月租：¥${currentRent.toLocaleString()}`}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newRent">新月租 (元) *</Label>
            <Controller
              name="newRent"
              control={form.control}
              render={({ field }) => <Input type="number" step="0.01" {...field} />}
            />
            {form.formState.errors.newRent && (
              <p className="text-sm text-destructive">{form.formState.errors.newRent.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="effectiveFromYear">生效年份 *</Label>
              <Controller
                name="effectiveFromYear"
                control={form.control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={String(field.value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((y) => (
                        <SelectItem key={y} value={String(y)}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.effectiveFromYear && (
                <p className="text-sm text-destructive">{form.formState.errors.effectiveFromYear.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="effectiveFromMonth">生效月份 *</Label>
              <Controller
                name="effectiveFromMonth"
                control={form.control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={String(field.value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((m) => (
                        <SelectItem key={m} value={String(m)}>
                          {m} 月
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.effectiveFromMonth && (
                <p className="text-sm text-destructive">{form.formState.errors.effectiveFromMonth.message}</p>
              )}
            </div>
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
            <Button type="submit" disabled={changeRent.isPending}>
              {changeRent.isPending ? '提交中...' : '确认变更'}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
