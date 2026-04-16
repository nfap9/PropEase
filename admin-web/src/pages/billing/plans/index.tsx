import { PlansPageContent } from '@/components/billing/plans-page-content';

export default function BillingPlansPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">服务方案</h1>
        <p className="text-sm text-gray-500 mt-1">配置订阅服务套餐及价格</p>
      </div>
      <PlansPageContent />
    </div>
  );
}
