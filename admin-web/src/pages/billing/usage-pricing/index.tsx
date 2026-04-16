import { UsagePricingPageContent } from '@/components/billing/usage-pricing-page-content';

export default function BillingUsagePricingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">用量单价配置</h1>
        <p className="text-sm text-gray-500 mt-1">配置按量付费的单价</p>
      </div>
      <UsagePricingPageContent />
    </div>
  );
}
