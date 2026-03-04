'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2 } from 'lucide-react';
import { useBrandConfig } from '@/lib/brand-config-context';
import { usePermissions } from '@/hooks/use-permissions';
import { NAV_ITEMS } from './nav-config';

interface NavContentProps {
  onNavClick?: () => void;
}

/**
 * 导航内容组件
 *
 * 用于桌面端侧边栏和移动端 Sheet 中显示导航菜单
 */
export function NavContent({ onNavClick }: NavContentProps) {
  const brandConfig = useBrandConfig();
  const { hasPermission, isSuperAdmin } = usePermissions();
  const pathname = usePathname();

  const visibleNavItems = NAV_ITEMS.filter(
    (item) => !item.permission || isSuperAdmin || hasPermission(item.permission)
  );

  return (
    <>
      <div className="flex h-16 items-center border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          {brandConfig.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- Logo URL 来自运营配置，域名动态
            <img src={brandConfig.logo_url} alt="" className="h-6 w-6 object-contain" />
          ) : (
            <Building2 className="h-6 w-6" />
          )}
          <span>{brandConfig.app_name}</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavClick}
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
}
