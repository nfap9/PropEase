'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth/context';
import { invalidateOrgScopedQueries } from '@/lib/query-utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Building2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Organization } from '@/types';

export function OrgSelector() {
  const { organization, organizations, setOrganization } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [pendingOrg, setPendingOrg] = useState<Organization | null>(null);

  const handleSelectOrg = (value: string) => {
    const org = organizations.find((o) => o.id.toString() === value);
    if (!org || org.id === organization?.id) return;
    setPendingOrg(org);
  };

  const handleConfirmSwitch = () => {
    if (pendingOrg) {
      setOrganization(pendingOrg);
      invalidateOrgScopedQueries(queryClient);
      setPendingOrg(null);
      router.refresh();
    }
  };

  const handleCancelSwitch = () => {
    setPendingOrg(null);
  };

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
    <>
      <Select value={organization?.id?.toString() || ''} onValueChange={handleSelectOrg}>
        <SelectTrigger className="h-9 w-[200px]">
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

      <AlertDialog open={!!pendingOrg} onOpenChange={(open) => !open && handleCancelSwitch()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认切换组织</AlertDialogTitle>
            <AlertDialogDescription>
              确定要切换到组织「{pendingOrg?.name}」吗？切换后页面将刷新以加载新组织的数据。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSwitch}>确认切换</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
