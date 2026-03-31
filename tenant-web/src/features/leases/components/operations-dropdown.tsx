'use client';

import { useState } from 'react';
import type { Lease } from '@/types';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@apartment-ultra/shared-ui/components/ui';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { MoreHorizontal, Home, RefreshCw, User, TrendingUp, Droplets, DollarSign, Layers, LogOut } from 'lucide-react';
import { ChangeRoomSheet } from './operation-sheets/change-room-sheet';
import { RenewSheet } from './operation-sheets/renew-sheet';
import { ChangeRentSheet } from './operation-sheets/change-rent-sheet';
import { ChangeUtilityRatesSheet } from './operation-sheets/change-utility-rates-sheet';
import { UpdateFeeItemsSheet } from './operation-sheets/update-fee-items-sheet';
import { SettleLeaseSheet } from './operation-sheets/settle-lease-sheet';
import { UpdateTenantDialog } from './operation-dialogs/update-tenant-dialog';
import { ChangeDepositDialog } from './operation-dialogs/change-deposit-dialog';

interface OperationsDropdownProps {
  orgId: string;
  leaseId: string;
  lease: Lease;
}

export function OperationsDropdown({ orgId, leaseId, lease }: OperationsDropdownProps) {
  const [openSheet, setOpenSheet] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState<string | null>(null);

  const isActive = lease.is_active;

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
          <DropdownMenuItem onClick={() => setOpenSheet('update-fee-items')}>
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
      <UpdateFeeItemsSheet
        open={openSheet === 'update-fee-items'}
        onOpenChange={(open) => setOpenSheet(open ? 'update-fee-items' : null)}
        orgId={orgId}
        leaseId={leaseId}
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
