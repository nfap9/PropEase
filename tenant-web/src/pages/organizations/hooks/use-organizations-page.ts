import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth';
import { organizationsApi } from '@/api/organizations';
import { getErrorMessage } from '@/utils/error';
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

export interface OrganizationsPageState {
  // Auth state
  isLoading: boolean;
  isAuthenticated: boolean;
  organizations: Organization[];
  organization: Organization | null | undefined;

  // UI State
  isCheckingAuth: boolean;
  form: ReturnType<typeof import('antd').Form.useForm>[0] | null;

  // Mutations
  createOrgMutation: ReturnType<typeof useMutation>;

  // Computed
  isEmpty: boolean;

  // Actions
  handleSelectOrganization: (org: Organization) => void;
  navigateToLogin: () => void;
}

export function useOrganizationsPage() {
  const navigate = useNavigate();
  const {
    isLoading,
    isAuthenticated,
    organizations,
    organization,
    setOrganization,
    refreshOrganizations,
  } = useAuth();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [form] = useState<ReturnType<typeof import('antd').Form.useForm>[0] | null>(null);

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

  const createOrgMutation = useMutation({
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

  const handleSelectOrganization = useCallback(
    (org: Organization) => {
      setOrganization(org);
      toast.success('团队切换成功');
      navigate(DEFAULT_ORGANIZATION_HOME_PATH, { replace: true });
    },
    [setOrganization, navigate]
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
    form,
    createOrgMutation,
    isEmpty: organizations.length === 0,
    handleSelectOrganization,
    navigateToLogin,
  };
}
