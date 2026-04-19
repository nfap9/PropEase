
import { UseFormReturn } from 'react-hook-form';
import { DatePickerInput } from '@apartment-ultra/shared-ui/components/ui';
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
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="landlord_name" required>
            房东姓名
          </Label>
          <Input id="landlord_name" {...form.register('landlord_name')} placeholder="请输入房东姓名" />
          {form.formState.errors.landlord_name && (
            <p className="text-sm text-destructive">{form.formState.errors.landlord_name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="landlord_contact">联系方式</Label>
          <Input
            id="landlord_contact"
            {...form.register('landlord_contact')}
            placeholder="请输入联系方式"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contract_start" required>
            合同开始
          </Label>
          <DatePickerInput
            id="contract_start"
            value={form.watch('contract_start') || ''}
            onChange={(value) => form.setValue('contract_start', value)}
          />
          {form.formState.errors.contract_start && (
            <p className="text-sm text-destructive">{form.formState.errors.contract_start.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="contract_end" required>
            合同结束
          </Label>
          <DatePickerInput
            id="contract_end"
            value={form.watch('contract_end') || ''}
            onChange={(value) => form.setValue('contract_end', value)}
          />
          {form.formState.errors.contract_end && (
            <p className="text-sm text-destructive">{form.formState.errors.contract_end.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="landlord_rent" required>
            房东租金（元/月）
          </Label>
          <Input
            id="landlord_rent"
            type="number"
            min={0}
            step={0.01}
            {...numberRegister('landlord_rent', form)}
            placeholder="请输入房东租金"
          />
          {form.formState.errors.landlord_rent && (
            <p className="text-sm text-destructive">{form.formState.errors.landlord_rent.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
