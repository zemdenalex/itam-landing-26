import { useAuthStore } from '@/store/authStore';

export function useAuth() {
  const store = useAuthStore();
  
  return {
    user: store.user,
    token: store.token,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    error: store.error,
    isAdmin: store.user?.role === 'admin',
    login: store.login,
    logout: store.logout,
    checkAuth: store.checkAuth,
    clearError: store.clearError,
  };
}

export default useAuth;
