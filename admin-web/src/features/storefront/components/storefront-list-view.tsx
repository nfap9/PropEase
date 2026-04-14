'use client';

import { Plus } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/common/data-table';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import type { StorefrontConfig } from '@/lib/api/admin-client';
import { adminMessages } from '@/lib/i18n';

export function StorefrontListView({
  storefronts,
  columns,
  onCreate,
}: {
  storefronts: StorefrontConfig[];
  columns: ColumnDef<StorefrontConfig>[];
  onCreate: () => void;
}) {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4 flex items-center justify-end">
        <Button onClick={onCreate} data-testid="storefront-create-btn">
          <Plus className="mr-2 h-4 w-4" />
          {adminMessages.storefront.createButton}
        </Button>
      </div>

      <DataTable columns={columns} data={storefronts} testid="storefront-list" />
    </div>
  );
}
