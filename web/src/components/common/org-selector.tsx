'use client';

import { useAuth } from '@/lib/auth/context';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export function OrgSelector() {
  const { organization, organizations, setOrganization } = useAuth();
  const router = useRouter();

  if (organizations.length === 0) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push('/settings/team')}
        className="gap-2"
      >
        <Plus className="h-4 w-4" />
        创建组织
      </Button>
    );
  }

  return (
    <Select
      value={organization?.id?.toString() || ''}
      onValueChange={(value) => {
        const org = organizations.find((o) => o.id.toString() === value);
        if (org) {
          setOrganization(org);
          // 刷新当前页面以加载新组织的数据
          router.refresh();
        }
      }}
    >
      <SelectTrigger className="w-[200px] h-9">
        <Building2 className="mr-2 h-4 w-4" />
        <SelectValue placeholder="选择组织" />
      </SelectTrigger>
      <SelectContent>
        {organizations.map((org) => (
          <SelectItem key={org.id} value={org.id.toString()}>
            {org.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
