'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
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
  Store,
  DollarSign,
} from 'lucide-react';
import { useState } from 'react';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@apartment-ultra/shared-ui/components/ui';

const ADMIN_NAV = [
  { href: '/', label: '工作台', icon: LayoutDashboard },
  { href: '/brand', label: '界面信息', icon: Palette },
  { href: '/users', label: '管理账号', icon: Users },
  { href: '/registered-users', label: '用户管理', icon: UserCircle },
  { href: '/roles', label: '分工设置', icon: Shield },
  { href: '/organizations', label: '团队管理', icon: Building2 },
  { href: '/service-pricing', label: '服务方案', icon: DollarSign },
  { href: '/storefront', label: '商品展示', icon: Store },
  { href: '/usage-pricing', label: '用量计费', icon: Package },
  { href: '/subscriptions', label: '已购服务', icon: CreditCard },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('admin_access_token');
    window.location.href = '/login';
  };

  const NavContent = () => (
    <>
      <div className="flex h-16 items-center border-b px-4">
        <span className="font-semibold">管理平台</span>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {ADMIN_NAV.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
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
              <SheetTitle className="sr-only">管理平台导航</SheetTitle>
              <NavContent />
            </SheetContent>
          </Sheet>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <ThemeToggle />
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
