
import type { ColumnDef } from '@tanstack/react-table';
import { AlertCircle, Building2, ChevronDown, Download, FilePlus, FileSpreadsheet } from 'lucide-react';
import { DataTable } from '@apartment-ultra/shared-ui/components/ui';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Label } from '@apartment-ultra/shared-ui/components';
import { Card, CardContent } from '@apartment-ultra/shared-ui/components/ui';
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
import { BILLS } from '@/schemas/bills';
import type { BillStats } from '@/utils/bills';
import { tenantMessages } from '@/i18n';

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
  /** 是否有生成账单权限 */
  canGenerateBill?: boolean;
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
  canGenerateBill = true,
}: BillsListViewProps) {
  const pendingBillCount = stats.pending + stats.partial + stats.overdue;

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
    <div className="w-full space-y-4">
      <div className="space-y-4">
        <Card>
          <CardContent className="p-5 sm:p-6">
            <div className="grid grid-cols-4 gap-4">
              <div className="min-w-0">
                <div className="text-sm text-muted-foreground">{tenantMessages.bills.list.total}</div>
                <div className="mt-2 text-2xl font-semibold tracking-tight">{stats.total}</div>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{tenantMessages.bills.list.pendingAmount}</span>
                  <span>{pendingBillCount} 笔</span>
                </div>
                <div className="mt-2 text-2xl font-semibold tracking-tight text-amber-600">
                  ¥{(stats.totalAmount - stats.paidAmount).toLocaleString('zh-CN')}
                </div>
              </div>
              <div className="min-w-0">
                <div className="text-sm text-muted-foreground">{tenantMessages.bills.list.paidAmount}</div>
                <div className="mt-2 text-2xl font-semibold tracking-tight text-green-600">
                  ¥{stats.paidAmount.toLocaleString('zh-CN')}
                </div>
              </div>
              <div className="min-w-0">
                <div className="text-sm text-muted-foreground">{tenantMessages.bills.list.overdueCount}</div>
                <div className="mt-2 text-2xl font-semibold tracking-tight text-destructive">{stats.overdue}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {billsLoading ? (
          <Skeleton className="h-96" />
        ) : (
          <DataTable
            columns={columns}
            data={bills}
            testid={BILLS.LIST}
            useCard={false}
            toolbar={
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {canGenerateBill && (
                    <Button onClick={onGenerate} data-testid={BILLS.GENERATE_BUTTON}>
                      <FilePlus className="mr-2 h-4 w-4" />
                      {tenantMessages.bills.list.generate}
                    </Button>
                  )}
                  <div>
                    <Label className="mb-2 block">状态</Label>
                    <Select
                      value={statusFilter}
                      onValueChange={(value) => onStatusFilterChange(value as BillStatus | 'all')}
                    >
                      <SelectTrigger className="w-full" data-testid={BILLS.STATUS_FILTER}>
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
              </div>
            }
          />
        )}
      </div>
    </div>
  );
}
