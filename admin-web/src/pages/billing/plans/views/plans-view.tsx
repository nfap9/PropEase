/**
 * PlansView - 服务方案管理视图
 */
import { useState } from 'react';
import { Tag } from 'antd';
import { usePlans, useCreatePlan, useUpdatePlan, useDeletePlan, useUpdatePlanPricing } from '@/hooks/billing';
import type { AdminPlan, AdminPlanPricingCreate } from '@/api/admin-client';
import type { PlanPricing } from '@propease/api-contract';

export function PlansView() {
  const { plans, loading } = usePlans();
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();
  const deletePlan = useDeletePlan();
  const updatePricing = useUpdatePlanPricing();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<AdminPlan | null>(null);
  const [editingPricing, setEditingPricing] = useState<AdminPlan | null>(null);

  return (
    <div className="space-y-page">
      <div>
        <h1 className="text-2xl font-semibold">服务方案</h1>
        <p className="text-sm text-gray-500 mt-1">配置订阅服务套餐及价格</p>
      </div>
      <div className="flex justify-between items-center">
        <div />
        <button
          onClick={() => setShowCreateDialog(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          新建服务
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">加载中...</div>
      ) : plans.length === 0 ? (
        <div className="text-center py-8 text-gray-500">暂无服务方案</div>
      ) : (
        <div className="grid gap-card-gap">
          {plans.map((plan: AdminPlan) => (
            <div key={plan.id} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{plan.name}</h3>
                    <Tag color={plan.is_active ? 'success' : 'default'}>
                      {plan.is_active ? '启用' : '停用'}
                    </Tag>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{plan.description || '无描述'}</p>
                  <div className="flex gap-4 mt-2 text-xs text-gray-500">
                    <span>代码: {plan.code}</span>
                    <span>排序: {plan.sort_order}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingPricing(plan)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    价格设置
                  </button>
                  <button
                    onClick={() => setEditingPlan(plan)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`确定删除「${plan.name}」吗？`)) {
                        deletePlan.mutate(plan.id);
                      }
                    }}
                    className="px-3 py-1 text-sm border border-red-200 text-red-500 rounded hover:bg-red-50"
                  >
                    删除
                  </button>
                </div>
              </div>
              {plan.pricing && plan.pricing.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-gray-500 mb-2">定价:</p>
                  <div className="flex flex-wrap gap-2">
                    {plan.pricing?.map((p: PlanPricing) => (
                      <span key={p.id} className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {p.months}个月 ¥{p.price}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                <span>公寓: {plan.max_apartments === -1 ? '不限' : plan.max_apartments}</span>
                <span className="mx-2">|</span>
                <span>房间: {plan.max_rooms === -1 ? '不限' : plan.max_rooms}</span>
                <span className="mx-2">|</span>
                <span>成员: {plan.max_members === -1 ? '不限' : plan.max_members}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateDialog && (
        <PlanDialog
          onClose={() => setShowCreateDialog(false)}
          onSubmit={(data) => {
            createPlan.mutate(data);
            setShowCreateDialog(false);
          }}
          isPending={createPlan.isPending}
        />
      )}

      {editingPlan && (
        <PlanDialog
          plan={editingPlan}
          onClose={() => setEditingPlan(null)}
          onSubmit={(data) => {
            updatePlan.mutate({ id: editingPlan.id, data });
            setEditingPlan(null);
          }}
          isPending={updatePlan.isPending}
        />
      )}

      {editingPricing && (
        <PricingDialog
          plan={editingPricing}
          onClose={() => setEditingPricing(null)}
          onSubmit={(pricing) => {
            updatePricing.mutate({ planId: editingPricing.id, pricing });
            setEditingPricing(null);
          }}
          isPending={updatePricing.isPending}
        />
      )}
    </div>
  );
}

interface PlanDialogProps {
  plan?: AdminPlan;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    code: string;
    description?: string;
    max_apartments: number;
    max_rooms: number;
    max_members: number;
    is_active: boolean;
    sort_order: number;
  }) => void;
  isPending: boolean;
}

function PlanDialog({ plan, onClose, onSubmit, isPending }: PlanDialogProps) {
  const [formData, setFormData] = useState({
    name: plan?.name || '',
    code: plan?.code || '',
    description: plan?.description || '',
    max_apartments: plan?.max_apartments ?? 0,
    max_rooms: plan?.max_rooms ?? 0,
    max_members: plan?.max_members ?? 0,
    is_active: plan?.is_active ?? true,
    sort_order: plan?.sort_order ?? 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md border border-gray-200 shadow-lg">
        <h2 className="text-lg font-semibold mb-4">{plan ? '编辑服务' : '新建服务'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">服务名称</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 bg-white"
              placeholder="如：基础版"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">服务代码</label>
            <input
              type="text"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 bg-white"
              placeholder="如：basic"
              disabled={!!plan}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">描述</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 bg-white"
              rows={2}
            />
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">最大公寓数</label>
              <input
                type="number"
                min="0"
                value={formData.max_apartments}
                onChange={(e) => setFormData({ ...formData, max_apartments: e.target.valueAsNumber || 0 })}
                className="w-full border border-gray-300 rounded px-3 py-2 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">最大房间数</label>
              <input
                type="number"
                min="0"
                value={formData.max_rooms}
                onChange={(e) => setFormData({ ...formData, max_rooms: e.target.valueAsNumber || 0 })}
                className="w-full border border-gray-300 rounded px-3 py-2 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">最大成员数</label>
              <input
                type="number"
                min="0"
                value={formData.max_members}
                onChange={(e) => setFormData({ ...formData, max_members: e.target.valueAsNumber || 0 })}
                className="w-full border border-gray-300 rounded px-3 py-2 bg-white"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            />
            <label htmlFor="is_active" className="text-sm">启用</label>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
              取消
            </button>
            <button type="submit" disabled={isPending} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
              {isPending ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface PricingDialogProps {
  plan: AdminPlan;
  onClose: () => void;
  onSubmit: (pricing: AdminPlanPricingCreate[]) => void;
  isPending: boolean;
}

function PricingDialog({ plan, onClose, onSubmit, isPending }: PricingDialogProps) {
  const [pricingList, setPricingList] = useState<{ months: number; price: number }[]>(
    plan.pricing?.map((p) => ({ months: p.months, price: p.price })) || [
      { months: 1, price: 0 },
      { months: 12, price: 0 },
    ]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(pricingList.map((p, i) => ({ ...p, is_active: true, sort_order: i })));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md border border-gray-200 shadow-lg">
        <h2 className="text-lg font-semibold mb-4">价格设置 - {plan.name}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {pricingList.map((p, i) => (
            <div key={i} className="flex gap-4 items-center">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">月数</label>
                <input
                  type="number"
                  min="1"
                  value={p.months}
                  onChange={(e) => {
                    const list = [...pricingList];
                    list[i].months = parseInt(e.target.value) || 1;
                    setPricingList(list);
                  }}
                  className="w-full border border-gray-300 rounded px-3 py-2 bg-white"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">价格(元)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={p.price}
                  onChange={(e) => {
                    const list = [...pricingList];
                    list[i].price = parseFloat(e.target.value) || 0;
                    setPricingList(list);
                  }}
                  className="w-full border border-gray-300 rounded px-3 py-2 bg-white"
                />
              </div>
              <button
                type="button"
                onClick={() => setPricingList(pricingList.filter((_, idx) => idx !== i))}
                className="mt-6 text-red-500 hover:text-red-600"
              >
                删除
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setPricingList([...pricingList, { months: 1, price: 0 }])}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            + 添加定价
          </button>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
              取消
            </button>
            <button type="submit" disabled={isPending} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
              {isPending ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
