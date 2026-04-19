
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { changeUtilityRatesSchema, type ChangeUtilityRatesFormData } from '@/schemas/lease-operations';
import { useChangeUtilityRates } from '@/hooks/use-lease-operations';
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

interface ChangeUtilityRatesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  leaseId: string;
  currentWaterRate: number;
  currentElectricityRate: number;
}

export function ChangeUtilityRatesSheet({
  open,
  onOpenChange,
  orgId,
  leaseId,
  currentWaterRate,
  currentElectricityRate,
}: ChangeUtilityRatesSheetProps) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const form = useForm<ChangeUtilityRatesFormData>({
    resolver: zodResolver(changeUtilityRatesSchema),
    defaultValues: {
      waterRate: currentWaterRate,
      electricityRate: currentElectricityRate,
      effectiveFromYear: currentYear,
      effectiveFromMonth: currentMonth,
    },
  });

  const changeUtilityRates = useChangeUtilityRates(orgId, leaseId);

  const onSubmit = (data: ChangeUtilityRatesFormData) => {
    changeUtilityRates.mutate(data, {
      onSuccess: () => onOpenChange(false),
    });
  };

  const years = Array.from({ length: 5 }, (_, i) => currentYear + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col overflow-hidden p-0">
        <SheetHeader className="border-b px-6 py-5 text-left">
          <SheetTitle>水电单价变更</SheetTitle>
          <SheetDescription>{`当前：水 ¥${currentWaterRate}/吨 · 电 ¥${currentElectricityRate}/度`}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="waterRate">新水价 (元/吨) *</Label>
              <Controller
                name="waterRate"
                control={form.control}
                render={({ field }) => <Input type="number" step="0.01" {...field} />}
              />
              {form.formState.errors.waterRate && (
                <p className="text-sm text-destructive">{form.formState.errors.waterRate.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="electricityRate">新电价 (元/度) *</Label>
              <Controller
                name="electricityRate"
                control={form.control}
                render={({ field }) => <Input type="number" step="0.01" {...field} />}
              />
              {form.formState.errors.electricityRate && (
                <p className="text-sm text-destructive">{form.formState.errors.electricityRate.message}</p>
              )}
            </div>
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
        </form>
        </FormProvider>
        </div>

        <SheetFooter className="border-t px-6 py-4">
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={changeUtilityRates.isPending}>
              {changeUtilityRates.isPending ? '提交中...' : '确认变更'}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
