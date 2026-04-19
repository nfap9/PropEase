
import type { UseFormReturn } from 'react-hook-form';
import { FormProvider, Controller } from 'react-hook-form';
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
import { Input } from '@apartment-ultra/shared-ui/components/ui';
import { DatePickerComponent } from '@apartment-ultra/shared-ui/components/ui';
import { Label } from '@apartment-ultra/shared-ui/components/ui';
import type { Lease } from '@/types';
import { LEASES, type LeaseEditFormData } from '@/schemas/leases';

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
        <FormProvider {...form}>
          <form id="edit-lease-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <input type="hidden" {...form.register('room_id')} />
            <input type="hidden" {...form.register('tenant_id')} />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-room">房间</Label>
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
                <Label htmlFor="edit-tenant">租客</Label>
                <Input id="edit-tenant" value={selectedLease?.tenant?.name || ''} disabled />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-start_date">开始日期 *</Label>
                <Controller
                  name="start_date"
                  control={form.control}
                  render={({ field }) => (
                    <DatePickerComponent
                      id="edit-start_date"
                      value={field.value || ''}
                      onChange={field.onChange}
                      data-testid={LEASES.START_DATE_INPUT}
                    />
                  )}
                />
                {form.formState.errors.start_date && (
                  <p className="text-sm text-destructive">{form.formState.errors.start_date.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-end_date">结束日期</Label>
                <Controller
                  name="end_date"
                  control={form.control}
                  render={({ field }) => (
                    <DatePickerComponent
                      id="edit-end_date"
                      value={field.value || ''}
                      onChange={field.onChange}
                      data-testid={LEASES.END_DATE_INPUT}
                    />
                  )}
                />
                {form.formState.errors.end_date && (
                  <p className="text-sm text-destructive">{form.formState.errors.end_date.message}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-monthly_rent">月租 (元) *</Label>
                <Controller
                  name="monthly_rent"
                  control={form.control}
                  render={({ field }) => (
                    <Input
                      id="edit-monthly_rent"
                      type="number"
                      step="0.01"
                      {...field}
                      onChange={(event) => field.onChange(event.target.value === '' ? 0 : Number(event.target.value))}
                      value={field.value ?? ''}
                      data-testid={LEASES.MONTHLY_RENT_INPUT}
                    />
                  )}
                />
                {form.formState.errors.monthly_rent && (
                  <p className="text-sm text-destructive">{form.formState.errors.monthly_rent.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-deposit">押金 (元)</Label>
                <Controller
                  name="deposit"
                  control={form.control}
                  render={({ field }) => (
                    <Input
                      id="edit-deposit"
                      type="number"
                      step="0.01"
                      {...field}
                      onChange={(event) => field.onChange(event.target.value === '' ? 0 : Number(event.target.value))}
                      value={field.value ?? ''}
                      data-testid={LEASES.DEPOSIT_INPUT}
                    />
                  )}
                />
                {form.formState.errors.deposit && (
                  <p className="text-sm text-destructive">{form.formState.errors.deposit.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">备注</Label>
              <Controller
                name="notes"
                control={form.control}
                render={({ field }) => (
                  <Input id="edit-notes" {...field} value={field.value ?? ''} data-testid={LEASES.NOTES_INPUT} />
                )}
              />
              {form.formState.errors.notes && (
                <p className="text-sm text-destructive">{form.formState.errors.notes.message}</p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid={LEASES.CANCEL_BUTTON}
              >
                取消
              </Button>
              <Button type="submit" disabled={isPending} data-testid={LEASES.CONFIRM_BUTTON}>
                {isPending ? '保存中...' : '保存'}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
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
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending}
            data-testid={LEASES.CONFIRM_TERMINATE_BTN}
          >
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
            disabled={isPending}
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
