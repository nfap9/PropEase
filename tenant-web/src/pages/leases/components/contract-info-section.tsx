import { UseFormReturn, Controller } from 'react-hook-form';
import { CalendarDays, Banknote, Droplets, Zap, FileText, AlertCircle } from 'lucide-react';
import { Input, DatePicker, InputNumber } from 'antd';
import dayjs from 'dayjs';
import { Label } from '@/components/common/label';
import { FeeItemsEditor, type FeeItem } from '@/components/common/fee-items-editor';
import type { LeaseSigningFormData } from '@/schemas/leases';

interface ContractInfoSectionProps {
  form: UseFormReturn<LeaseSigningFormData>;
  feeItems: FeeItem[];
  onFeeItemsChange: (items: FeeItem[]) => void;
}

export function ContractInfoSection({
  form,
  feeItems,
  onFeeItemsChange,
}: ContractInfoSectionProps) {
  const errors = form.formState.errors;
  const monthlyRent = form.watch('monthly_rent') || 0;
  const deposit = form.watch('deposit') || 0;

  const totalMonthly = feeItems
    .filter((f) => f.cycle === 'monthly')
    .reduce((sum, f) => sum + f.amount, 0);

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
          <FileText className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-foreground">合同条款</h3>
          <p className="text-sm text-muted-foreground">设置租约日期、租金及附加费用</p>
        </div>
      </div>

      {/* Lease Term Card */}
      <div className="rounded-2xl border border-border/60 bg-muted/20 p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <CalendarDays className="h-4 w-4 text-amber-600" />
          租约期限
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start_date" className="text-sm font-medium">
              开始日期 <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="start_date"
              control={form.control}
              render={({ field }) => (
                <DatePicker
                  id="start_date"
                  value={field.value ? dayjs(field.value) : null}
                  onChange={(date) => field.onChange(date?.format('YYYY-MM-DD') ?? '')}
                  data-testid="leases-start-date-input"
                  className="w-full rounded-xl shadow-sm"
                />
              )}
            />
            {errors.start_date && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.start_date.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="end_date" className="text-sm font-medium">
              结束日期
            </Label>
            <Controller
              name="end_date"
              control={form.control}
              render={({ field }) => (
                <DatePicker
                  id="end_date"
                  value={field.value ? dayjs(field.value) : null}
                  onChange={(date) => field.onChange(date?.format('YYYY-MM-DD') ?? '')}
                  data-testid="leases-end-date-input"
                  className="w-full rounded-xl shadow-sm"
                />
              )}
            />
            <p className="text-xs text-muted-foreground">留空表示无固定期限租约</p>
          </div>
        </div>
      </div>

      {/* Financials Card */}
      <div className="rounded-2xl border border-border/60 bg-muted/20 p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Banknote className="h-4 w-4 text-amber-600" />
          租金与押金
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="monthly_rent" className="text-sm font-medium">
              月租 (元) <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="monthly_rent"
              control={form.control}
              render={({ field, fieldState }) => (
                <>
                  <InputNumber
                    {...field}
                    value={field.value ?? ''}
                    onChange={(val) => field.onChange(val ?? '')}
                    min={0}
                    step={0.01}
                    placeholder="0.00"
                    className="rounded-xl h-12 text-base font-semibold shadow-sm w-full"
                    suffix={<span className="text-sm text-muted-foreground">元/月</span>}
                  />
                  {fieldState.error && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {fieldState.error.message}
                    </p>
                  )}
                </>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deposit" className="text-sm font-medium">
              押金 (元)
            </Label>
            <Controller
              name="deposit"
              control={form.control}
              render={({ field }) => (
                <InputNumber
                  {...field}
                  value={field.value ?? ''}
                  onChange={(val) => field.onChange(val ?? '')}
                  min={0}
                  step={0.01}
                  placeholder="0.00"
                  className="rounded-xl h-12 text-base font-semibold shadow-sm w-full"
                  suffix={<span className="text-sm text-muted-foreground">元</span>}
                />
              )}
            />
          </div>
        </div>

        {/* Fee Items */}
        <FeeItemsEditor items={feeItems} onChange={onFeeItemsChange} />

        {/* Financial summary bar */}
        {(monthlyRent > 0 || totalMonthly > 0) && (
          <div className="mt-3 rounded-xl bg-card border border-border p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">月租</span>
              <span className="font-medium">¥{monthlyRent.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
            </div>
            {totalMonthly > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">附加费用（月）</span>
                <span className="font-medium">¥{totalMonthly.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="h-px bg-border my-1" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">每月合计</span>
              <span className="text-lg font-bold text-amber-600">
                ¥{(monthlyRent + totalMonthly).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            {deposit > 0 && (
              <div className="flex items-center justify-between text-sm pt-1">
                <span className="text-muted-foreground">押金</span>
                <span className="font-medium">¥{deposit.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Utility Rates Card */}
      <div className="rounded-2xl border border-border/60 bg-muted/20 p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Droplets className="h-4 w-4 text-blue-500" />
          水电费率
          <span className="text-xs text-muted-foreground ml-1 font-normal">（按账单周期计费）</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="water_rate" className="flex items-center gap-1.5 text-sm font-medium">
              <Droplets className="h-3.5 w-3.5 text-blue-400" />
              水费单价
            </Label>
            <Controller
              name="water_rate"
              control={form.control}
              render={({ field }) => (
                <InputNumber
                  {...field}
                  value={field.value ?? ''}
                  onChange={(val) => field.onChange(val ?? '')}
                  min={0}
                  step={0.01}
                  placeholder="0.00"
                  className="rounded-xl h-11 shadow-sm w-full"
                  suffix={<span className="text-xs text-muted-foreground">元/吨</span>}
                />
              )}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="electricity_rate" className="flex items-center gap-1.5 text-sm font-medium">
              <Zap className="h-3.5 w-3.5 text-yellow-500" />
              电费单价
            </Label>
            <Controller
              name="electricity_rate"
              control={form.control}
              render={({ field }) => (
                <InputNumber
                  {...field}
                  value={field.value ?? ''}
                  onChange={(val) => field.onChange(val ?? '')}
                  min={0}
                  step={0.01}
                  placeholder="0.00"
                  className="rounded-xl h-11 shadow-sm w-full"
                  suffix={<span className="text-xs text-muted-foreground">元/度</span>}
                />
              )}
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="rounded-2xl border border-border/60 bg-muted/20 p-5 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <FileText className="h-4 w-4 text-muted-foreground" />
          备注
        </div>
        <Input
          id="notes"
          placeholder="补充条款、特殊约定或其他说明..."
          className="rounded-xl shadow-sm"
          {...form.register('notes')}
        />
      </div>
    </div>
  );
}
