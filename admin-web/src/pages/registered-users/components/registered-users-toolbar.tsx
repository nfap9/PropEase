
import { Select } from 'antd';
import type { FilterActive } from '@/schemas/registered-users';
import { adminMessages } from '@/i18n';

interface RegisteredUsersToolbarProps {
  activeFilter: FilterActive;
  onActiveFilterChange: (value: FilterActive) => void;
}

export function RegisteredUsersToolbar({
  activeFilter,
  onActiveFilterChange,
}: RegisteredUsersToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 sm:justify-start">
      <div className="flex flex-col gap-1">
        <span className="text-xs text-gray-500">状态</span>
        <Select value={activeFilter} onChange={(value) => onActiveFilterChange(value as FilterActive)} style={{ width: 120 }}>
          <Select.Option value="all">{adminMessages.registeredUsers.toolbar.all}</Select.Option>
          <Select.Option value="active">{adminMessages.registeredUsers.toolbar.active}</Select.Option>
          <Select.Option value="inactive">{adminMessages.registeredUsers.toolbar.inactive}</Select.Option>
        </Select>
      </div>
    </div>
  );
}
