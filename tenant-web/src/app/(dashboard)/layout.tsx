'use client';

import { AuthGuard } from '@/components/layout/auth-guard';
import { MainLayout } from '@/components/layout/main-layout';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <MainLayout>
        {children}
      </MainLayout>
    </AuthGuard>
  );
}
