
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/auth/context';
import { invalidateOrgScopedQueries } from '@/hooks/query-utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@apartment-ultra/shared-ui/components/ui';
import { ConfirmDialog } from '@apartment-ultra/shared-ui/components/ui';
import { Building2, Plus } from 'lucide-react';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { useNavigate } from 'react-router-dom';
import { Organization } from '@/types';

export function OrgSelector() {
  const { organization, organizations, setOrganization } = useAuth();
  const navigate = useNavigate();
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
      navigate(0); // refresh current route
    }
  };

  const handleCancelSwitch = () => {
    setPendingOrg(null);
  };

  if (organizations.length === 0) {
    return (
      <Button variant="outline" size="sm" onClick={() => navigate('/organizations/new')} className="gap-2">
        <Plus className="h-4 w-4" />
        创建团队
      </Button>
    );
  }

  return (
    <>
      <Select value={organization?.id?.toString() || ''} onValueChange={handleSelectOrg}>
        <SelectTrigger className="h-9 w-[200px]">
          <Building2 className="mr-2 h-4 w-4" />
          <SelectValue placeholder="选择团队" />
        </SelectTrigger>
        <SelectContent>
          {organizations.map((org) => (
            <SelectItem key={org.id} value={org.id.toString()}>
              {org.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <ConfirmDialog
        open={!!pendingOrg}
        onOpenChange={(open) => !open && handleCancelSwitch()}
        title="确认切换团队"
        description={`确定要切换到团队 "${pendingOrg?.name ?? ''}" 吗？切换后页面将刷新以加载新团队的数据。`}
        cancelLabel="取消"
        confirmLabel="确认切换"
        onConfirm={handleConfirmSwitch}
      />
    </>
  );
}
