'use client';

import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@apartment-ultra/shared-ui/components/ui';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { feeItemsApi } from '@/lib/api';
import type { FeeCategory, FeeCycle } from '@apartment-ultra/api-contract';

const CATEGORY_LABELS: Record<FeeCategory, string> = {
  fixed: '固定费用',
  utility: '水电费用',
  optional: '可选费用',
};

const CYCLE_LABELS: Record<FeeCycle, string> = {
  monthly: '每月',
  quarterly: '每季',
  yearly: '每年',
  one_time: '一次性',
};

interface FeeConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  apartmentId: string;
}

export function FeeConfigDialog({ open, onOpenChange, orgId, apartmentId }: FeeConfigDialogProps) {
  const { data: feeItems, isLoading } = useQuery({
    queryKey: ['fee-items', orgId],
    queryFn: () => feeItemsApi.list(orgId),
    enabled: !!orgId,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>费用项目</DialogTitle>
          <DialogDescription>组织共享的费用项目，所有公寓均可使用</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {isLoading ? (
            <div className="py-4 text-center text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mx-auto" />
            </div>
          ) : feeItems && feeItems.length > 0 ? (
            feeItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {CATEGORY_LABELS[item.category]} · ¥{Number(item.amount)}/{CYCLE_LABELS[item.cycle]}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-4 text-center text-muted-foreground">
              暂未配置费用项目，请在设置中添加
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
