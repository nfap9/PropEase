'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leasesApi } from '@/lib/api';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@apartment-ultra/shared-ui/components/ui';
import { Loader2, Pencil } from 'lucide-react';
import { appToast } from '@apartment-ultra/shared-ui/components/ui';
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

interface LeaseFeeItemsTabProps {
  leaseId: string;
  orgId: string;
}

export function LeaseFeeItemsTab({ leaseId, orgId }: LeaseFeeItemsTabProps) {
  const [openDialog, setOpenDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: lease, isLoading } = useQuery({
    queryKey: ['lease', leaseId],
    queryFn: () => leasesApi.get(orgId, leaseId),
  });

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // 转换存储的数据格式为对话框需要的格式
  const currentItems: FeeItem[] = (lease as any)?.fee_items?.map((item: any) => ({
    id: item.id,
    name: item.fee_name || item.feeType?.name || '-',
    feeTypeId: item.fee_type_id,
    specification: item.spec_name || item.specification?.name,
    specificationId: item.specification_id,
    unitPrice: Number(item.spec_unit_price || item.specification?.price_monthly || 0),
    quantity: Number(item.quantity || 1),
    billingCycle: (item as any).billingCycle || 'monthly',
  })) || [];

  const handleSave = (items: FeeItem[]) => {
    const feeItems = items.map(item => ({
      fee_type_id: item.feeTypeId,
      fee_name: item.name,
      specification_id: item.specificationId,
      spec_name: item.specification,
      spec_unit_price: item.unitPrice,
      quantity: item.quantity,
      billing_cycle: item.billingCycle,
    }));
    setFeeItemsMutation.mutate(feeItems);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">费用项目</h2>
        <Button variant="outline" size="sm" onClick={() => setOpenDialog(true)}>
          <Pencil className="h-4 w-4 mr-2" />
          编辑
        </Button>
      </div>

      {currentItems.length === 0 ? (
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
                {currentItems.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="py-2">{item.name}</td>
                    <td className="py-2 text-muted-foreground">
                      {item.specification || '-'}
                    </td>
                    <td className="py-2 text-right">
                      ¥{item.unitPrice.toLocaleString()}
                    </td>
                    <td className="py-2 text-right">× {item.quantity}</td>
                    <td className="py-2 text-right font-medium">
                      ¥{(item.unitPrice * item.quantity).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <FeeItemsEditorDialog
        open={openDialog}
        onOpenChange={setOpenDialog}
        orgId={orgId}
        leaseId={leaseId}
        currentItems={currentItems}
        onSave={handleSave}
      />
    </div>
  );
}
