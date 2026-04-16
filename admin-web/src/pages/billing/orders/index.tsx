import { OrdersPageContent } from '@/components/billing/orders-page-content';

export default function BillingOrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">订单管理</h1>
        <p className="text-sm text-gray-500 mt-1">查看和管理所有订单</p>
      </div>
      <OrdersPageContent />
    </div>
  );
}
