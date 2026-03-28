'use client';

import { UseFormReturn } from 'react-hook-form';
import { Input } from '@apartment-ultra/shared-ui/components/ui';
import { Label } from '@apartment-ultra/shared-ui/components/ui';
import { ApartmentFormData } from './apartment-form';

interface LandlordInfoSectionProps {
  form: UseFormReturn<ApartmentFormData>;
}

export function LandlordInfoSection({ form }: LandlordInfoSectionProps) {
  const numberRegister = (
    name: keyof ApartmentFormData,
    form: UseFormReturn<ApartmentFormData>
  ) => ({
    ...form.register(name, {
      valueAsNumber: true,
      setValueAs: (v: unknown) => (v === '' || (typeof v === 'number' && isNaN(v)) ? undefined : v),
    }),
  });

  return (
    <details className="group border rounded-md p-3">
      <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
        上游信息（点击展开）
      </summary>
      <div className="mt-3 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="landlord_name">房东姓名</Label>
            <Input id="landlord_name" {...form.register('landlord_name')} placeholder="如：张三" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="landlord_contact">联系方式</Label>
            <Input
              id="landlord_contact"
              {...form.register('landlord_contact')}
              placeholder="如：138xxxx"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contract_start">合同开始</Label>
            <Input id="contract_start" type="date" {...form.register('contract_start')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contract_end">合同结束</Label>
            <Input id="contract_end" type="date" {...form.register('contract_end')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="landlord_rent">房东租金（元/月）</Label>
            <Input
              id="landlord_rent"
              type="number"
              min={0}
              step={0.01}
              {...numberRegister('landlord_rent', form)}
              placeholder="如：5000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="operating_cost">经营成本（元/月）</Label>
            <Input
              id="operating_cost"
              type="number"
              min={0}
              step={0.01}
              {...numberRegister('operating_cost', form)}
              placeholder="如：1000"
            />
          </div>
        </div>
      </div>
    </details>
  );
}
