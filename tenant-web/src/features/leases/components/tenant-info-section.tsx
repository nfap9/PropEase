'use client';

import { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { Label } from '@apartment-ultra/shared-ui/components/ui';
import type { LeaseSigningFormData } from '../leases.schemas';

interface TenantInfoSectionProps {
  form: UseFormReturn<LeaseSigningFormData>;
  onSearchTenant: () => void;
}

export function TenantInfoSection({ form, onSearchTenant }: TenantInfoSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">租客信息</h3>
        <Button type="button" variant="outline" size="sm" onClick={onSearchTenant}>
          选择已有租客
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tenant_name" required>
            租客姓名
          </Label>
          <Input id="tenant_name" placeholder="请输入租客姓名" {...form.register('tenant_name')} />
          {form.formState.errors.tenant_name && (
            <p className="text-sm text-destructive">{form.formState.errors.tenant_name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="tenant_phone" required>
            联系电话
          </Label>
          <Input id="tenant_phone" placeholder="请输入联系电话" {...form.register('tenant_phone')} />
          {form.formState.errors.tenant_phone && (
            <p className="text-sm text-destructive">{form.formState.errors.tenant_phone.message}</p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tenant_id_card">身份证号</Label>
          <Input id="tenant_id_card" placeholder="请输入身份证号" {...form.register('tenant_id_card')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tenant_emergency_contact">紧急联系人</Label>
          <Input id="tenant_emergency_contact" placeholder="请输入紧急联系人" {...form.register('tenant_emergency_contact')} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tenant_emergency_phone">紧急联系人电话</Label>
          <Input id="tenant_emergency_phone" placeholder="请输入紧急联系人电话" {...form.register('tenant_emergency_phone')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tenant_notes">备注</Label>
          <Input id="tenant_notes" placeholder="请输入备注" {...form.register('tenant_notes')} />
        </div>
      </div>
    </div>
  );
}
