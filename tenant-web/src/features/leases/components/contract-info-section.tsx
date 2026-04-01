'use client';

import { UseFormReturn } from 'react-hook-form';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { DateTimePicker } from '@apartment-ultra/shared-ui/components/ui';
import { Input } from '@apartment-ultra/shared-ui/components/ui';
import { Label } from '@apartment-ultra/shared-ui/components/ui';
import { Checkbox } from '@apartment-ultra/shared-ui/components/ui';
import type { LeaseSigningFormData } from '../leases.schemas';
import type { OrgFeeItem, FeeCycle } from '@apartment-ultra/api-contract';

interface SelectedFee {
  fee_item_id: string;
  fee_item_name: string;
  amount: number;
}

const CYCLE_LABELS: Record<FeeCycle, string> = {
  monthly: '每月',
  quarterly: '每季',
  yearly: '每年',
  one_time: '一次性',
};

interface ContractInfoSectionProps {
  form: UseFormReturn<LeaseSigningFormData>;
  feeItems?: OrgFeeItem[];
  selectedFees: SelectedFee[];
  onAddFee: (feeItem: OrgFeeItem) => void;
  onUpdateFeePrice: (feeItemId: string, price: number) => void;
}

export function ContractInfoSection({
  form,
  feeItems,
  selectedFees,
  onAddFee,
  onUpdateFeePrice,
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

      {/* 额外费用 */}
      {feeItems && feeItems.length > 0 && (
        <div className="space-y-3 border rounded-lg p-4">
          <Label className="text-base">额外费用（可选）</Label>
          {selectedFees.length > 0 && (
            <div className="space-y-2">
              {selectedFees.map((fee) => (
                <div key={fee.fee_item_id} className="flex items-center gap-2 bg-muted/50 rounded-lg p-2">
                  <Checkbox
                    checked={true}
                    onCheckedChange={() =>
                      onAddFee({
                        id: fee.fee_item_id,
                        name: fee.fee_item_name,
                        amount: fee.amount,
                      } as OrgFeeItem)
                    }
                  />
                  <span className="flex-1 text-sm">{fee.fee_item_name}</span>
                  <Input
                    type="number"
                    step="0.01"
                    value={fee.amount}
                    onChange={(e) => onUpdateFeePrice(fee.fee_item_id, parseFloat(e.target.value) || 0)}
                    className="w-24 h-8"
                  />
                  <span className="text-sm text-muted-foreground">元</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {feeItems
              .filter((item) => item.is_active)
              .map((item) => {
                const isSelected = selectedFees.some((f) => f.fee_item_id === item.id);
                return (
                  <Button
                    key={item.id}
                    type="button"
                    variant={isSelected ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onAddFee(item)}
                  >
                    {item.name} (¥{item.amount}/{CYCLE_LABELS[item.cycle]})
                  </Button>
                );
              })}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="notes">备注</Label>
        <Input id="notes" {...form.register('notes')} />
      </div>
    </div>
  );
}
