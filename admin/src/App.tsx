import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout, ProtectedRoute } from '@/components/layout';
import { ToastProvider } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import {
  LoginPage,
  DashboardPage,
  WinsPage,
  ProjectsPage,
  TeamPage,
  NewsPage,
  PartnersPage,
  ClubsPage,
  BlogPage,
  BlogPostForm,
  UsersPage,
  LogsPage,
  TelegramPage,
} from '@/pages';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppRoutes() {
  const { checkAuth, isAuthenticated } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
        }
      />

      {/* Protected routes */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/wins" element={<WinsPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/team" element={<TeamPage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/partners" element={<PartnersPage />} />
        <Route path="/clubs" element={<ClubsPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/new" element={<BlogPostForm />} />
        <Route path="/blog/:id/edit" element={<BlogPostForm />} />
        <Route path="/telegram" element={<TelegramPage />} />

        {/* Admin only routes */}
        <Route
          path="/users"
          element={
            <ProtectedRoute requireAdmin>
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/logs"
          element={
            <ProtectedRoute requireAdmin>
              <LogsPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Redirect root to dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* 404 */}
      <Route
        path="*"
        element={
          <div className="flex h-screen items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900">404</h1>
              <p className="mt-2 text-gray-500">Страница не найдена</p>
              <a href="/dashboard" className="mt-4 text-primary hover:underline">
                На главную
              </a>
            </div>
          </div>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
