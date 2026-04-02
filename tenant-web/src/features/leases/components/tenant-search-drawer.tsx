'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, User } from 'lucide-react';
import { DetailDrawer } from '@apartment-ultra/shared-ui/components/ui';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { tenantsApi } from '@/lib/api';
import { cn } from '@/lib/utils';
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
    queryFn: () => tenantsApi.list(orgId, search || undefined),
    enabled: !!orgId,
  });

  const handleSelect = (tenant: Tenant) => {
    onSelect(tenant);
    onOpenChange(false);
    setSearch('');
  };

  const footer = (
    <div className="flex justify-end">
      <Button variant="outline" onClick={() => onOpenChange(false)}>
        取消
      </Button>
    </div>
  );

  return (
    <DetailDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="选择已有租客"
      description="搜索并选择已有租客，信息将自动回填到表单"
      footer={footer}
      size="sm"
    >
      <div className="space-y-4">
        {/* 搜索框 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索姓名或电话..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* 租客列表 */}
        <div className="max-h-[calc(100vh-200px)] space-y-2 overflow-y-auto">
          {isLoading ? (
            <p className="py-4 text-center text-sm text-muted-foreground">加载中...</p>
          ) : tenants?.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">未找到租客</p>
          ) : (
            tenants?.map((tenant) => (
              <button
                key={tenant.id}
                onClick={() => handleSelect(tenant)}
                className={cn(
                  'w-full rounded-lg border p-3 text-left transition-colors hover:bg-muted/50',
                  'focus:outline-none focus:ring-2 focus:ring-ring'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-muted">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{tenant.name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {tenant.phone || '无电话'} {tenant.id_card ? `· ${tenant.id_card}` : ''}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </DetailDrawer>
  );
}
