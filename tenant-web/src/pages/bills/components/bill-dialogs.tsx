
import type { UseFormReturn } from 'react-hook-form';
import { Download, DollarSign, Share2 } from 'lucide-react';
import { Tag, Button, Input, DatePicker, Select, Modal, Skeleton } from 'antd';
import type { MenuProps } from 'antd';
import { formatDate } from '@/utils/date';
import { BILL_STATUS_CONFIG } from '@/utils/status';
import type { Bill, BillFeeItem, Payment, PaymentMethod } from '@/types';
import {
  BILLS,
  PAYMENT_METHOD_LABELS,
  type GenerateBillsFormData,
  type PaymentFormData,
} from '@/schemas/bills';
import {
  formatBillPeriod,
  formatPaymentRecord,
  getBillDetailDescription,
  getBillPaymentSummary,
} from '@/utils/bills';
import { tenantI18n, tenantMessages } from '@/i18n';

export function BillDetailDialog({
  open,
  onOpenChange,
  selectedBillId,
  billDetail,
  billFeeItems,
  isLoading,
  feeItemsLoading,
  sharingBillId,
  onPayment,
  onShare,
  onExportPdf,
  canEditBill = true,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedBillId: string | null;
  billDetail: Bill | null | undefined;
  billFeeItems: BillFeeItem[] | undefined;
  isLoading: boolean;
  feeItemsLoading: boolean;
  sharingBillId: string | null;
  onPayment: () => void;
  onShare: () => void;
  onExportPdf: (billId: string) => void;
  /** 是否有编辑账单权限 */
  canEditBill?: boolean;
}) {
  return (
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      title={tenantMessages.bills.dialogs.detailTitle}
      footer={null}
      width={600}
    >
      {isLoading ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : billDetail ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{getBillDetailDescription(billDetail ?? null, selectedBillId)}</p>
          <div className="grid gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{tenantMessages.bills.dialogs.billMonth}</span>
              <span>{formatBillPeriod(billDetail)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{tenantMessages.bills.dialogs.apartmentRoom}</span>
              <span>
                {billDetail.lease?.room?.apartment?.name ?? '-'} - {billDetail.lease?.room?.room_number ?? '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{tenantMessages.bills.dialogs.tenant}</span>
              <span>{billDetail.lease?.tenant?.name ?? '-'}</span>
            </div>
            <div className="grid gap-2 border-t pt-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{tenantMessages.bills.dialogs.rent}</span>
                <span>¥{Number(billDetail.rent_amount).toLocaleString()}</span>
              </div>
              {(billDetail.deposit_amount ?? 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{tenantMessages.bills.dialogs.deposit}</span>
                  <span>¥{Number(billDetail.deposit_amount).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">{tenantMessages.bills.dialogs.water}</span>
                <span>¥{Number(billDetail.water_amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{tenantMessages.bills.dialogs.electricity}</span>
                <span>¥{Number(billDetail.electricity_amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{tenantMessages.bills.dialogs.otherFees}</span>
                <span>¥{Number(billDetail.other_amount).toLocaleString()}</span>
              </div>
            </div>

            {feeItemsLoading ? (
              <div className="space-y-2">
                <Skeleton active paragraph={{ rows: 1 }} />
              </div>
            ) : billFeeItems && billFeeItems.length > 0 ? (
              <div className="mt-4">
                <h4 className="mb-2 text-sm font-medium">{tenantMessages.bills.dialogs.feeDetails}</h4>
                <div className="rounded-md border">
                  <div className="divide-y">
                    {billFeeItems.map((item) => (
                      <div key={item.id} className="flex justify-between px-3 py-2 text-sm">
                        <span>
                          {item.fee_name}
                          {item.specification_name && (
                            <span className="ml-1 text-muted-foreground">({item.specification_name})</span>
                          )}
                        </span>
                        <span>¥{Number(item.amount).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="flex justify-between border-t pt-3 font-medium">
              <span>{tenantMessages.bills.dialogs.total}</span>
              <span>¥{Number(billDetail.total_amount).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{tenantMessages.bills.dialogs.paid}</span>
              <span className="text-green-600">¥{Number(billDetail.paid_amount).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{tenantMessages.bills.dialogs.dueDate}</span>
              <span>{formatDate(billDetail.due_date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{tenantMessages.bills.dialogs.status}</span>
              <Tag color={BILL_STATUS_CONFIG[billDetail.status].color}>
                {BILL_STATUS_CONFIG[billDetail.status].label}
              </Tag>
            </div>
            {billDetail.notes && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{tenantMessages.bills.dialogs.notes}</span>
                <span>{billDetail.notes}</span>
              </div>
            )}
          </div>

          {(billDetail as Bill & { payments?: Payment[] }).payments?.length ? (
            <div>
              <h4 className="mb-2 text-sm font-medium">{tenantMessages.bills.dialogs.paymentRecords}</h4>
              <div className="rounded-md border">
                <div className="divide-y">
                  {(billDetail as Bill & { payments?: Payment[] }).payments!.map((payment) => (
                    <div key={payment.id} className="flex justify-between px-3 py-2 text-sm">
                      <span>
                        {formatPaymentRecord(
                          payment.amount,
                          PAYMENT_METHOD_LABELS[payment.payment_method],
                          payment.payment_date
                        )}
                      </span>
                      {payment.reference && <span className="text-muted-foreground">{payment.reference}</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex gap-2 pt-4">
            {billDetail.status !== 'paid' && canEditBill && (
              <Button onClick={onPayment} data-testid={BILLS.PAY_BUTTON} icon={<DollarSign className="mr-2 h-4 w-4" />}>
                {tenantMessages.bills.columns.recordPayment}
              </Button>
            )}
            <Button
              variant="outlined"
              onClick={onShare}
              disabled={sharingBillId === billDetail.id}
              data-testid={BILLS.SHARE_BUTTON}
              icon={<Share2 className="mr-2 h-4 w-4" />}
            >
              {sharingBillId === billDetail.id ? tenantMessages.bills.dialogs.shareGenerating : tenantMessages.bills.dialogs.share}
            </Button>
            <Button variant="outlined" onClick={() => onExportPdf(billDetail.id)} icon={<Download className="mr-2 h-4 w-4" />}>
              {tenantMessages.bills.columns.exportPdf}
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

export function BillGenerateDialog({
  open,
  onOpenChange,
  form,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<GenerateBillsFormData>;
  onSubmit: (data: GenerateBillsFormData) => void;
  isPending: boolean;
}) {
  return (
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      title={tenantMessages.bills.dialogs.generateTitle}
      footer={null}
    >
      <p className="text-sm text-muted-foreground mb-4">{tenantMessages.bills.dialogs.generateDescription}</p>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <span className="text-sm font-medium">{tenantMessages.bills.dialogs.billYear}</span>
            <Input
              type="number"
              min={2020}
              max={2100}
              {...form.register('bill_year', { valueAsNumber: true })}
            />
            {form.formState.errors.bill_year && (
              <p className="text-sm text-destructive">{form.formState.errors.bill_year.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <span className="text-sm font-medium">{tenantMessages.bills.dialogs.billMonthLabel}</span>
            <Select
              value={String(form.watch('bill_month'))}
              onChange={(value) => form.setValue('bill_month', Number(value))}
              className="w-full"
              options={Array.from({ length: 12 }, (_, index) => ({ value: String(index + 1), label: `${index + 1} 月` }))}
            />
          </div>
        </div>
        <div className="space-y-2">
          <span className="text-sm font-medium">{tenantMessages.bills.dialogs.dueDateLabel}</span>
          <DatePicker
            className="w-full"
            onChange={(_, dateString) => form.setValue('due_date', dateString as string)}
          />
          {form.formState.errors.due_date && (
            <p className="text-sm text-destructive">{form.formState.errors.due_date.message}</p>
          )}
        </div>
        <div className="flex gap-2 pt-4">
          <Button type="default" onClick={() => onOpenChange(false)}>
            {tenantMessages.common.cancel}
          </Button>
          <Button type="primary" htmlType="submit" loading={isPending}>
            {isPending ? tenantMessages.bills.dialogs.generating : tenantMessages.bills.dialogs.generate}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function BillPaymentDialog({
  open,
  onOpenChange,
  selectedBill,
  form,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedBill: Bill | null;
  form: UseFormReturn<PaymentFormData>;
  onSubmit: (data: PaymentFormData) => void;
  isPending: boolean;
}) {
  const paymentSummary = getBillPaymentSummary(selectedBill);

  return (
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      title={tenantMessages.bills.dialogs.paymentTitle}
      footer={null}
    >
      <p className="text-sm text-muted-foreground mb-4">
        {tenantI18n.t('bills.dialogs.paymentSummary', {
          total: paymentSummary.totalAmount.toLocaleString(),
          paid: paymentSummary.paidAmount.toLocaleString(),
          pending: paymentSummary.pendingAmount.toLocaleString(),
        })}
      </p>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <span className="text-sm font-medium">
            {tenantMessages.bills.dialogs.amount} <span aria-hidden="true">*</span>
          </span>
          <Input
            aria-required
            type="number"
            step="0.01"
            {...form.register('amount', { valueAsNumber: true })}
            data-testid={BILLS.AMOUNT_INPUT}
          />
          {form.formState.errors.amount && (
            <p className="text-sm text-destructive">{form.formState.errors.amount.message}</p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <span className="text-sm font-medium">
              {tenantMessages.bills.dialogs.paymentDate} <span aria-hidden="true">*</span>
            </span>
            <DatePicker
              className="w-full"
              onChange={(_, dateString) => form.setValue('payment_date', dateString as string)}
              data-testid={BILLS.PAYMENT_DATE_INPUT}
            />
          </div>
          <div className="space-y-2">
            <span className="text-sm font-medium">
              {tenantMessages.bills.dialogs.paymentMethod} <span aria-hidden="true">*</span>
            </span>
            <Select
              value={form.watch('payment_method')}
              onChange={(value: PaymentMethod) => form.setValue('payment_method', value)}
              className="w-full"
              data-testid={BILLS.PAYMENT_METHOD_SELECT}
              options={Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => ({ value: key, label }))}
            />
          </div>
        </div>
        <div className="space-y-2">
          <span className="text-sm font-medium">{tenantMessages.bills.dialogs.reference}</span>
          <Input placeholder="请输入交易号或参考号" {...form.register('reference')} />
        </div>
        <div className="space-y-2">
          <span className="text-sm font-medium">{tenantMessages.bills.dialogs.notesLabel}</span>
          <Input placeholder="请输入备注" {...form.register('notes')} />
        </div>
        <div className="flex gap-2 pt-4">
          <Button type="default" onClick={() => onOpenChange(false)}>
            {tenantMessages.common.cancel}
          </Button>
          <Button type="primary" htmlType="submit" loading={isPending} data-testid={BILLS.CONFIRM_PAYMENT_BUTTON}>
            {isPending ? tenantMessages.bills.dialogs.processing : tenantMessages.bills.dialogs.confirmPayment}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
