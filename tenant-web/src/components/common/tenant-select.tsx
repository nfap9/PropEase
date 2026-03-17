'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@apartment-ultra/shared-ui/components/ui';
import { tenantsApi } from '@/lib/api';
import { cn } from '@/lib/utils';

interface TenantSelectProps {
  orgId: string;
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * 租客选择器（纯选择功能）
 *
 * 只负责选择租客，不包含创建功能。
 * 如需带创建功能，请使用 TenantSelectWithCreate。
 */
export function TenantSelect({
  orgId,
  value,
  onValueChange,
  placeholder = '选择租客',
  disabled = false,
  className,
}: TenantSelectProps) {
  const { data: tenants } = useQuery({
    queryKey: ['tenants', orgId],
    queryFn: () => tenantsApi.list(orgId),
    enabled: !!orgId,
  });

  return (
    <Select value={value || ''} onValueChange={(v) => onValueChange(v)} disabled={disabled}>
      <SelectTrigger className={cn('min-w-[140px]', className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {tenants?.map((tenant) => (
          <SelectItem key={tenant.id} value={tenant.id}>
            {tenant.name} - {tenant.phone}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
