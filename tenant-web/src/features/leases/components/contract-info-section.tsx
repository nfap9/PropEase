'use client';

import { UseFormReturn } from 'react-hook-form';
import { DateTimePicker } from '@apartment-ultra/shared-ui/components/ui';
import { Input } from '@apartment-ultra/shared-ui/components/ui';
import { Label } from '@apartment-ultra/shared-ui/components/ui';
import { FeeItemsEditor, type FeeItem } from '@/components/common/fee-items-editor';
import type { LeaseSigningFormData } from '../leases.schemas';

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
  const setDateFieldValue = (field: 'start_date' | 'end_date', value: string) => {
    form.setValue(field, value, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground">合同信息</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_date">开始日期 *</Label>
          <DateTimePicker
            id="start_date"
            mode="date"
            value={form.watch('start_date')}
            onChange={(value) => setDateFieldValue('start_date', value)}
            data-testid="leases-start-date-input"
            placeholder="选择开始日期"
          />
          {form.formState.errors.start_date && (
            <p className="text-sm text-destructive">{form.formState.errors.start_date.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_date">结束日期</Label>
          <DateTimePicker
            id="end_date"
            mode="date"
            value={form.watch('end_date')}
            onChange={(value) => setDateFieldValue('end_date', value)}
            data-testid="leases-end-date-input"
            placeholder="选择结束日期"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="monthly_rent">月租 (元) *</Label>
          <Input
            id="monthly_rent"
            type="number"
            step="0.01"
            {...form.register('monthly_rent', { valueAsNumber: true })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="deposit">押金 (元)</Label>
          <Input
            id="deposit"
            type="number"
            step="0.01"
            {...form.register('deposit', { valueAsNumber: true })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="water_rate">水费单价（元/吨）</Label>
          <Input
            id="water_rate"
            type="number"
            step="0.01"
            {...form.register('water_rate', { valueAsNumber: true })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="electricity_rate">电费单价（元/度）</Label>
          <Input
            id="electricity_rate"
            type="number"
            step="0.01"
            {...form.register('electricity_rate', { valueAsNumber: true })}
          />
        </div>
      </div>

      {/* 费用项目编辑器 */}
      <FeeItemsEditor items={feeItems} onChange={onFeeItemsChange} />

      <div className="space-y-2">
        <Label htmlFor="notes">备注</Label>
        <Input id="notes" {...form.register('notes')} />
      </div>
    </div>
  );
}
