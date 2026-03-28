'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { AlertCircle, Building2, ChevronDown, Download, FilePlus, FileSpreadsheet } from 'lucide-react';
import { DataTable } from '@/components/common/data-table';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { KpiSection } from '@apartment-ultra/shared-ui/components/ui';
import { ListPageLayout } from '@apartment-ultra/shared-ui/components/ui';
import { PageToolbar } from '@apartment-ultra/shared-ui/components/ui';
import { StatCard } from '@apartment-ultra/shared-ui/components/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@apartment-ultra/shared-ui/components/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@apartment-ultra/shared-ui/components/ui';
import { Skeleton } from '@apartment-ultra/shared-ui/components/ui';
import type { Bill, BillStatus } from '@/types';
import { BILLS } from '../bills.schemas';
import type { BillStats } from '../bills.utils';
import { tenantMessages } from '@/lib/i18n';

interface BillsListViewProps {
  orgId?: string;
  billsLoading: boolean;
  bills: Bill[];
  columns: ColumnDef<Bill>[];
  stats: BillStats;
  statusFilter: BillStatus | 'all';
  onStatusFilterChange: (value: BillStatus | 'all') => void;
  onGenerate: () => void;
  onExport: (type: 'all' | 'unfinished') => void;
}

export function BillsListView({
  orgId,
  billsLoading,
  bills,
  columns,
  stats,
  statusFilter,
  onStatusFilterChange,
  onGenerate,
  onExport,
}: BillsListViewProps) {
  if (!orgId) {
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-4">
        <Building2 className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">{tenantMessages.bills.list.noTeamTitle}</h2>
        <p className="text-muted-foreground">{tenantMessages.bills.list.noTeamDescription}</p>
      </div>
    );
  }

  return (
    <ListPageLayout
      title={tenantMessages.bills.list.heading}
      titleTestId={BILLS.HEADING}
      maxWidth="full"
      className="w-full"
      toolbar={
        <PageToolbar className="justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button onClick={onGenerate} data-testid={BILLS.GENERATE_BUTTON}>
              <FilePlus className="mr-2 h-4 w-4" />
              {tenantMessages.bills.list.generate}
            </Button>
            <Select value={statusFilter} onValueChange={(value) => onStatusFilterChange(value as BillStatus | 'all')}>
              <SelectTrigger className="w-[150px]" data-testid={BILLS.STATUS_FILTER}>
                <SelectValue placeholder={tenantMessages.bills.list.statusPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tenantMessages.bills.list.all}</SelectItem>
                <SelectItem value="pending">{tenantMessages.bills.list.pending}</SelectItem>
                <SelectItem value="partial">{tenantMessages.bills.list.partial}</SelectItem>
                <SelectItem value="paid">{tenantMessages.bills.list.paid}</SelectItem>
                <SelectItem value="overdue">{tenantMessages.bills.list.overdue}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={bills.length === 0} data-testid={BILLS.EXPORT_BUTTON}>
                <Download className="mr-2 h-4 w-4" />
                {tenantMessages.bills.list.export}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onExport('all')}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                {tenantMessages.bills.list.exportAll}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport('unfinished')}>
                <AlertCircle className="mr-2 h-4 w-4" />
                {tenantMessages.bills.list.exportUnfinished}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </PageToolbar>
      }
    >
      <KpiSection columns={4}>
        <StatCard title={tenantMessages.bills.list.total} value={stats.total} />
        <StatCard
          title={tenantMessages.bills.list.pendingAmount}
          value={stats.totalAmount - stats.paidAmount}
          format="currency"
          tone="warning"
          description={`${stats.pending + stats.partial + stats.overdue} 笔`}
        />
        <StatCard
          title={tenantMessages.bills.list.paidAmount}
          value={stats.paidAmount}
          format="currency"
          tone="success"
        />
        <StatCard title={tenantMessages.bills.list.overdueCount} value={stats.overdue} tone="danger" />
      </KpiSection>

      {billsLoading ? <Skeleton className="h-96" /> : <DataTable columns={columns} data={bills} testid={BILLS.LIST} />}
    </ListPageLayout>
  );
}
