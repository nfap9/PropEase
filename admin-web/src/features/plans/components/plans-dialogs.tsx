'use client';

import { useEffect, useState } from 'react';
import { useFieldArray, useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DollarSign, Settings } from 'lucide-react';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Checkbox } from '@apartment-ultra/shared-ui/components/ui';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@apartment-ultra/shared-ui/components/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@apartment-ultra/shared-ui/components/ui';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@apartment-ultra/shared-ui/components/ui';
import { Input } from '@apartment-ultra/shared-ui/components/ui';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@apartment-ultra/shared-ui/components/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@apartment-ultra/shared-ui/components/ui';
import type { AdminPlan } from '@/lib/api/admin-client';
import { planCreateSchema, planUpdateSchema, type PlanCreateForm, type PlanUpdateForm } from '../plans.schemas';
import {
  getDefaultPlanCreateFormValues,
  getPlanUpdateFormValues,
} from '../plans.utils';
import { PlanPricingFields } from './plan-pricing-fields';

type PlanForm = PlanCreateForm | PlanUpdateForm;

function PlanFormSections({
  form,
  mode,
  activeTab,
  onTabChange,
}: {
  form: UseFormReturn<PlanForm>;
  mode: 'create' | 'edit';
  activeTab: string;
  onTabChange: (value: string) => void;
}) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'pricing',
  });

  return (
    <>
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>服务名称</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="code"
        render={({ field }) => (
          <FormItem>
            <FormLabel>服务代码</FormLabel>
            <FormControl>
              <Input placeholder="如 free, pro" {...field} disabled={mode === 'edit'} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{mode === 'create' ? '描述（选填）' : '描述'}</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pricing" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            价格配置
          </TabsTrigger>
          <TabsTrigger value="limits" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            用量配置
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pricing" className="space-y-4 pt-4">
          <PlanPricingFields form={form} fields={fields} append={append} remove={remove} />
          <FormField
            control={form.control}
            name="is_purchasable"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="!mt-0">允许用户在线购买</FormLabel>
              </FormItem>
            )}
          />
        </TabsContent>

        <TabsContent value="limits" className="space-y-4 pt-4">
          <div className={`grid grid-cols-2 gap-4 ${mode === 'create' ? 'sm:grid-cols-4' : 'sm:grid-cols-2'}`}>
            <FormField
              control={form.control}
              name="max_organizations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>最大组织数</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="-1 表示不限制" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="max_apartments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>最大公寓数</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="max_rooms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>最大房间数</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="max_members"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>最大团队成员数</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </TabsContent>
      </Tabs>

      <FormField
        control={form.control}
        name="sort_order"
        render={({ field }) => (
          <FormItem>
            <FormLabel>排序</FormLabel>
            <FormControl>
              <Input type="number" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {mode === 'edit' && (
        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={(value) => field.onChange(value === true)} />
              </FormControl>
              <FormLabel className="!mt-0">启用</FormLabel>
            </FormItem>
          )}
        />
      )}
    </>
  );
}

export function PlanCreateDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PlanCreateForm) => void;
  isPending: boolean;
}) {
  const [activeTab, setActiveTab] = useState('pricing');
  const form = useForm<PlanCreateForm>({
    resolver: zodResolver(planCreateSchema),
    defaultValues: getDefaultPlanCreateFormValues(),
  });

  useEffect(() => {
    if (open) {
      setActiveTab('pricing');
      form.reset(getDefaultPlanCreateFormValues());
    }
  }, [form, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>新建服务</DialogTitle>
          <DialogDescription>创建新的订阅服务</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <PlanFormSections form={form as UseFormReturn<PlanForm>} mode="create" activeTab={activeTab} onTabChange={setActiveTab} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? '提交中…' : '创建'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function PlanEditSheet({
  open,
  onOpenChange,
  plan,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: AdminPlan | null;
  onSubmit: (data: PlanUpdateForm, activeTab: string) => void;
  isPending: boolean;
}) {
  const [activeTab, setActiveTab] = useState('pricing');
  const form = useForm<PlanUpdateForm>({
    resolver: zodResolver(planUpdateSchema),
  });

  useEffect(() => {
    if (open && plan) {
      setActiveTab('pricing');
      form.reset(getPlanUpdateFormValues(plan));
    }
  }, [form, open, plan]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="max-h-screen w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>编辑服务</SheetTitle>
          <SheetDescription>{plan?.name}</SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => onSubmit(data, activeTab))}
            className="mt-4 space-y-4"
          >
            <PlanFormSections form={form as UseFormReturn<PlanForm>} mode="edit" activeTab={activeTab} onTabChange={setActiveTab} />
            <SheetFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? '保存中…' : '保存'}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}

export function PlanDeleteDialog({
  open,
  onOpenChange,
  plan,
  onConfirm,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: AdminPlan | null;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认删除</AlertDialogTitle>
          <AlertDialogDescription>
            确定要删除服务「{plan?.name}」吗？若已有组织使用该服务，可能影响业务。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? '删除中…' : '删除'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
