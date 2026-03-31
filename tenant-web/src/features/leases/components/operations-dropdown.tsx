'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Lease } from '@/types';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@apartment-ultra/shared-ui/components/ui';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { appToast } from '@apartment-ultra/shared-ui/components/ui';
import { MoreHorizontal, Home, RefreshCw, User, TrendingUp, Droplets, DollarSign, Layers, LogOut } from 'lucide-react';
import { leasesApi } from '@/lib/api';
import { ChangeRoomSheet } from './operation-sheets/change-room-sheet';
import { RenewSheet } from './operation-sheets/renew-sheet';
import { ChangeRentSheet } from './operation-sheets/change-rent-sheet';
import { ChangeUtilityRatesSheet } from './operation-sheets/change-utility-rates-sheet';
import { SettleLeaseSheet } from './operation-sheets/settle-lease-sheet';
import { UpdateTenantDialog } from './operation-dialogs/update-tenant-dialog';
import { ChangeDepositDialog } from './operation-dialogs/change-deposit-dialog';
import { FeeItemsEditorDialog } from './fee-items-editor-dialog';

interface FeeItem {
  id: string;
  name: string;
  feeTypeId?: string;
  specification?: string;
  specificationId?: string;
  unitPrice: number;
  quantity: number;
  billingCycle: 'monthly' | 'yearly';
}

interface OperationsDropdownProps {
  orgId: string;
  leaseId: string;
  lease: Lease;
}

export function OperationsDropdown({ orgId, leaseId, lease }: OperationsDropdownProps) {
  const [openSheet, setOpenSheet] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState<string | null>(null);
  const [feeItemsDialogOpen, setFeeItemsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const isActive = lease.is_active;

  const setFeeItemsMutation = useMutation({
    mutationFn: (feeItems: Array<{
      fee_type_id?: string;
      fee_name: string;
      fee_code?: string;
      specification_id?: string;
      spec_name?: string;
      spec_unit_price: number;
      quantity: number;
    }>) => leasesApi.setLeaseFeeItems(orgId, leaseId, feeItems),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lease', leaseId] });
      appToast.success('费用项目已更新');
    },
    onError: () => {
      appToast.error('更新费用项目失败');
    },
  });

  // 转换存储的数据格式为对话框需要的格式
  const currentFeeItems: FeeItem[] = (lease as any)?.fee_items?.map((item: any) => ({
    id: item.id,
    name: item.fee_name || item.feeType?.name || '-',
    feeTypeId: item.fee_type_id,
    specification: item.spec_name || item.specification?.name,
    specificationId: item.specification_id,
    unitPrice: Number(item.spec_unit_price || item.specification?.price_monthly || 0),
    quantity: Number(item.quantity || 1),
    billingCycle: (item as any).billingCycle || 'monthly',
  })) || [];

  const handleFeeItemsSave = (items: FeeItem[]) => {
    const feeItems = items.map(item => ({
      fee_type_id: item.feeTypeId,
      fee_name: item.name,
      specification_id: item.specificationId,
      spec_name: item.specification,
      spec_unit_price: item.unitPrice,
      quantity: item.quantity,
    }));
    setFeeItemsMutation.mutate(feeItems);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreHorizontal className="h-4 w-4 mr-2" />
            操作
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setOpenSheet('change-room')}>
            <Home className="h-4 w-4 mr-2" />换房
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpenSheet('renew')}>
            <RefreshCw className="h-4 w-4 mr-2" />续约
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpenDialog('update-tenant')}>
            <User className="h-4 w-4 mr-2" />编辑租客
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setOpenSheet('change-rent')}>
            <TrendingUp className="h-4 w-4 mr-2" />房租变更
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpenSheet('change-utility-rates')}>
            <Droplets className="h-4 w-4 mr-2" />水电单价变更
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpenDialog('change-deposit')}>
            <DollarSign className="h-4 w-4 mr-2" />押金变更
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setFeeItemsDialogOpen(true)}>
            <Layers className="h-4 w-4 mr-2" />编辑费用项目
          </DropdownMenuItem>
          {isActive && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setOpenSheet('settle')}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="h-4 w-4 mr-2" />退租结算
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Sheet 组件 */}
      <ChangeRoomSheet
        open={openSheet === 'change-room'}
        onOpenChange={(open) => setOpenSheet(open ? 'change-room' : null)}
        orgId={orgId}
        leaseId={leaseId}
      />
      <RenewSheet
        open={openSheet === 'renew'}
        onOpenChange={(open) => setOpenSheet(open ? 'renew' : null)}
        orgId={orgId}
        leaseId={leaseId}
        currentEndDate={lease.end_date}
      />
      <ChangeRentSheet
        open={openSheet === 'change-rent'}
        onOpenChange={(open) => setOpenSheet(open ? 'change-rent' : null)}
        orgId={orgId}
        leaseId={leaseId}
        currentRent={Number(lease.monthly_rent)}
      />
      <ChangeUtilityRatesSheet
        open={openSheet === 'change-utility-rates'}
        onOpenChange={(open) => setOpenSheet(open ? 'change-utility-rates' : null)}
        orgId={orgId}
        leaseId={leaseId}
        currentWaterRate={Number(lease.water_rate || 0)}
        currentElectricityRate={Number(lease.electricity_rate || 0)}
      />
      <FeeItemsEditorDialog
        open={feeItemsDialogOpen}
        onOpenChange={setFeeItemsDialogOpen}
        orgId={orgId}
        leaseId={leaseId}
        currentItems={currentFeeItems}
        onSave={handleFeeItemsSave}
      />
      <SettleLeaseSheet
        open={openSheet === 'settle'}
        onOpenChange={(open) => setOpenSheet(open ? 'settle' : null)}
        orgId={orgId}
        leaseId={leaseId}
      />

      {/* Dialog 组件 */}
      <UpdateTenantDialog
        open={openDialog === 'update-tenant'}
        onOpenChange={(open) => setOpenDialog(open ? 'update-tenant' : null)}
        orgId={orgId}
        leaseId={leaseId}
        currentTenantId={lease.tenant_id}
      />
      <ChangeDepositDialog
        open={openDialog === 'change-deposit'}
        onOpenChange={(open) => setOpenDialog(open ? 'change-deposit' : null)}
        orgId={orgId}
        leaseId={leaseId}
        currentDeposit={Number(lease.deposit || 0)}
      />
    </>
  );
}
