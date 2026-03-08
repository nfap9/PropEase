import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Taro from '@tarojs/taro';
import { authApi, organizationsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth/store';
import type { LoginCredentials, RegisterData } from '@apartment-ultra/api-contract';

/**
 * 认证 Hook
 */
export function useAuth() {
  const queryClient = useQueryClient();
  const {
    user,
    organization,
    organizations,
    setUser,
    setOrganization,
    setOrganizations,
    clear,
  } = useAuthStore();

  // 获取当前用户
  const { isLoading, refetch } = useQuery({
    queryKey: ['currentUser'],
    queryFn: authApi.getMe,
    enabled: !!Taro.getStorageSync('access_token'),
    retry: false,
  });

  // 获取组织列表
  const { refetch: refetchOrganizations } = useQuery({
    queryKey: ['organizations'],
    queryFn: organizationsApi.list,
    enabled: !!user,
    onSuccess: (data) => {
      setOrganizations(data);
      if (data.length > 0 && !organization) {
        const savedOrgId = Taro.getStorageSync('current_organization_id');
        const org = savedOrgId ? data.find((o) => o.id === savedOrgId) : data[0];
        if (org) {
          setOrganization(org);
        }
      }
    },
  });

  // 登录
  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => authApi.login(credentials),
    onSuccess: async (data) => {
      // 存储 token
      Taro.setStorageSync('access_token', data.access_token);
      Taro.setStorageSync('refresh_token', data.refresh_token);

      // 获取用户信息
      try {
        const userData = await authApi.getMe();
        setUser(userData);

        // 获取组织列表
        const orgs = await organizationsApi.list();
        setOrganizations(orgs);

        if (orgs.length > 0) {
          setOrganization(orgs[0]);
          Taro.setStorageSync('current_organization_id', orgs[0].id);
        }

        // 跳转到首页
        Taro.reLaunch({ url: '/pages/index/index' });
      } catch (error) {
        console.error('登录后获取用户信息失败:', error);
      }
    },
  });

  // 注册
  const registerMutation = useMutation({
    mutationFn: (data: RegisterData) => authApi.register(data),
    onSuccess: async (data) => {
      // 存储 token
      Taro.setStorageSync('access_token', data.access_token);
      Taro.setStorageSync('refresh_token', data.refresh_token);

      // 获取用户信息
      try {
        const userData = await authApi.getMe();
        setUser(userData);

        // 跳转到首页
        Taro.reLaunch({ url: '/pages/index/index' });
      } catch (error) {
        console.error('注册后获取用户信息失败:', error);
      }
    },
  });

  // 发送验证码
  const sendCodeMutation = useMutation({
    mutationFn: authApi.sendSmsCode,
  });

  // 退出登录
  const logout = () => {
    Taro.removeStorageSync('access_token');
    Taro.removeStorageSync('refresh_token');
    Taro.removeStorageSync('current_organization_id');
    clear();
    queryClient.clear();
    Taro.reLaunch({ url: '/pages/auth/login/index' });
  };

  // 切换组织
  const switchOrganization = (org: Organization) => {
    setOrganization(org);
    Taro.setStorageSync('current_organization_id', org.id);
    queryClient.invalidateQueries();
  };

  return {
    // 状态
    user,
    organization,
    organizations,
    isLoading,
    isAuthenticated: !!user,

    // 登录
    login: loginMutation.mutate,
    loginLoading: loginMutation.isPending,
    loginError: loginMutation.error,

    // 注册
    register: registerMutation.mutate,
    registerLoading: registerMutation.isPending,
    registerError: registerMutation.error,

    // 发送验证码
    sendCode: sendCodeMutation.mutate,
    sendCodeLoading: sendCodeMutation.isPending,

    // 其他
    logout,
    switchOrganization,
    refetch,
    refetchOrganizations,
  };
}
