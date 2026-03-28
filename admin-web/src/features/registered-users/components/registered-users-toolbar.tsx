'use client';

import type { FormEvent } from 'react';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Input } from '@apartment-ultra/shared-ui/components/ui';
import { PageToolbar } from '@apartment-ultra/shared-ui/components/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@apartment-ultra/shared-ui/components/ui';
import type { FilterActive } from '../registered-users.schemas';
import { adminMessages } from '@/lib/i18n';

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
    <PageToolbar className="justify-between sm:justify-end">
      <form onSubmit={onSearchSubmit} className="flex gap-2">
        <Input
          placeholder={adminMessages.registeredUsers.toolbar.searchPlaceholder}
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="w-40"
        />
        <Button type="submit" variant="secondary" size="sm">
          {adminMessages.registeredUsers.toolbar.search}
        </Button>
      </form>
      <Select value={activeFilter} onValueChange={(value) => onActiveFilterChange(value as FilterActive)}>
        <SelectTrigger className="w-36">
          <SelectValue placeholder={adminMessages.registeredUsers.toolbar.statusPlaceholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{adminMessages.registeredUsers.toolbar.all}</SelectItem>
          <SelectItem value="active">{adminMessages.registeredUsers.toolbar.active}</SelectItem>
          <SelectItem value="inactive">{adminMessages.registeredUsers.toolbar.inactive}</SelectItem>
        </SelectContent>
      </Select>
    </PageToolbar>
  );
}
