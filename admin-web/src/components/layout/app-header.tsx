import { useNavigate } from 'react-router-dom';
import { LogOut, Settings } from 'lucide-react';
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
import { adminMessages } from '@/i18n';
import { adminApiEndpoints } from '@/api/admin-client';

/**
 * Header 用户菜单
 */
export function AppHeaderUserMenu() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await adminApiEndpoints.logout();
    } catch {
      // 即使失败也继续清除本地状态
    }
    localStorage.removeItem('admin_access_token');
    document.cookie = 'admin_access_token=; path=/; max-age=0; SameSite=Lax';
    navigate('/login');
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
              A
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 rounded-xl">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">管理员</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{adminMessages.layout.logout}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
