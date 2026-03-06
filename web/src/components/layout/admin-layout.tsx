'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
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
  ExternalLink,
  Palette,
} from 'lucide-react';
import { useState } from 'react';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

const ADMIN_NAV = [
  { href: '/admin', label: '概览', icon: LayoutDashboard },
  { href: '/admin/brand', label: '品牌配置', icon: Palette },
  { href: '/admin/users', label: '运营账号', icon: Users },
  { href: '/admin/registered-users', label: '用户管理', icon: UserCircle },
  { href: '/admin/roles', label: '运营角色', icon: Shield },
  { href: '/admin/organizations', label: '组织管理', icon: Building2 },
  { href: '/admin/plans', label: '套餐配置', icon: Package },
  { href: '/admin/usage-pricing', label: '按量定价', icon: Package },
  { href: '/admin/subscriptions', label: '订阅管理', icon: CreditCard },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('admin_access_token');
    window.location.href = '/admin/login';
  };

  const NavContent = () => (
    <>
      <div className="flex h-16 items-center border-b px-4">
        <span className="font-semibold">运营后台</span>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {ADMIN_NAV.map((item) => {
          const Icon = item.icon;
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
      <aside className="hidden w-64 flex-col border-r bg-muted/40 lg:flex">
        <NavContent />
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b bg-background px-4">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetTitle className="sr-only">运营后台导航</SheetTitle>
              <NavContent />
            </SheetContent>
          </Sheet>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ExternalLink className="mr-2 h-4 w-4" />
                业务端
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              退出登录
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-muted/30 p-6">{children}</main>
      </div>
    </div>
  );
}
