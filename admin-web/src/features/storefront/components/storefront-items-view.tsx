'use client';

import { Plus } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/common/data-table';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import type { StorefrontConfig, StorefrontItem } from '@/lib/api/admin-client';

export function StorefrontItemsView({
  storefront,
  items,
  columns,
  onBack,
  onAddItem,
}: {
  storefront: StorefrontConfig;
  items: StorefrontItem[];
  columns: ColumnDef<StorefrontItem>[];
  onBack: () => void;
  onAddItem: () => void;
}) {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" onClick={onBack} className="mb-2">
            ← 返回商店列表
          </Button>
          <h2 className="text-xl font-semibold">{storefront.name} - 商品管理</h2>
        </div>
        <Button onClick={onAddItem}>
          <Plus className="mr-2 h-4 w-4" />
          添加服务
        </Button>
      </div>

      <DataTable columns={columns} data={items} testid="storefront-items-list" useCard={false} />
    </div>
  );
}

