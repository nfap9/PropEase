
import type { FormEvent } from 'react';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { FilterField } from '@apartment-ultra/shared-ui/components/ui';
import { Input } from '@apartment-ultra/shared-ui/components/ui';
import { PageToolbar } from '@apartment-ultra/shared-ui/components/ui';
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
  search: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: (event: FormEvent) => void;
  onActiveFilterChange: (value: FilterActive) => void;
}

export function RegisteredUsersToolbar({
  activeFilter,
  search,
  onSearchChange,
  onSearchSubmit,
  onActiveFilterChange,
}: RegisteredUsersToolbarProps) {
  return (
    <PageToolbar className="justify-between gap-4 sm:justify-start">
      <form onSubmit={onSearchSubmit} className="w-full sm:flex-[1_1_320px]">
        <FilterField label="搜索">
          <div className="flex gap-2">
            <Input
              placeholder={adminMessages.registeredUsers.toolbar.searchPlaceholder}
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              className="w-full"
            />
            <Button type="submit" variant="secondary" size="sm">
              {adminMessages.registeredUsers.toolbar.search}
            </Button>
          </div>
        </FilterField>
      </form>
      <FilterField label="状态">
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
      </FilterField>
    </PageToolbar>
  );
}
