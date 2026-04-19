import { useEffect, useState } from 'react';
import { useBillingUsagePricing } from '@/hooks/billing';

export default function BillingUsagePricingPage() {
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
    return <div className="text-center py-8 text-muted-foreground">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">用量单价配置</h1>
        <p className="text-sm text-gray-500 mt-1">配置按量付费的单价</p>
      </div>
      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-card rounded-lg border border-border p-6 space-y-4">
            <h3 className="font-medium text-lg">用量单价配置</h3>
            <p className="text-sm text-muted-foreground">
              设置按量付费的单价，单位：元/个/年
            </p>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">组织单价</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-32 border border-input rounded px-3 py-2 text-right bg-background"
                    value={formData.price_per_org}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        price_per_org: parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                  <span className="text-sm text-muted-foreground">元/个/年</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">公寓单价</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-32 border border-input rounded px-3 py-2 text-right bg-background"
                    value={formData.price_per_apartment}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        price_per_apartment: parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                  <span className="text-sm text-muted-foreground">元/个/年</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">房间单价</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-32 border border-input rounded px-3 py-2 text-right bg-background"
                    value={formData.price_per_room}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        price_per_room: parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                  <span className="text-sm text-muted-foreground">元/个/年</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">成员单价</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-32 border border-input rounded px-3 py-2 text-right bg-background"
                    value={formData.price_per_member}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        price_per_member: parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                  <span className="text-sm text-muted-foreground">元/个/年</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? '保存中...' : '保存配置'}
            </button>
            {saved && (
              <span className="text-sm text-success">保存成功</span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
