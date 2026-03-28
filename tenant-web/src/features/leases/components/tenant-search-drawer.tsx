'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, User } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@apartment-ultra/shared-ui/components/ui';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Input } from '@apartment-ultra/shared-ui/components/ui';
import { tenantsApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Tenant } from '@apartment-ultra/api-contract';

interface TenantSearchDrawerProps {
  orgId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (tenant: Tenant) => void;
}

export function TenantSearchDrawer({
  orgId,
  open,
  onOpenChange,
  onSelect,
}: TenantSearchDrawerProps) {
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:max-w-[400px]">
        <SheetHeader>
          <SheetTitle>选择已有租客</SheetTitle>
          <SheetDescription>搜索并选择已有租客，信息将自动回填到表单</SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索姓名或电话..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* 租客列表 */}
          <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
            {isLoading ? (
              <p className="text-sm text-muted-foreground text-center py-4">加载中...</p>
            ) : tenants?.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">未找到租客</p>
            ) : (
              tenants?.map((tenant) => (
                <button
                  key={tenant.id}
                  onClick={() => handleSelect(tenant)}
                  className={cn(
                    'w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-ring'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{tenant.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {tenant.phone || '无电话'} {tenant.id_card ? `· ${tenant.id_card}` : ''}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <SheetFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
