'use client';

/**
 * 运营后台管理布局组件
 *
 * 提供管理后台的页面框架：
 * - 左侧边栏导航（桌面端）
 * - 移动端抽屉式导航（Sheet）
 * - 顶部 Header（主题切换、退出登录）
 * - 主内容区域
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui';
import {
  LayoutDashboard,
  Users,
  UserCircle,
  Shield,
  Building2,
  Package,
  CreditCard,
  Menu,
  LogOut,
  Palette,
} from 'lucide-react';
import { useState } from 'react';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@apartment-ultra/shared-ui/components/ui';

/** 管理员导航菜单配置 */
const ADMIN_NAV = [
  { href: '/admin', label: '概览', icon: LayoutDashboard },
  { href: '/admin/brand', label: '品牌配置', icon: Palette },
  { href: '/admin/users', label: '管理账号', icon: Users },
  { href: '/admin/registered-users', label: '用户管理', icon: UserCircle },
  { href: '/admin/roles', label: '角色权限', icon: Shield },
  { href: '/admin/organizations', label: '团队管理', icon: Building2 },
  { href: '/admin/plans', label: '服务配置', icon: Package },
  { href: '/admin/usage-pricing', label: '按量定价', icon: Package },
  { href: '/admin/subscriptions', label: '订阅管理', icon: CreditCard },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  /** 退出登录 */
  const handleLogout = () => {
    localStorage.removeItem('admin_access_token');
    window.location.href = '/admin/login';
  };

  /** 导航菜单内容（桌面侧边栏和移动端 Sheet 共用） */
  const NavContent = () => (
    <>
      <div className="flex h-16 items-center border-b px-4">
        <span className="font-semibold">管理平台</span>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {ADMIN_NAV.map((item) => {
          const Icon = item.icon;
          // 高亮当前激活的菜单项（精确匹配或前缀匹配）
          const isActive =
            pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );

  return (
    <div className="flex h-screen">
      {/* 桌面端侧边栏 - lg 及以上屏幕显示 */}
      <aside className="hidden w-64 flex-col border-r bg-muted/40 lg:flex">
        <NavContent />
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* 顶部 Header */}
        <header className="flex h-16 items-center justify-between border-b bg-background px-4">
          {/* 移动端菜单按钮 - 小于 lg 屏幕显示 */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetTitle className="sr-only">管理平台导航</SheetTitle>
              <NavContent />
            </SheetContent>
          </Sheet>

          <div className="flex-1" />

          {/* 右侧操作区 */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              退出登录
            </Button>
          </div>
        </header>

        {/* 主内容区 */}
        <main className="flex-1 overflow-auto bg-muted/30 p-6">{children}</main>
      </div>
    </div>
  );
}
