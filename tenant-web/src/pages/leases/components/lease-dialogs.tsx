import type { UseFormReturn } from 'react-hook-form';
import { FormProvider, Controller } from 'react-hook-form';
import { Info } from 'lucide-react';
import { Alert, Button, Input, DatePicker, Modal, Form, InputNumber, Space } from 'antd';
import type { Lease } from '@/types';
import { LEASES, type LeaseEditFormData } from '@/schemas/leases';
import dayjs from 'dayjs';

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
      footer={
        <Space>
          <Button onClick={() => onOpenChange(false)}>取消</Button>
          <Button type="primary" loading={isPending} onClick={form.handleSubmit(onSubmit)}>
            {isPending ? '保存中...' : '保存'}
          </Button>
        </Space>
      }
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
        <Form layout="vertical" className="space-y-4">
          <input type="hidden" {...form.register('room_id')} />
          <input type="hidden" {...form.register('tenant_id')} />
          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="房间">
              <Input
                value={
                  selectedLease?.room
                    ? `${selectedLease.room.apartment?.name || ''} - ${selectedLease.room.room_number}`
                    : ''
                }
                disabled
              />
            </Form.Item>
            <Form.Item label="租客">
              <Input value={selectedLease?.tenant?.name || ''} disabled />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Controller
              name="start_date"
              control={form.control}
              render={({ field, fieldState }) => (
                <Form.Item label="开始日期" required validateStatus={fieldState.error ? 'error' : ''} help={fieldState.error?.message}>
                  <DatePicker
                    className="w-full"
                    value={field.value ? dayjs(field.value) : null}
                    onChange={(date) => field.onChange(date?.format('YYYY-MM-DD') ?? '')}
                    data-testid={LEASES.START_DATE_INPUT}
                  />
                </Form.Item>
              )}
            />
            <Controller
              name="end_date"
              control={form.control}
              render={({ field, fieldState }) => (
                <Form.Item label="结束日期" validateStatus={fieldState.error ? 'error' : ''} help={fieldState.error?.message}>
                  <DatePicker
                    className="w-full"
                    value={field.value ? dayjs(field.value) : null}
                    onChange={(date) => field.onChange(date?.format('YYYY-MM-DD') ?? '')}
                    data-testid={LEASES.END_DATE_INPUT}
                  />
                </Form.Item>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Controller
              name="monthly_rent"
              control={form.control}
              render={({ field, fieldState }) => (
                <Form.Item label="月租 (元)" required validateStatus={fieldState.error ? 'error' : ''} help={fieldState.error?.message}>
                  <InputNumber
                    {...field}
                    value={field.value ?? ''}
                    onChange={(val) => field.onChange(val ?? '')}
                    min={0}
                    step={0.01}
                    data-testid={LEASES.MONTHLY_RENT_INPUT}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              )}
            />
            <Controller
              name="deposit"
              control={form.control}
              render={({ field, fieldState }) => (
                <Form.Item label="押金 (元)" validateStatus={fieldState.error ? 'error' : ''} help={fieldState.error?.message}>
                  <InputNumber
                    {...field}
                    value={field.value ?? ''}
                    onChange={(val) => field.onChange(val ?? '')}
                    min={0}
                    step={0.01}
                    data-testid={LEASES.DEPOSIT_INPUT}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              )}
            />
          </div>

          <Controller
            name="notes"
            control={form.control}
            render={({ field, fieldState }) => (
              <Form.Item label="备注" validateStatus={fieldState.error ? 'error' : ''} help={fieldState.error?.message}>
                <Input.TextArea {...field} value={field.value ?? ''} data-testid={LEASES.NOTES_INPUT} rows={3} />
              </Form.Item>
            )}
          />
        </Form>
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
