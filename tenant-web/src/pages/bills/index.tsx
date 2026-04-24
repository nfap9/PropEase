/**
 * BillsPage - 账单页面入口
 *
 * 职责：组合各组件，处理跨组件协调。
 * - 详情弹窗状态：跨 BillsListView 和 BillDetailDialog 共享
 * - 分享状态：sharingBillId 在 BillsListView 和 BillDetailDialog 中都要读取
 * - 收款弹窗：下沉到 BillsListView 内部（列表操作列触发，收款从详情弹窗触发需回到列表）
 * - 权限检查在入口处进行
 */
import { Suspense, useCallback, useState } from 'react';
import { Skeleton } from 'antd';
import { PermissionPageGuard } from '@/components/layout/permission-page-guard';
import { useAuth } from '@/contexts/auth';
import { usePermissions, PERMISSIONS } from '@/hooks/use-permissions';
import { BillsListView } from './views/bills-list-view';
import { BillDetailDialog } from './views/bill-detail-dialog';
import { useBillShare } from './hooks/use-bill-share';
import type { Bill } from '@/types';

function BillsFallback() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-96" />
    </div>
  );
}

export default function BillsPage() {
  const { organization, isLoading: authLoading } = useAuth();
  const { hasPermission } = usePermissions();
  const orgId = organization?.id;

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  const closeDetailDialog = useCallback(() => {
    setIsDetailOpen(false);
    setSelectedBill(null);
  }, []);

  const openDetailDialog = useCallback((bill: Bill) => {
    setSelectedBill(bill);
    setIsDetailOpen(true);
  }, []);

  // 分享状态：跨列表和详情弹窗共享
  const { sharingBillId, handleShareBill } = useBillShare(organization?.name);

  const canGenerateBill = hasPermission(PERMISSIONS.BILL_CREATE);
  const canEditBill = hasPermission(PERMISSIONS.BILL_EDIT);

  const handleViewDetail = useCallback(
    (bill: Bill) => {
      openDetailDialog(bill);
    },
    [openDetailDialog],
  );

  if (authLoading) {
    return <BillsFallback />;
  }

  return (
    <PermissionPageGuard>
      {/* BillsListView 内部包含 BillPaymentDialog */}
      <BillsListView
        orgId={orgId}
        canGenerateBill={canGenerateBill}
        onViewDetail={handleViewDetail}
      />

      <Suspense fallback={null}>
        <BillDetailDialog
          billId={selectedBill?.id ?? null}
          open={isDetailOpen}
          sharingBillId={sharingBillId}
          onOpenChange={(open) => !open && closeDetailDialog()}
          onShare={handleShareBill}
          canEditBill={canEditBill}
        />
      </Suspense>
    </PermissionPageGuard>
  );
}
