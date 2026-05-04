/**
 * BillDetailDialog - 账单详情弹窗
 *
 * 自包含的弹窗组件，内部管理：
 * - useBillDetail：根据 billId 和 open 状态获取详情数据
 * - useBillExport.exportPdf：导出 PDF
 *
 * billId 和 open 状态由父组件（index.tsx）通过 useBillDetailDialog 管理，
 * 因为需要从列表行触发打开，并将选中的 bill 对象传递给收款操作。
 */
import { Download, Share2 } from 'lucide-react';
import { Tag, Button, Modal, Skeleton } from 'antd';
import type { Bill, BillFeeItem, Payment } from '@/types';
import { BILLS } from '@/constants/bills';
import { BILL_STATUS_CONFIG } from '@/constants/status';
import { formatBillPeriod, formatPaymentRecord, getBillDetailDescription } from '@/utils/bills';
import { tenantMessages } from '@/i18n';
import { formatDate } from '@/utils/date';
import { PAYMENT_METHOD_LABELS } from '@/constants/bills';
import { useBillDetail } from '../hooks/use-bill-detail';
import { useBillExport } from '../hooks/use-bill-export';

interface BillDetailDialogProps {
  billId: string | null;
  open: boolean;
  sharingBillId: string | null;
  onOpenChange: (open: boolean) => void;
  onShare: (bill: Bill, feeItems: BillFeeItem[]) => void;
  canEditBill?: boolean;
}

export function BillDetailDialog({
  billId,
  open,
  sharingBillId,
  onOpenChange,
  onShare,
  canEditBill = true,
}: BillDetailDialogProps) {
  // billId 和 open 作为参数传入，由父组件控制
  const {
    billDetail,
    billFeeItems,
    isLoadingBillDetail,
    isLoadingFeeItems,
  } = useBillDetail(billId, open);

  const { exportPdf } = useBillExport();

  // payments 嵌套在 billDetail 中，需要类型断言提取
  const payments: Payment[] = (billDetail as (Bill & { payments?: Payment[] }) | null | undefined)?.payments ?? [];

  return (
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      title={tenantMessages.bills.dialogs.detailTitle}
      footer={null}
      width={600}
    >
      {isLoadingBillDetail ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : billDetail ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {getBillDetailDescription(billDetail, billId ?? null)}
          </p>

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

            {isLoadingFeeItems ? (
              <Skeleton active paragraph={{ rows: 1 }} />
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

          {payments.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-medium">{tenantMessages.bills.dialogs.paymentRecords}</h4>
              <div className="rounded-md border">
                <div className="divide-y">
                  {payments.map((payment) => (
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
          )}

          <div className="flex gap-2 pt-4">
            <Button
              variant="outlined"
              onClick={() => onShare(billDetail, billFeeItems ?? [])}
              disabled={sharingBillId === billDetail.id}
              data-testid={BILLS.SHARE_BUTTON}
              icon={<Share2 className="mr-2 h-4 w-4" />}
            >
              {sharingBillId === billDetail.id
                ? tenantMessages.bills.dialogs.shareGenerating
                : tenantMessages.bills.dialogs.share}
            </Button>
            <Button onClick={() => exportPdf(billDetail.id)} icon={<Download className="mr-2 h-4 w-4" />}>
              {tenantMessages.bills.columns.exportPdf}
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
