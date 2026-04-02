'use client';

import type { UseFieldArrayAppend, UseFieldArrayRemove, UseFieldArrayReturn, UseFormReturn } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@apartment-ultra/shared-ui/components/ui';
import { Input } from '@/components/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@apartment-ultra/shared-ui/components/ui';
import { DISCOUNT_TYPE_CONFIG, type StorefrontItemForm } from '../storefront.schemas';

export function StorefrontDiscountFields({
  form,
  fields,
  append,
  remove,
}: {
  form: UseFormReturn<StorefrontItemForm>;
  fields: UseFieldArrayReturn<StorefrontItemForm, 'pricing_discounts', 'id'>['fields'];
  append: UseFieldArrayAppend<StorefrontItemForm, 'pricing_discounts'>;
  remove: UseFieldArrayRemove;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <FormLabel>折扣配置（可选）</FormLabel>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            append({
              months: 1,
              discount_type: 'percent',
              discount_value: 1,
              gift_months: null,
            })
          }
        >
          <Plus className="mr-1 h-3 w-3" />
          添加折扣
        </Button>
      </div>

      <div className="space-y-2">
        {fields.map((field, index) => {
          const discountType = form.watch(`pricing_discounts.${index}.discount_type`);
          return (
            <div key={field.id} className="rounded border p-2">
              <div className="flex items-end gap-2">
                <FormField
                  control={form.control}
                  name={`pricing_discounts.${index}.months`}
                  render={({ field: monthsField }) => (
                    <FormItem className="w-20">
                      <FormLabel className="text-xs">购买月数</FormLabel>
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
                  name={`pricing_discounts.${index}.discount_type`}
                  render={({ field: discountTypeField }) => (
                    <FormItem className="w-24">
                      <FormLabel className="text-xs">折扣类型</FormLabel>
                      <Select onValueChange={discountTypeField.onChange} value={discountTypeField.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="percent">打折</SelectItem>
                          <SelectItem value="fixed">立减</SelectItem>
                          <SelectItem value="gift">赠送</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`pricing_discounts.${index}.discount_value`}
                  render={({ field: discountValueField }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-xs">折扣值</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...discountValueField}
                          value={discountValueField.value ?? ''}
                          onChange={(event) =>
                            discountValueField.onChange(
                              event.target.value === '' ? null : Number(event.target.value)
                            )
                          }
                          disabled={discountType === 'gift'}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`pricing_discounts.${index}.gift_months`}
                  render={({ field: giftMonthsField }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-xs">赠送月数</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...giftMonthsField}
                          value={giftMonthsField.value ?? ''}
                          onChange={(event) =>
                            giftMonthsField.onChange(
                              event.target.value === '' ? null : Number(event.target.value)
                            )
                          }
                          disabled={discountType !== 'gift'}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(index)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <FormDescription className="mt-1 text-xs">
                {DISCOUNT_TYPE_CONFIG[discountType]?.description ?? ''}
              </FormDescription>
            </div>
          );
        })}
      </div>
    </div>
  );
}

