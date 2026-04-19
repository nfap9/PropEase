
import type { UseFormReturn } from 'react-hook-form';
import { Download, DollarSign, Share2 } from 'lucide-react';
import { Badge } from '@apartment-ultra/shared-ui/components/ui';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@apartment-ultra/shared-ui/components/ui';
import { Input } from '@apartment-ultra/shared-ui/components/ui';
import { DatePickerInput } from '@apartment-ultra/shared-ui/components/ui';
import { Label } from '@apartment-ultra/shared-ui/components/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@apartment-ultra/shared-ui/components/ui';
import { Skeleton } from '@apartment-ultra/shared-ui/components/ui';
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
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" data-testid={BILLS.DETAIL_DIALOG}>
        <DialogHeader>
          <DialogTitle>{tenantMessages.bills.dialogs.detailTitle}</DialogTitle>
          <DialogDescription>{getBillDetailDescription(billDetail ?? null, selectedBillId)}</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : billDetail ? (
          <div className="space-y-4">
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
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
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
                <Badge variant={BILL_STATUS_CONFIG[billDetail.status].variant}>
                  {BILL_STATUS_CONFIG[billDetail.status].label}
                </Badge>
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

            <DialogFooter className="flex gap-2 sm:gap-0">
              {billDetail.status !== 'paid' && (
                <Button onClick={onPayment} data-testid={BILLS.PAY_BUTTON}>
                  <DollarSign className="mr-2 h-4 w-4" />
                  {tenantMessages.bills.columns.recordPayment}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={onShare}
                disabled={sharingBillId === billDetail.id}
                data-testid={BILLS.SHARE_BUTTON}
              >
                <Share2 className="mr-2 h-4 w-4" />
                {sharingBillId === billDetail.id ? tenantMessages.bills.dialogs.shareGenerating : tenantMessages.bills.dialogs.share}
              </Button>
              <Button variant="outline" onClick={() => onExportPdf(billDetail.id)}>
                <Download className="mr-2 h-4 w-4" />
                {tenantMessages.bills.columns.exportPdf}
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {tenantMessages.bills.dialogs.close}
              </Button>
            </DialogFooter>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid={BILLS.GENERATE_DIALOG}>
        <DialogHeader>
          <DialogTitle>{tenantMessages.bills.dialogs.generateTitle}</DialogTitle>
          <DialogDescription>{tenantMessages.bills.dialogs.generateDescription}</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bill_year">{tenantMessages.bills.dialogs.billYear}</Label>
              <Input
                id="bill_year"
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
              <Label htmlFor="bill_month">{tenantMessages.bills.dialogs.billMonthLabel}</Label>
              <Select
                value={String(form.watch('bill_month'))}
                onValueChange={(value) => form.setValue('bill_month', Number(value))}
              >
                <SelectTrigger id="bill_month">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
                    <SelectItem key={month} value={String(month)}>
                      {month} 月
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
              <Label htmlFor="due_date">{tenantMessages.bills.dialogs.dueDateLabel}</Label>
            <DatePickerInput
              id="due_date"
              value={form.watch('due_date') || ''}
              onChange={(value) => form.setValue('due_date', value)}
            />
            {form.formState.errors.due_date && (
              <p className="text-sm text-destructive">{form.formState.errors.due_date.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid={BILLS.CANCEL_BUTTON}>
              {tenantMessages.common.cancel}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? tenantMessages.bills.dialogs.generating : tenantMessages.bills.dialogs.generate}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid={BILLS.PAYMENT_DIALOG}>
        <DialogHeader>
          <DialogTitle>{tenantMessages.bills.dialogs.paymentTitle}</DialogTitle>
          <DialogDescription>
            {tenantI18n.t('bills.dialogs.paymentSummary', {
              total: paymentSummary.totalAmount.toLocaleString(),
              paid: paymentSummary.paidAmount.toLocaleString(),
              pending: paymentSummary.pendingAmount.toLocaleString(),
            })}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">
              {tenantMessages.bills.dialogs.amount} <span aria-hidden="true">*</span>
            </Label>
            <Input
              id="amount"
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
              <Label htmlFor="payment_date">
                {tenantMessages.bills.dialogs.paymentDate} <span aria-hidden="true">*</span>
              </Label>
              <DatePickerInput
                id="payment_date"
                value={form.watch('payment_date') || ''}
                onChange={(value) => form.setValue('payment_date', value)}
                data-testid={BILLS.PAYMENT_DATE_INPUT}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment_method">
                {tenantMessages.bills.dialogs.paymentMethod} <span aria-hidden="true">*</span>
              </Label>
              <Select
                value={form.watch('payment_method')}
                onValueChange={(value: PaymentMethod) => form.setValue('payment_method', value)}
              >
                <SelectTrigger id="payment_method" className="min-w-[140px]" data-testid={BILLS.PAYMENT_METHOD_SELECT}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reference">{tenantMessages.bills.dialogs.reference}</Label>
            <Input id="reference" placeholder="请输入交易号或参考号" {...form.register('reference')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">{tenantMessages.bills.dialogs.notesLabel}</Label>
            <Input id="notes" placeholder="请输入备注" {...form.register('notes')} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid={BILLS.CANCEL_BUTTON}>
              {tenantMessages.common.cancel}
            </Button>
            <Button type="submit" disabled={isPending} data-testid={BILLS.CONFIRM_PAYMENT_BUTTON}>
              {isPending ? tenantMessages.bills.dialogs.processing : tenantMessages.bills.dialogs.confirmPayment}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
