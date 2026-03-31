'use client';

import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { updateFeeItemsSchema, type UpdateFeeItemsFormData } from '../../schemas/lease-operations.schemas';
import { useUpdateFeeItems } from '../../hooks/use-lease-operations';
import { feeTypesApi } from '@/lib/api';
import type { LeaseFeeItem } from '@apartment-ultra/api-contract';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@apartment-ultra/shared-ui/components/ui';
import { Input } from '@apartment-ultra/shared-ui/components/ui';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@apartment-ultra/shared-ui/components/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@apartment-ultra/shared-ui/components/ui';
import { Plus, Trash2 } from 'lucide-react';

interface UpdateFeeItemsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  leaseId: string;
  currentFeeItems?: LeaseFeeItem[];
}

export function UpdateFeeItemsSheet({ open, onOpenChange, orgId, leaseId, currentFeeItems }: UpdateFeeItemsSheetProps) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const form = useForm<UpdateFeeItemsFormData>({
    resolver: zodResolver(updateFeeItemsSchema),
    defaultValues: {
      feeItems: [{ feeTypeId: '', specificationId: '', quantity: 1 }],
      effectiveFromYear: currentYear,
      effectiveFromMonth: currentMonth,
      reason: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'feeItems',
  });

  // 当对话框打开时，用当前费用项目初始化表单
  useEffect(() => {
    if (open && currentFeeItems && currentFeeItems.length > 0) {
      form.reset({
        feeItems: currentFeeItems.map(item => ({
          feeTypeId: item.fee_type_id,
          specificationId: item.specification_id || '',
          quantity: Number(item.quantity),
        })),
        effectiveFromYear: currentYear,
        effectiveFromMonth: currentMonth,
        reason: '',
      });
    } else if (open) {
      form.reset({
        feeItems: [{ feeTypeId: '', specificationId: '', quantity: 1 }],
        effectiveFromYear: currentYear,
        effectiveFromMonth: currentMonth,
        reason: '',
      });
    }
  }, [open, currentFeeItems, form, currentYear, currentMonth]);

  const updateFeeItems = useUpdateFeeItems(orgId, leaseId);

  const { data: feeTypes } = useQuery({
    queryKey: ['fee-types', orgId],
    queryFn: () => feeTypesApi.list(orgId),
    enabled: open,
  });

  const onSubmit = (data: UpdateFeeItemsFormData) => {
    updateFeeItems.mutate(data, {
      onSuccess: () => onOpenChange(false),
    });
  };

  const years = Array.from({ length: 5 }, (_, i) => currentYear + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>编辑费用项目</SheetTitle>
          <SheetDescription>设置租约的费用项目，生效后从指定账期开始计费</SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            {/* 费用项目列表 */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">费用项目</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ feeTypeId: '', specificationId: '', quantity: 1 })}
                >
                  <Plus className="h-4 w-4 mr-1" /> 添加
                </Button>
              </div>
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-start p-3 border rounded-lg">
                  <div className="flex-1 space-y-2">
                    <FormField
                      control={form.control}
                      name={`feeItems.${index}.feeTypeId`}
                      render={({ field: f }) => (
                        <FormItem className="space-y-2">
                          <Select value={f.value} onValueChange={f.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="费用类型" />
                            </SelectTrigger>
                            <SelectContent>
                              {feeTypes?.map((ft) => (
                                <SelectItem key={ft.id} value={ft.id}>{ft.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <FormField
                        control={form.control}
                        name={`feeItems.${index}.specificationId`}
                        render={({ field: f }) => (
                          <FormItem className="space-y-2">
                            <Select
                              value={f.value || ''}
                              onValueChange={(val) => f.onChange(val === '__none__' ? '' : val)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="规格（可选）" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__none__">无</SelectItem>
                                {feeTypes
                                  ?.find((ft) => ft.id === form.watch(`feeItems.${index}.feeTypeId`))
                                  ?.specifications?.filter((s) => s.is_active)
                                  .map((spec) => (
                                    <SelectItem key={spec.id} value={spec.id}>
                                      {spec.name} (¥{spec.price_monthly}/月)
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`feeItems.${index}.quantity`}
                        render={({ field: f }) => (
                          <FormItem className="space-y-2">
                            <FormControl>
                              <Input type="number" min="1" {...f} placeholder="数量" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  {fields.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* 生效期 */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="effectiveFromYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>生效年份 *</FormLabel>
                    <Select onValueChange={field.onChange} value={String(field.value)}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {years.map((y) => (
                          <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="effectiveFromMonth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>生效月份 *</FormLabel>
                    <Select onValueChange={field.onChange} value={String(field.value)}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {months.map((m) => (
                          <SelectItem key={m} value={String(m)}>{m} 月</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>原因备注</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="可选" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <SheetFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button type="submit" disabled={updateFeeItems.isPending}>
                {updateFeeItems.isPending ? '提交中...' : '确认更新'}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
