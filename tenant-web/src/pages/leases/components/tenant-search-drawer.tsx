
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, User } from 'lucide-react';
import { Button, Input, Drawer } from 'antd';
import { tenantsApi } from '@/api/tenants';
import { cn } from '@apartment-ultra/web-shared';
import type { Tenant } from '@apartment-ultra/api-contract';

interface TenantSearchDrawerProps {
  orgId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (tenant: Tenant) => void;
}

export function TenantSearchDrawer({ orgId, open, onOpenChange, onSelect }: TenantSearchDrawerProps) {
  const [search, setSearch] = useState('');

  const { data: tenants, isLoading } = useQuery({
    queryKey: ['tenants', orgId, search],
    queryFn: () => tenantsApi.list(search || undefined),
    enabled: !!orgId,
  });

  const handleSelect = (tenant: Tenant) => {
    onSelect(tenant);
    onOpenChange(false);
    setSearch('');
  };

  return (
    <Drawer
      open={open}
      onClose={() => onOpenChange(false)}
      title="选择已有租客"
      width={400}
      footer={
        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>取消</Button>
        </div>
      }
    >
      <p className="mb-4 text-sm text-gray-600">搜索并选择已有租客，信息将自动回填到表单</p>

      {/* 搜索框 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="搜索姓名或电话..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* 租客列表 */}
      <div className="max-h-[calc(100vh-200px)] space-y-2 overflow-y-auto mt-4">
        {isLoading ? (
          <p className="py-4 text-center text-sm text-gray-500">加载中...</p>
        ) : tenants?.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-500">未找到租客</p>
        ) : (
          tenants?.map((tenant) => (
            <button
              key={tenant.id}
              onClick={() => handleSelect(tenant)}
              className={cn(
                'w-full rounded-lg border p-3 text-left transition-colors hover:bg-gray-50',
                'focus:outline-none focus:ring-2 focus:ring-blue-500'
              )}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-100">
                  <User className="h-5 w-5 text-gray-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{tenant.name}</p>
                  <p className="truncate text-sm text-gray-500">
                    {tenant.phone || '无电话'} {tenant.id_card ? `· ${tenant.id_card}` : ''}
                  </p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </Drawer>
  );
}
