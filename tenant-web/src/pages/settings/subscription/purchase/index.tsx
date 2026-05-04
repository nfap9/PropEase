/**
 * SubscriptionPurchasePage - 订阅购买入口
 *
 * 职责：组合视图组件。
 */
import { PermissionPageGuard } from '@/components/layout/permission-page-guard';
import { PurchaseView } from './list';

export default function SubscriptionPurchasePage() {
  return (
    <PermissionPageGuard>
      <PurchaseView />
    </PermissionPageGuard>
  );
}
