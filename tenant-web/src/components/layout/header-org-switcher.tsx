import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ChevronDown, Check, Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@apartment-ultra/shared-ui/components/ui';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { useAuth } from '@/auth/context';
import { useBrandConfig } from '@/contexts/brand-config';

/**
 * Header 组织切换器
 *
 * 显示当前组织名称，点击展开切换组织列表
 */
export function HeaderOrgSwitcher() {
  const { organization, organizations, setOrganization } = useAuth();
  const { app_name } = useBrandConfig();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  if (organizations.length <= 1) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Building2 className="h-4 w-4" />
        <span>{organization?.name || app_name}</span>
      </div>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-auto gap-2 px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <Building2 className="h-4 w-4" />
          <span className="max-w-[120px] truncate">{organization?.name}</span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-xl">
        <DropdownMenuLabel className="text-xs text-muted-foreground">切换团队</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => {
              setOrganization(org);
              setOpen(false);
              navigate('/dashboard');
            }}
            className="flex items-center justify-between"
          >
            <span className="flex-1 truncate">{org.name}</span>
            {org.id === organization?.id && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            setOpen(false);
            navigate('/organizations');
          }}
          className="text-muted-foreground"
        >
          <Plus className="mr-2 h-4 w-4" />
          <span>管理团队</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
