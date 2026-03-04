'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';

const ADMIN_LOGIN_PATH = '/admin/login';

/**
 * 运营后台布局：未登录时重定向到 /admin/login（登录页除外）；
 * 已登录时使用侧栏 + 主内容区布局。
 */
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname === ADMIN_LOGIN_PATH) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_access_token') : null;
    if (!token) {
      router.replace(ADMIN_LOGIN_PATH);
    }
  }, [pathname, router]);

  if (pathname === ADMIN_LOGIN_PATH) {
    return <>{children}</>;
  }

  return <AdminLayout>{children}</AdminLayout>;
}
