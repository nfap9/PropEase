'use client';

import { useAuth } from '@/lib/auth/context';
import { AdminLayout } from './admin-layout';
import { MainLayout } from './main-layout';

interface UnifiedLayoutProps {
  children: React.ReactNode;
}

export function UnifiedLayout({ children }: UnifiedLayoutProps) {
  const { isAdmin } = useAuth();

  if (isAdmin) {
    return <AdminLayout>{children}</AdminLayout>;
  }

  return <MainLayout>{children}</MainLayout>;
}
