'use client';

import type { FormEvent } from 'react';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Input } from '@apartment-ultra/shared-ui/components/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@apartment-ultra/shared-ui/components/ui';
import type { FilterActive } from '../registered-users.schemas';

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
    <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
      <h2 className="text-xl font-semibold" data-testid="admin-registered-users-heading">
        用户管理
      </h2>
      <div className="flex flex-wrap items-center gap-2">
        <form onSubmit={onSearchSubmit} className="flex gap-2">
          <Input
            placeholder="手机号或姓名"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="w-40"
          />
          <Button type="submit" variant="secondary" size="sm">
            搜索
          </Button>
        </form>
        <Select value={activeFilter} onValueChange={(value) => onActiveFilterChange(value as FilterActive)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="状态筛选" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            <SelectItem value="active">启用</SelectItem>
            <SelectItem value="inactive">停用</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
