
import { useQuery } from '@tanstack/react-query';
import { Select } from 'antd';
import { tenantsApi } from '@/api/tenants';
import { cn } from '@apartment-ultra/web-shared';

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
    queryFn: () => tenantsApi.list(),
    enabled: !!orgId,
  });

  return (
    <Select
      value={value || ''}
      onChange={(v) => onValueChange(v)}
      disabled={disabled}
      placeholder={placeholder}
      className={cn('min-w-[140px]', className)}
    >
      {tenants?.map((tenant) => (
        <Select.Option key={tenant.id} value={tenant.id}>
          {tenant.name} - {tenant.phone}
        </Select.Option>
      ))}
    </Select>
  );
}
