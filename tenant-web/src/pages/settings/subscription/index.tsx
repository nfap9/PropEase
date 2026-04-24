/**
 * SubscriptionPage - 订阅管理入口
 *
 * 职责：组合视图组件。
 */
import { PermissionPageGuard } from '@/components/layout/permission-page-guard';
import { SubscriptionView } from './views/subscription-view';

export default function SubscriptionPage() {
  return (
    <PermissionPageGuard>
      <SubscriptionView />
    </PermissionPageGuard>
  );
}
