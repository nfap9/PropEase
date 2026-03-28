'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appToast } from '@apartment-ultra/shared-ui/components/ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@apartment-ultra/shared-ui/components/ui';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Label } from '@apartment-ultra/shared-ui/components/ui';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { apartmentFeeConfigApi, feeTypesApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/utils/error';

interface FeeConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  apartmentId: string;
}

export function FeeConfigDialog({ open, onOpenChange, orgId, apartmentId }: FeeConfigDialogProps) {
  const queryClient = useQueryClient();
  const [selectedFeeTypeId, setSelectedFeeTypeId] = useState<string>('');
  const [selectedSpecId, setSelectedSpecId] = useState<string>('');

  const { data: feeTypes, isLoading: feeTypesLoading } = useQuery({
    queryKey: ['fee-types', orgId],
    queryFn: () => feeTypesApi.list(orgId),
    enabled: !!orgId,
  });

  const { data: existingConfigs, isLoading: configsLoading } = useQuery({
    queryKey: ['apartment-fee-configs', orgId, apartmentId],
    queryFn: () => apartmentFeeConfigApi.list(orgId, apartmentId),
    enabled: !!orgId && !!apartmentId,
  });

  const createConfigMutation = useMutation({
    mutationFn: () =>
      apartmentFeeConfigApi.create(orgId, apartmentId, {
        fee_type_id: selectedFeeTypeId,
        specification_id: selectedSpecId || undefined,
        effective_from: new Date().toISOString().split('T')[0],
      }),
    onSuccess: () => {
      appToast.success('费用配置已添加');
      queryClient.invalidateQueries({ queryKey: ['apartment-fee-configs', orgId, apartmentId] });
      setSelectedFeeTypeId('');
      setSelectedSpecId('');
    },
    onError: (error) => {
      appToast.error(`添加失败: ${getErrorMessage(error)}`);
    },
  });

  const deleteConfigMutation = useMutation({
    mutationFn: (configId: string) =>
      apartmentFeeConfigApi.delete(orgId, apartmentId, configId),
    onSuccess: () => {
      appToast.success('费用配置已删除');
      queryClient.invalidateQueries({ queryKey: ['apartment-fee-configs', orgId, apartmentId] });
    },
    onError: (error) => {
      appToast.error(`删除失败: ${getErrorMessage(error)}`);
    },
  });

  const selectedFeeType = feeTypes?.find((ft) => ft.id === selectedFeeTypeId);
  const isLoading = feeTypesLoading || configsLoading;

  // 过滤已配置的费用类型
  const configuredFeeTypeIds = new Set(existingConfigs?.map((c) => c.fee_type_id) || []);
  const availableFeeTypes = feeTypes?.filter((ft) => !configuredFeeTypeIds.has(ft.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>费用配置</DialogTitle>
          <DialogDescription>为公寓启用可选费用项目</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 已配置的费用列表 */}
          {existingConfigs?.map((config) => {
            const ft = feeTypes?.find((f) => f.id === config.fee_type_id);
            const spec = ft?.specifications?.find((s) => s.id === config.specification_id);
            return (
              <div
                key={config.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <div className="font-medium">{ft?.name}</div>
                  {spec && (
                    <div className="text-sm text-muted-foreground">
                      {spec.name} - ¥{Number(spec.price_monthly)}
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteConfigMutation.mutate(config.id)}
                  disabled={deleteConfigMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}

          {isLoading ? (
            <div className="py-4 text-center text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mx-auto" />
            </div>
          ) : availableFeeTypes && availableFeeTypes.length > 0 ? (
            <div className="space-y-3 rounded-lg border p-3">
              <Label>添加费用</Label>
              <select
                className="w-full rounded-md border p-2"
                value={selectedFeeTypeId}
                onChange={(e) => {
                  setSelectedFeeTypeId(e.target.value);
                  setSelectedSpecId('');
                }}
              >
                <option value="">请选择费用类型</option>
                {availableFeeTypes.map((ft) => (
                  <option key={ft.id} value={ft.id}>
                    {ft.name}
                  </option>
                ))}
              </select>

              {selectedFeeType?.specifications && selectedFeeType.specifications.length > 0 && (
                <select
                  className="w-full rounded-md border p-2"
                  value={selectedSpecId}
                  onChange={(e) => setSelectedSpecId(e.target.value)}
                >
                  <option value="">请选择规格</option>
                  {selectedFeeType.specifications.map((spec) => (
                    <option key={spec.id} value={spec.id}>
                      {spec.name} - ¥{Number(spec.price_monthly)}
                    </option>
                  ))}
                </select>
              )}

              <Button
                className="w-full"
                disabled={!selectedFeeTypeId || createConfigMutation.isPending}
                onClick={() => createConfigMutation.mutate()}
              >
                {createConfigMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                添加
              </Button>
            </div>
          ) : existingConfigs?.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground">
              暂无可用费用类型，请先在设置中添加
            </div>
          ) : null}
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
