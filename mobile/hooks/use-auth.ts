import { useAuthStore } from '@/stores/auth'

export function useAuth() {
  const {
    user,
    organization,
    organizations,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    setUser,
    setOrganization,
    loadOrganizations,
    initialize,
  } = useAuthStore()

  return {
    user,
    organization,
    organizations,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    setUser,
    setOrganization,
    loadOrganizations,
    initialize,
  }
}

export default useAuth
