'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { getPostAuthRedirectPath } from '@/lib/auth/redirect';

export default function HomePage() {
  const { isAuthenticated, isLoading, organizations, organization } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace(getPostAuthRedirectPath(organizations, organization));
      } else {
        router.replace('/login');
      }
    }
  }, [isAuthenticated, isLoading, organization, organizations, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">加载中...</p>
      </div>
    </div>
  );
}
