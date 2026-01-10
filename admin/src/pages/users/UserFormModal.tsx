import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalFooter,
  Button,
  Input,
  Label,
  Select,
  Switch,
} from '@/components/ui';
import type { User } from '@/types';

const createUserSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(8, 'Минимум 8 символов'),
  name: z.string().min(1, 'Обязательное поле'),
  role: z.enum(['admin', 'editor']),
});

const updateUserSchema = z.object({
  email: z.string().email('Некорректный email').optional(),
  password: z.string().min(8, 'Минимум 8 символов').optional().or(z.literal('')),
  name: z.string().min(1, 'Обязательное поле').optional(),
  role: z.enum(['admin', 'editor']).optional(),
  is_active: z.boolean().optional(),
});

type CreateFormData = z.infer<typeof createUserSchema>;
type UpdateFormData = z.infer<typeof updateUserSchema>;

export type UserFormData = CreateFormData | UpdateFormData;

interface UserFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: UserFormData) => Promise<void>;
  isLoading?: boolean;
  user?: User | null;
  currentUserId?: number;
}

const roleOptions = [
  { value: 'editor', label: 'Редактор' },
  { value: 'admin', label: 'Администратор' },
];

export function UserFormModal({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
  user,
  currentUserId,
}: UserFormModalProps) {
  const isEditing = Boolean(user);
  const isCurrentUser = user?.id === currentUserId;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(isEditing ? updateUserSchema : createUserSchema),
    defaultValues: {
      email: '',
      password: '',
      name: '',
      role: 'editor',
      is_active: true,
    },
  });

  const watchRole = watch('role');
  const watchIsActive = watch('is_active');

  useEffect(() => {
    if (open) {
      if (user) {
        reset({
          email: user.email,
          password: '',
          name: user.name,
          role: user.role as 'admin' | 'editor',
          is_active: user.is_active,
        });
      } else {
        reset({
          email: '',
          password: '',
          name: '',
          role: 'editor',
          is_active: true,
        });
      }
    }
  }, [open, user, reset]);

  const handleFormSubmit = async (data: UserFormData) => {
    // Filter out empty password when editing
    if (isEditing && 'password' in data && data.password === '') {
      const { password, ...rest } = data;
      await onSubmit(rest);
    } else {
      await onSubmit(data);
    }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="sm:max-w-md">
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <ModalHeader>
            <ModalTitle>
              {isEditing ? 'Редактирование пользователя' : 'Новый пользователь'}
            </ModalTitle>
          </ModalHeader>

          <div className="space-y-4 py-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                {...register('email')}
                error={errors.email?.message}
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">
                Пароль {isEditing ? '(оставьте пустым, чтобы не менять)' : '*'}
              </Label>
              <Input
                id="password"
                type="password"
                placeholder={isEditing ? '••••••••' : 'Минимум 8 символов'}
                {...register('password')}
                error={errors.password?.message}
              />
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Имя *</Label>
              <Input
                id="name"
                placeholder="Иван Иванов"
                {...register('name')}
                error={errors.name?.message}
              />
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="role">Роль</Label>
              <Select
                value={watchRole || 'editor'}
                onChange={(value) => setValue('role', value as 'admin' | 'editor')}
                options={roleOptions}
                disabled={isCurrentUser}
              />
              {isCurrentUser && (
                <p className="text-xs text-gray-500">
                  Нельзя изменить свою роль
                </p>
              )}
            </div>

            {/* Active status (only when editing) */}
            {isEditing && (
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="is_active">Активен</Label>
                  <p className="text-xs text-gray-500">
                    Неактивные пользователи не могут войти
                  </p>
                </div>
                <Switch
                  id="is_active"
                  checked={watchIsActive ?? true}
                  onCheckedChange={(checked) => setValue('is_active', checked)}
                  disabled={isCurrentUser}
                />
              </div>
            )}
          </div>

          <ModalFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Сохранение...' : isEditing ? 'Сохранить' : 'Создать'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
