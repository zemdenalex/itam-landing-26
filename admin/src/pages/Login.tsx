import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/store/authStore';
import { Button, Input, Label, useToast } from '@/components/ui';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Введите email')
    .email('Некорректный email'),
  password: z
    .string()
    .min(1, 'Введите пароль'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isLoading, error, clearError } = useAuthStore();
  const { error: showError } = useToast();

  const from = location.state?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  useEffect(() => {
    if (error) {
      showError('Ошибка входа', error);
      clearError();
    }
  }, [error, showError, clearError]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password);
    } catch {
      // Error handled in store
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-sidebar to-sidebar-active px-8 py-6">
            <h1 className="text-xl font-bold text-white text-center">
              Добро пожаловать<br />
              <span className="text-primary-light">на Админ панель ITAM</span>
            </h1>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-6 text-center">
              Введите логин и пароль
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Почта</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@itam.misis.ru"
                  error={errors.email?.message}
                  {...register('email')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  error={errors.password?.message}
                  {...register('password')}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                isLoading={isLoading}
              >
                Войти
              </Button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-gray-500">
          ITAM CMS © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
