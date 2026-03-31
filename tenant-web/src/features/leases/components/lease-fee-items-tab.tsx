'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { leasesApi } from '@/lib/api';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@apartment-ultra/shared-ui/components/ui';
import { Loader2, Pencil } from 'lucide-react';
import { UpdateFeeItemsSheet } from './operation-sheets/update-fee-items-sheet';

interface LeaseFeeItemsTabProps {
  leaseId: string;
  orgId: string;
}

export function LeaseFeeItemsTab({ leaseId, orgId }: LeaseFeeItemsTabProps) {
  const [openSheet, setOpenSheet] = useState(false);

  const { data: lease, isLoading } = useQuery({
    queryKey: ['lease', leaseId],
    queryFn: () => leasesApi.get(orgId, leaseId),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const feeItems = (lease as any)?.fee_items || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">费用项目</h2>
        <Button variant="outline" size="sm" onClick={() => setOpenSheet(true)}>
          <Pencil className="h-4 w-4 mr-2" />
          编辑
        </Button>
      </div>

      {feeItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <p>暂无费用项目</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">费用明细</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b">
                  <th className="pb-2 font-medium">费用类型</th>
                  <th className="pb-2 font-medium">规格</th>
                  <th className="pb-2 font-medium text-right">单价</th>
                  <th className="pb-2 font-medium text-right">数量</th>
                  <th className="pb-2 font-medium text-right">小计</th>
                </tr>
              </thead>
              <tbody>
                {feeItems.map((item: any) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="py-2">{item.feeType?.name || '-'}</td>
                    <td className="py-2 text-muted-foreground">
                      {item.specification?.name || '-'}
                    </td>
                    <td className="py-2 text-right">
                      ¥{item.specification?.price_monthly?.toLocaleString() || 0}
                    </td>
                    <td className="py-2 text-right">× {item.quantity}</td>
                    <td className="py-2 text-right font-medium">
                      ¥{((item.specification?.price_monthly || 0) * item.quantity).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <UpdateFeeItemsSheet
        open={openSheet}
        onOpenChange={setOpenSheet}
        orgId={orgId}
        leaseId={leaseId}
      />
    </div>
  );
}
