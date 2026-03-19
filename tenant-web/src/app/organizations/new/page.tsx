'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Redirects /organizations/new to /organizations.
 * The /organizations page now handles both creation (0 orgs) and selection (multiple orgs).
 * This preserves the flow for "create new org when org exists" while using the unified page.
 */
export default function RedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/organizations');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30">
      <div className="text-sm text-muted-foreground">加载中...</div>
    </div>
  );
}
