'use client';

import { UseFormReturn } from 'react-hook-form';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Input } from '@apartment-ultra/shared-ui/components/ui';
import { Label } from '@apartment-ultra/shared-ui/components/ui';
import { Checkbox } from '@apartment-ultra/shared-ui/components/ui';
import type { LeaseSigningFormData } from '../leases.schemas';
import type { FeeType, FeeSpecification } from '@apartment-ultra/api-contract';

interface SelectedFee {
  fee_type_id: string;
  specification_id: string;
  fee_type_name: string;
  spec_name: string;
  price: number;
}

interface ContractInfoSectionProps {
  form: UseFormReturn<LeaseSigningFormData>;
  feeTypes?: FeeType[];
  selectedFees: SelectedFee[];
  onAddFee: (feeType: FeeType, spec: FeeSpecification) => void;
  onUpdateFeePrice: (specId: string, price: number) => void;
}

export function ContractInfoSection({
  form,
  feeTypes,
  selectedFees,
  onAddFee,
  onUpdateFeePrice,
}: ContractInfoSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground">合同信息</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_date">开始日期 *</Label>
          <Input id="start_date" type="date" {...form.register('start_date')} />
          {form.formState.errors.start_date && (
            <p className="text-sm text-destructive">{form.formState.errors.start_date.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_date">结束日期</Label>
          <Input id="end_date" type="date" {...form.register('end_date')} />
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
      {feeTypes && feeTypes.length > 0 && (
        <div className="space-y-3 border rounded-lg p-4">
          <Label className="text-base">额外费用（可选）</Label>
          {selectedFees.length > 0 && (
            <div className="space-y-2">
              {selectedFees.map((fee) => (
                <div key={fee.specification_id} className="flex items-center gap-2 bg-muted/50 rounded-lg p-2">
                  <Checkbox
                    checked={true}
                    onCheckedChange={() =>
                      onAddFee(
                        { id: fee.fee_type_id, name: fee.fee_type_name } as FeeType,
                        {
                          id: fee.specification_id,
                          name: fee.spec_name,
                          price_monthly: fee.price,
                        } as FeeSpecification
                      )
                    }
                  />
                  <span className="flex-1 text-sm">
                    {fee.fee_type_name} - {fee.spec_name}
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    value={fee.price}
                    onChange={(e) => onUpdateFeePrice(fee.specification_id, parseFloat(e.target.value) || 0)}
                    className="w-24 h-8"
                  />
                  <span className="text-sm text-muted-foreground">元/月</span>
                </div>
              ))}
            </div>
          )}
          <div className="space-y-2">
            {feeTypes.map((feeType) => {
              const specs = feeType.specifications?.filter((s) => s.is_active) || [];
              if (specs.length === 0) return null;
              return (
                <div key={feeType.id} className="space-y-1">
                  <div className="text-sm font-medium">{feeType.name}</div>
                  <div className="flex flex-wrap gap-2">
                    {specs.map((spec) => {
                      const isSelected = selectedFees.some((f) => f.specification_id === spec.id);
                      return (
                        <Button
                          key={spec.id}
                          type="button"
                          variant={isSelected ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => onAddFee(feeType, spec)}
                        >
                          {spec.name} (¥{spec.price_monthly}/月)
                        </Button>
                      );
                    })}
                  </div>
                </div>
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
