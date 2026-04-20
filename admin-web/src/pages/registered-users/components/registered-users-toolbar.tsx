
import { Label } from '@apartment-ultra/shared-ui/components/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@apartment-ultra/shared-ui/components/ui';
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
        <Label className="text-xs text-muted-foreground">状态</Label>
        <Select value={activeFilter} onValueChange={(value) => onActiveFilterChange(value as FilterActive)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={adminMessages.registeredUsers.toolbar.statusPlaceholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{adminMessages.registeredUsers.toolbar.all}</SelectItem>
            <SelectItem value="active">{adminMessages.registeredUsers.toolbar.active}</SelectItem>
            <SelectItem value="inactive">{adminMessages.registeredUsers.toolbar.inactive}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
