
import type { UseFormReturn } from 'react-hook-form';
import { FormProvider, Controller } from 'react-hook-form';
import { Info } from 'lucide-react';
import { Alert, Button, Input, DatePicker, Modal } from 'antd';
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
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      title="编辑租约"
      footer={[
        <Button key="cancel" onClick={() => onOpenChange(false)}>
          取消
        </Button>,
        <Button key="submit" type="primary" onClick={() => form.handleSubmit(onSubmit)()} loading={isPending}>
          {isPending ? '保存中...' : '保存'}
        </Button>,
      ]}
    >
      <Alert
        className="border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200 mb-4"
        icon={<Info className="h-4 w-4" />}
        message="提示"
        description="已出账单不受影响；后续生成的账单将按新的租约信息计算。"
        type="info"
        showIcon
      />
      <FormProvider {...form}>
        <form id="edit-lease-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...form.register('room_id')} />
          <input type="hidden" {...form.register('tenant_id')} />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <span className="text-sm font-medium">房间</span>
              <Input
                value={
                  selectedLease?.room
                    ? `${selectedLease.room.apartment?.name || ''} - ${selectedLease.room.room_number}`
                    : ''
                }
                disabled
              />
            </div>
            <div className="space-y-2">
              <span className="text-sm font-medium">租客</span>
              <Input value={selectedLease?.tenant?.name || ''} disabled />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <span className="text-sm font-medium">开始日期 *</span>
              <Controller
                name="start_date"
                control={form.control}
                render={({ field }) => (
                  <DatePicker
                    className="w-full"
                    value={field.value ? undefined : undefined}
                    onChange={(_, dateString) => field.onChange(dateString)}
                    data-testid={LEASES.START_DATE_INPUT}
                  />
                )}
              />
              {form.formState.errors.start_date && (
                <p className="text-sm text-destructive">{form.formState.errors.start_date.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <span className="text-sm font-medium">结束日期</span>
              <Controller
                name="end_date"
                control={form.control}
                render={({ field }) => (
                  <DatePicker
                    className="w-full"
                    value={field.value ? undefined : undefined}
                    onChange={(_, dateString) => field.onChange(dateString)}
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
              <span className="text-sm font-medium">月租 (元) *</span>
              <Controller
                name="monthly_rent"
                control={form.control}
                render={({ field }) => (
                  <Input
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
              <span className="text-sm font-medium">押金 (元)</span>
              <Controller
                name="deposit"
                control={form.control}
                render={({ field }) => (
                  <Input
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
            <span className="text-sm font-medium">备注</span>
            <Controller
              name="notes"
              control={form.control}
              render={({ field }) => (
                <Input {...field} value={field.value ?? ''} data-testid={LEASES.NOTES_INPUT} />
              )}
            />
            {form.formState.errors.notes && (
              <p className="text-sm text-destructive">{form.formState.errors.notes.message}</p>
            )}
          </div>
        </form>
      </FormProvider>
    </Modal>
  );
}

export function LeaseTerminateDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
  lease,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
  lease?: Lease | null;
}) {
  return (
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      title="确认终止租约"
      onOk={onConfirm}
      okText={isPending ? '处理中...' : '确认终止'}
      okButtonProps={{ loading: isPending }}
    >
      <p>确定要终止此租约吗？终止后房间将变为空置状态。</p>
    </Modal>
  );
}

export function LeaseDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
  lease,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
  lease?: Lease | null;
}) {
  return (
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      title="确认删除"
      onOk={onConfirm}
      okText={isPending ? '删除中...' : '删除'}
      okButtonProps={{ danger: true, loading: isPending }}
    >
      <p>确定要删除此租约吗？此操作不可撤销。</p>
    </Modal>
  );
}
