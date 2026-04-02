'use client';

import type { UseFieldArrayAppend, UseFieldArrayRemove, UseFieldArrayReturn, UseFormReturn } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { Checkbox } from '@/components/ui';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@apartment-ultra/shared-ui/components/ui';
import { Input } from '@/components/ui';
import type { PlanCreateForm, PlanUpdateForm } from '../plans.schemas';

type PlanForm = PlanCreateForm | PlanUpdateForm;
type PricingField = UseFieldArrayReturn<PlanForm, 'pricing'>['fields'][number];

interface PlanPricingFieldsProps {
  form: UseFormReturn<PlanForm>;
  fields: PricingField[];
  append: UseFieldArrayAppend<PlanForm, 'pricing'>;
  remove: UseFieldArrayRemove;
}

export function PlanPricingFields({ form, fields, append, remove }: PlanPricingFieldsProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <FormLabel>周期定价</FormLabel>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            append({
              months: 1,
              price: 0,
              is_active: true,
              is_purchasable: true,
              sort_order: 0,
            })
          }
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
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="text-xs">月数</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(event) => field.onChange(Number(event.target.value))}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`pricing.${index}.price`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="text-xs">价格</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(event) => field.onChange(Number(event.target.value))}
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
                render={({ field }) => (
                  <FormItem className="flex items-center gap-1">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="text-xs">启用</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`pricing.${index}.is_purchasable`}
                render={({ field }) => (
                  <FormItem className="flex items-center gap-1">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="text-xs">允许购买</FormLabel>
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
