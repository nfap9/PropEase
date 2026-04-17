import { useState } from 'react';
import { ChevronDown, LogOut, Building2, CreditCard, Check, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@apartment-ultra/shared-ui/components/ui';
import { Avatar, AvatarFallback } from '@apartment-ultra/shared-ui/components/ui';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { cn } from '@apartment-ultra/shared-ui/lib/utils';
import { useAuth } from '@/contexts/auth';
import { tenantMessages } from '@/i18n';

/**
 * Header 用户菜单
 *
 * 显示用户头像、姓名和组织名称，点击展开完整菜单
 */
export function HeaderUserMenu() {
  const { user, organization, organizations, setOrganization, logout } = useAuth();
  const navigate = useNavigate();
  const [orgOpen, setOrgOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  const handleSwitchOrg = (org: (typeof organizations)[0]) => {
    setOrganization(org);
    setOrgOpen(false);
    navigate('/workspace/apartments');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-auto gap-2 px-2 py-1.5">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-muted text-muted-foreground text-xs">
              {user?.full_name?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium leading-none text-foreground">
              {user?.full_name}
            </span>
            <span className="text-xs text-muted-foreground">{organization?.name}</span>
          </div>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 rounded-xl">
        {/* 组织切换 */}
        {organizations.length > 1 ? (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground">切换团队</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {organizations.map((org) => (
              <DropdownMenuItem
                key={org.id}
                onClick={() => handleSwitchOrg(org)}
                className="flex items-center justify-between"
              >
                <span className="flex-1 truncate">{org.name}</span>
                {org.id === organization?.id && <Check className="h-4 w-4 text-primary" />}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        ) : (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground">当前团队</DropdownMenuLabel>
            <DropdownMenuItem className="flex items-center gap-2" disabled>
              <Building2 className="h-4 w-4" />
              <span className="flex-1 truncate">{organization?.name}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {/* 用户信息 */}
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.full_name}</p>
            <p className="text-xs leading-none text-muted-foreground">{user?.phone}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* 设置菜单 */}
        <DropdownMenuItem onClick={() => navigate('/organizations')} className="cursor-pointer">
          <Plus className="mr-2 h-4 w-4" />
          <span>管理团队</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => navigate('/settings/subscription')}
          className="cursor-pointer"
        >
          <CreditCard className="mr-2 h-4 w-4" />
          <span>服务购买</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{tenantMessages.common.logout}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
