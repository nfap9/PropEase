'use client';

import { Plus } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/common/data-table';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import type { ServiceProduct } from '@/lib/api/admin-client';
import { adminMessages } from '@/lib/i18n';

export function ServicePricingView({
  services,
  columns,
  onCreate,
}: {
  services: ServiceProduct[];
  columns: ColumnDef<ServiceProduct>[];
  onCreate: () => void;
}) {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold" data-testid="service-pricing-heading">
          {adminMessages.servicePricing.heading}
        </h2>
        <Button onClick={onCreate} data-testid="service-pricing-create-btn">
          <Plus className="mr-2 h-4 w-4" />
          新建服务
        </Button>
      </div>

      <DataTable columns={columns} data={services} testid="service-pricing-list" />
    </div>
  );
}
