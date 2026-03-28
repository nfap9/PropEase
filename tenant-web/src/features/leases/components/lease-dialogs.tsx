'use client';

import type { UseFormReturn } from 'react-hook-form';
import { Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@apartment-ultra/shared-ui/components/ui';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
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
import type { Lease } from '@/types';
import { LEASES, type LeaseEditFormData } from '../leases.schemas';

export function LeaseEditDialog({
  open,
  onOpenChange,
  selectedLease,
  form,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedLease: Lease | null;
  form: UseFormReturn<LeaseEditFormData>;
  onSubmit: (data: LeaseEditFormData) => void;
  isPending: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" data-testid={LEASES.EDIT_DIALOG}>
        <DialogHeader>
          <DialogTitle>编辑租约</DialogTitle>
          <DialogDescription>修改租约信息</DialogDescription>
        </DialogHeader>
        <Alert className="border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200 [&>svg]:text-blue-800 dark:[&>svg]:text-blue-200">
          <Info className="h-4 w-4" />
          <AlertTitle>提示</AlertTitle>
          <AlertDescription>已出账单不受影响；后续生成的账单将按新的租约信息计算。</AlertDescription>
        </Alert>
        <Form {...form}>
          <form
            id="edit-lease-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <input type="hidden" {...form.register('room_id')} />
            <input type="hidden" {...form.register('tenant_id')} />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <FormLabel htmlFor="edit-room">房间</FormLabel>
                <Input
                  id="edit-room"
                  value={
                    selectedLease?.room
                      ? `${selectedLease.room.apartment?.name || ''} - ${selectedLease.room.room_number}`
                      : ''
                  }
                  disabled
                />
              </div>
              <div className="space-y-2">
                <FormLabel htmlFor="edit-tenant">租客</FormLabel>
                <Input id="edit-tenant" value={selectedLease?.tenant?.name || ''} disabled />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>开始日期 *</FormLabel>
                    <FormControl>
                      <Input id="edit-start_date" type="date" {...field} data-testid={LEASES.START_DATE_INPUT} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>结束日期</FormLabel>
                    <FormControl>
                      <Input id="edit-end_date" type="date" {...field} data-testid={LEASES.END_DATE_INPUT} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="monthly_rent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>月租 (元) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(event) => field.onChange(event.target.value === '' ? 0 : Number(event.target.value))}
                        value={field.value ?? ''}
                        data-testid={LEASES.MONTHLY_RENT_INPUT}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="deposit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>押金 (元)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(event) => field.onChange(event.target.value === '' ? 0 : Number(event.target.value))}
                        value={field.value ?? ''}
                        data-testid={LEASES.DEPOSIT_INPUT}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>备注</FormLabel>
                  <FormControl>
                    <Input id="edit-notes" {...field} value={field.value ?? ''} data-testid={LEASES.NOTES_INPUT} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid={LEASES.CANCEL_BUTTON}>
                取消
              </Button>
              <Button type="submit" disabled={isPending} data-testid={LEASES.CONFIRM_BUTTON}>
                {isPending ? '保存中...' : '保存'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function LeaseTerminateDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent data-testid={LEASES.TERMINATE_DIALOG}>
        <AlertDialogHeader>
          <AlertDialogTitle>确认终止租约</AlertDialogTitle>
          <AlertDialogDescription>确定要终止此租约吗？终止后房间将变为空置状态。</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid={LEASES.CANCEL_BUTTON}>取消</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} data-testid={LEASES.CONFIRM_TERMINATE_BTN}>
            {isPending ? '处理中...' : '确认终止'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function LeaseDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent data-testid={LEASES.DELETE_DIALOG}>
        <AlertDialogHeader>
          <AlertDialogTitle>确认删除</AlertDialogTitle>
          <AlertDialogDescription>确定要删除此租约吗？此操作不可撤销。</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid={LEASES.CANCEL_BUTTON}>取消</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            data-testid={LEASES.CONFIRM_DELETE_BTN}
          >
            {isPending ? '删除中...' : '删除'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
