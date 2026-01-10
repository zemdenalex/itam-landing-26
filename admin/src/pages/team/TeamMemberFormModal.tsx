import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  Button,
  Input,
  Label,
  Select,
  Switch,
  ImageUpload,
} from '@/components/ui';
import type { TeamMember, Club } from '@/types';

const teamMemberSchema = z.object({
  name: z.string().min(1, 'Введите имя'),
  role: z.string().optional(),
  photo: z.string().optional().nullable(),
  club_id: z.coerce.number().optional().nullable(),
  badge: z.string().optional(),
  telegram_link: z.string().url('Некорректная ссылка').optional().or(z.literal('')),
  is_visible: z.boolean().optional(),
});

export type TeamMemberFormData = z.infer<typeof teamMemberSchema>;

interface TeamMemberFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TeamMemberFormData) => void;
  isLoading?: boolean;
  member?: TeamMember | null;
  clubs: Club[];
}

export function TeamMemberFormModal({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
  member,
  clubs,
}: TeamMemberFormModalProps) {
  const isEditing = !!member;

  const clubOptions = [
    { value: '', label: 'Без клуба' },
    ...clubs.map((club) => ({ value: String(club.id), label: club.name })),
  ];

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<TeamMemberFormData>({
    resolver: zodResolver(teamMemberSchema),
    defaultValues: {
      name: '',
      role: '',
      photo: null,
      club_id: null,
      badge: '',
      telegram_link: '',
      is_visible: true,
    },
  });

  useEffect(() => {
    if (open) {
      if (member) {
        reset({
          name: member.name,
          role: member.role || '',
          photo: member.photo,
          club_id: member.club_id,
          badge: member.badge || '',
          telegram_link: member.telegram_link || '',
          is_visible: member.is_visible,
        });
      } else {
        reset({
          name: '',
          role: '',
          photo: null,
          club_id: null,
          badge: '',
          telegram_link: '',
          is_visible: true,
        });
      }
    }
  }, [open, member, reset]);

  const handleFormSubmit = (data: TeamMemberFormData) => {
    onSubmit({
      ...data,
      photo: data.photo || undefined,
      club_id: data.club_id || undefined,
      telegram_link: data.telegram_link || undefined,
    });
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <ModalHeader>
          <ModalTitle>{isEditing ? 'Редактировать участника' : 'Новый участник'}</ModalTitle>
          <ModalDescription>
            {isEditing ? 'Измените данные участника' : 'Заполните информацию об участнике'}
          </ModalDescription>
        </ModalHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Фото</Label>
            <Controller
              name="photo"
              control={control}
              render={({ field }) => (
                <ImageUpload
                  value={field.value}
                  onChange={field.onChange}
                  aspectRatio="square"
                />
              )}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Имя *</Label>
              <Input
                id="name"
                placeholder="Иван Иванов"
                error={errors.name?.message}
                {...register('name')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Роль</Label>
              <Input
                id="role"
                placeholder="Backend Developer"
                error={errors.role?.message}
                {...register('role')}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="club_id">Клуб</Label>
              <Controller
                name="club_id"
                control={control}
                render={({ field }) => (
                  <Select
                    id="club_id"
                    options={clubOptions}
                    value={field.value ? String(field.value) : ''}
                    onChange={(val) => field.onChange(val ? Number(val) : null)}
                  />
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="badge">Бейдж</Label>
              <Input
                id="badge"
                placeholder="Капитан"
                error={errors.badge?.message}
                {...register('badge')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="telegram_link">Telegram</Label>
            <Input
              id="telegram_link"
              type="url"
              placeholder="https://t.me/username"
              error={errors.telegram_link?.message}
              {...register('telegram_link')}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_visible" className="cursor-pointer">
              Отображать на сайте
            </Label>
            <Controller
              name="is_visible"
              control={control}
              render={({ field }) => (
                <Switch
                  id="is_visible"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>

          <ModalFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" isLoading={isLoading}>
              {isEditing ? 'Сохранить' : 'Создать'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
