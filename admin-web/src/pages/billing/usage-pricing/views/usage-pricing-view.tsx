import { useEffect, useState } from 'react';
import { useBillingUsagePricing } from '@/hooks/billing';

export function UsagePricingView() {
  const { pricing, loading, updateMutation } = useBillingUsagePricing();
  const [formData, setFormData] = useState({
    price_per_org: 0,
    price_per_apartment: 0,
    price_per_room: 0,
    price_per_member: 0,
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (pricing) {
      setFormData({
        price_per_org: pricing.price_per_org ?? 0,
        price_per_apartment: pricing.price_per_apartment ?? 0,
        price_per_room: pricing.price_per_room ?? 0,
        price_per_member: pricing.price_per_member ?? 0,
      });
    }
  }, [pricing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateMutation.mutateAsync(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) {
    return (
      <div className="space-y-page">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-64 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-page">
      <div>
        <h1 className="text-2xl font-semibold">用量计费定价</h1>
        <p className="text-sm text-gray-500 mt-1">配置按量付费的单价</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">团队单价（元/团队/月）</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.price_per_org}
              onChange={(e) => setFormData({ ...formData, price_per_org: parseFloat(e.target.value) || 0 })}
              className="w-full border border-gray-300 rounded px-3 py-2 bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">公寓单价（元/公寓/月）</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.price_per_apartment}
              onChange={(e) => setFormData({ ...formData, price_per_apartment: parseFloat(e.target.value) || 0 })}
              className="w-full border border-gray-300 rounded px-3 py-2 bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">房间单价（元/房间/月）</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.price_per_room}
              onChange={(e) => setFormData({ ...formData, price_per_room: parseFloat(e.target.value) || 0 })}
              className="w-full border border-gray-300 rounded px-3 py-2 bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">成员单价（元/成员/月）</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.price_per_member}
              onChange={(e) => setFormData({ ...formData, price_per_member: parseFloat(e.target.value) || 0 })}
              className="w-full border border-gray-300 rounded px-3 py-2 bg-white"
            />
          </div>
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {updateMutation.isPending ? '保存中...' : '保存'}
            </button>
            {saved && <span className="text-green-600 text-sm">保存成功</span>}
          </div>
        </form>
      </div>
    </div>
  );
}
