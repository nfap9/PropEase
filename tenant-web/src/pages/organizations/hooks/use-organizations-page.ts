import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth';
import { organizationsApi } from '@/api/organizations';
import { getErrorMessage } from '@propease/web-shared';
import { DEFAULT_ORGANIZATION_HOME_PATH } from '@/utils/auth-redirect';
import type { Organization } from '@/types';

function buildOrganizationSlug(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '') || 'org'
  );
}

export function useOrganizationsPage() {
  const navigate = useNavigate();
  const { isLoading, isAuthenticated, organizations, organization, setOrganization, refreshOrganizations } =
    useAuth();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated) {
      navigate('/tenant/login', { replace: true });
      return;
    }

    setIsCheckingAuth(false);
  }, [isAuthenticated, isLoading, navigate]);

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; notes?: string }) =>
      organizationsApi.create({
        name: data.name.trim(),
        slug: buildOrganizationSlug(data.name.trim()),
        notes: data.notes?.trim(),
      }),
    onSuccess: async (createdOrganization) => {
      await refreshOrganizations(createdOrganization.id);
      setOrganization(createdOrganization);
      toast.success('团队创建成功');
      navigate(DEFAULT_ORGANIZATION_HOME_PATH, { replace: true });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, '创建团队失败，请重试'));
    },
  });

  const createOrganization = useCallback(
    (data: { name: string; notes?: string }, onSuccess?: () => void) => {
      createMutation.mutate(data, { onSuccess });
    },
    [createMutation],
  );

  const handleSelectOrganization = useCallback(
    (org: Organization) => {
      setOrganization(org);
      toast.success('团队切换成功');
      navigate(DEFAULT_ORGANIZATION_HOME_PATH, { replace: true });
    },
    [setOrganization, navigate],
  );

  const navigateToLogin = useCallback(() => {
    navigate('/tenant/login', { replace: true });
  }, [navigate]);

  return {
    isLoading,
    isAuthenticated,
    organizations,
    organization,
    isCheckingAuth,
    createOrganization,
    isCreating: createMutation.isPending,
    isEmpty: organizations.length === 0,
    handleSelectOrganization,
    navigateToLogin,
  };
}
