import { ChevronDown, LogOut, Settings, Building2, Users, CreditCard, Shield } from 'lucide-react';
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
import { useAuth } from '@/contexts/auth';
import { tenantMessages } from '@/i18n';

/**
 * Header 用户菜单
 *
 * 显示用户头像和姓名，点击展开菜单
 */
export function HeaderUserMenu() {
  const { user, organization, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-auto gap-2 px-2 py-1.5"
        >
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-muted text-muted-foreground text-xs">
              {user?.full_name?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 rounded-xl">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.full_name}</p>
            <p className="text-xs leading-none text-muted-foreground">{user?.phone}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => navigate('/organizations')}
          className="cursor-pointer"
        >
          <Building2 className="mr-2 h-4 w-4" />
          <span>{tenantMessages.common.switchTeam}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">设置</DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => navigate('/settings/team')}
          className="cursor-pointer"
        >
          <Users className="mr-2 h-4 w-4" />
          <span>团队管理</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => navigate('/settings/subscription')}
          className="cursor-pointer"
        >
          <CreditCard className="mr-2 h-4 w-4" />
          <span>服务购买</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => navigate('/settings/permissions')}
          className="cursor-pointer"
        >
          <Shield className="mr-2 h-4 w-4" />
          <span>功能分配</span>
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
