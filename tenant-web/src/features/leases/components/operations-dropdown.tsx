'use client';

import { useState } from 'react';
import type { Lease } from '@/types';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@apartment-ultra/shared-ui/components/ui';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { MoreHorizontal, Home, RefreshCw, User, TrendingUp, Droplets, DollarSign, Layers, LogOut } from 'lucide-react';

interface OperationsDropdownProps {
  orgId: string;
  leaseId: string;
  lease: Lease;
}

export function OperationsDropdown({ orgId, leaseId, lease }: OperationsDropdownProps) {
  const isActive = lease.is_active;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <MoreHorizontal className="h-4 w-4 mr-2" />
          操作
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem disabled>
          <Home className="h-4 w-4 mr-2" />换房（开发中）
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <RefreshCw className="h-4 w-4 mr-2" />续约（开发中）
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <User className="h-4 w-4 mr-2" />编辑租客（开发中）
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <TrendingUp className="h-4 w-4 mr-2" />房租变更（开发中）
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <Droplets className="h-4 w-4 mr-2" />水电单价变更（开发中）
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <DollarSign className="h-4 w-4 mr-2" />押金变更（开发中）
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <Layers className="h-4 w-4 mr-2" />编辑费用项目（开发中）
        </DropdownMenuItem>
        {isActive && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled className="text-destructive">
              <LogOut className="h-4 w-4 mr-2" />退租结算（开发中）
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}