'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';

const PUBLIC_PATHS = ['/login', '/setup'];

/**
 * 运营后台布局：未登录时重定向到 /login（公开页面除外）；
 * 已登录时使用侧栏 + 主内容区布局。
 */
export function AdminAuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // 公开页面不需要认证
    if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
      return;
    }
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_access_token') : null;
    if (!token) {
      router.replace('/login');
    }
  }, [pathname, router]);

  // 公开页面直接渲染
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return <>{children}</>;
  }

  return <AdminLayout>{children}</AdminLayout>;
}
