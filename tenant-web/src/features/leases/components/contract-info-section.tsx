'use client';

import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { DateTimePicker } from '@apartment-ultra/shared-ui/components/ui';
import { Input } from '@apartment-ultra/shared-ui/components/ui';
import { Label } from '@apartment-ultra/shared-ui/components/ui';
import { CheckSquare } from 'lucide-react';
import type { LeaseSigningFormData } from '../leases.schemas';
import type { FeeType, FeeSpecification } from '@apartment-ultra/api-contract';
import { FeeItemsEditorDialog } from './fee-items-editor-dialog';

interface FeeItem {
  id: string;
  name: string;
  feeTypeId?: string;
  specification?: string;
  specificationId?: string;
  unitPrice: number;
  quantity: number;
  billingCycle: 'monthly' | 'yearly';
}

interface ContractInfoSectionProps {
  form: UseFormReturn<LeaseSigningFormData>;
  orgId: string;
  feeTypes?: FeeType[];
  selectedFees: FeeItem[];
  onFeesChange: (fees: FeeItem[]) => void;
}

export function ContractInfoSection({
  form,
  orgId,
  feeTypes,
  selectedFees,
  onFeesChange,
}: ContractInfoSectionProps) {
  const [isFeeDialogOpen, setIsFeeDialogOpen] = useState(false);

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
      <div className="border rounded-lg p-4">
        <div className="flex justify-between items-center mb-3">
          <Label className="text-base">额外费用</Label>
          <Button type="button" variant="outline" size="sm" onClick={() => setIsFeeDialogOpen(true)}>
            <CheckSquare className="h-4 w-4 mr-2" />
            选择费用项目
          </Button>
        </div>

        {selectedFees.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">暂无费用项目</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b">
                <th className="pb-2 font-medium">费用类型</th>
                <th className="pb-2 font-medium">规格</th>
                <th className="pb-2 font-medium text-right">单价</th>
                <th className="pb-2 font-medium text-right">数量</th>
                <th className="pb-2 font-medium text-right">小计</th>
              </tr>
            </thead>
            <tbody>
              {selectedFees.map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="py-2">{item.name}</td>
                  <td className="py-2 text-muted-foreground">{item.specification || '-'}</td>
                  <td className="py-2 text-right">¥{item.unitPrice.toLocaleString()}</td>
                  <td className="py-2 text-right">× {item.quantity}</td>
                  <td className="py-2 text-right font-medium">
                    ¥{(item.unitPrice * item.quantity).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">备注</Label>
        <Input id="notes" {...form.register('notes')} />
      </div>

      <FeeItemsEditorDialog
        open={isFeeDialogOpen}
        onOpenChange={setIsFeeDialogOpen}
        orgId={orgId}
        leaseId=""
        currentItems={selectedFees}
        onSave={onFeesChange}
      />
    </div>
  );
}
