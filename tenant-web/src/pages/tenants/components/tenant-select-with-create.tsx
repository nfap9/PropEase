
import { useState } from 'react';
import { Button } from 'antd';
import { Plus } from 'lucide-react';
import { TenantSelect } from './tenant-select';
import { CreateTenantDialog } from './create-tenant-dialog';
import { Tenant } from '@/types';

export interface TenantSelectWithCreateProps {
  orgId: string;
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
}

/**
 * 租客选择器（带创建功能）
 *
 * 组合了 TenantSelect 和 CreateTenantDialog，提供便捷的一体化体验。
 * 如果只需要纯选择器，请直接使用 TenantSelect。
 */
export function TenantSelectWithCreate({
  orgId,
  value,
  onValueChange,
  placeholder,
  disabled,
  error,
}: TenantSelectWithCreateProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const handleCreated = (newTenant: Tenant) => {
    onValueChange(newTenant.id);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <TenantSelect
          orgId={orgId}
          value={value}
          onValueChange={onValueChange}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1"
        />
        <Button
          size="small"
          onClick={() => setIsCreateOpen(true)}
          disabled={disabled}
          title="新增租客"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}

      <CreateTenantDialog
        orgId={orgId}
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={handleCreated}
      />
    </div>
  );
}
