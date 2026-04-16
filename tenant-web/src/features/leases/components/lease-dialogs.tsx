
import type { UseFormReturn } from 'react-hook-form';
import { Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@apartment-ultra/shared-ui/components/ui';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { ConfirmDialog } from '@apartment-ultra/shared-ui/components/ui';
import { DateTimePicker } from '@apartment-ultra/shared-ui/components/ui';
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
import { Label } from '@apartment-ultra/shared-ui/components/ui';
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
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>开始日期 *</FormLabel>
                    <FormControl>
                      <DateTimePicker
                        id="edit-start_date"
                        mode="date"
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        data-testid={LEASES.START_DATE_INPUT}
                        placeholder="选择开始日期"
                      />
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
                      <DateTimePicker
                        id="edit-end_date"
                        mode="date"
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        data-testid={LEASES.END_DATE_INPUT}
                        placeholder="选择结束日期"
                      />
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
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="确认终止租约"
      description="确定要终止此租约吗？终止后房间将变为空置状态。"
      cancelLabel="取消"
      confirmLabel={isPending ? '处理中...' : '确认终止'}
      onConfirm={onConfirm}
      isPending={isPending}
      contentTestId={LEASES.TERMINATE_DIALOG}
      cancelTestId={LEASES.CANCEL_BUTTON}
      confirmTestId={LEASES.CONFIRM_TERMINATE_BTN}
    />
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
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="确认删除"
      description="确定要删除此租约吗？此操作不可撤销。"
      cancelLabel="取消"
      confirmLabel={isPending ? '删除中...' : '删除'}
      onConfirm={onConfirm}
      isPending={isPending}
      intent="destructive"
      contentTestId={LEASES.DELETE_DIALOG}
      cancelTestId={LEASES.CANCEL_BUTTON}
      confirmTestId={LEASES.CONFIRM_DELETE_BTN}
    />
  );
}
