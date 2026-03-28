'use client';

import type { UseFieldArrayAppend, UseFieldArrayRemove, UseFieldArrayReturn, UseFormReturn } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Checkbox } from '@apartment-ultra/shared-ui/components/ui';
import { FormControl, FormField, FormItem, FormLabel } from '@apartment-ultra/shared-ui/components/ui';
import { Input } from '@apartment-ultra/shared-ui/components/ui';
import type { ServiceProductForm } from '../service-pricing.schemas';

export function ServiceProductPricingFields({
  form,
  fields,
  append,
  remove,
}: {
  form: UseFormReturn<ServiceProductForm>;
  fields: UseFieldArrayReturn<ServiceProductForm, 'pricing', 'id'>['fields'];
  append: UseFieldArrayAppend<ServiceProductForm, 'pricing'>;
  remove: UseFieldArrayRemove;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <FormLabel>周期定价</FormLabel>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ months: 1, price: 0, is_active: true, sort_order: 0 })}
        >
          <Plus className="mr-1 h-3 w-3" />
          添加周期
        </Button>
      </div>

      <div className="space-y-2">
        {fields.map((field, index) => (
          <div key={field.id} className="rounded border p-2">
            <div className="flex items-end gap-2">
              <FormField
                control={form.control}
                name={`pricing.${index}.months`}
                render={({ field: monthsField }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="text-xs">月数</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...monthsField}
                        onChange={(event) => monthsField.onChange(Number(event.target.value))}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`pricing.${index}.price`}
                render={({ field: priceField }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="text-xs">价格</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...priceField}
                        onChange={(event) => priceField.onChange(Number(event.target.value))}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              {fields.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(index)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="mt-2 flex items-center gap-4">
              <FormField
                control={form.control}
                name={`pricing.${index}.is_active`}
                render={({ field: activeField }) => (
                  <FormItem className="flex items-center gap-1">
                    <FormControl>
                      <Checkbox checked={activeField.value} onCheckedChange={(checked) => activeField.onChange(checked === true)} />
                    </FormControl>
                    <FormLabel className="text-xs">启用</FormLabel>
                  </FormItem>
                )}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

