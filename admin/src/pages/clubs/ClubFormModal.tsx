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
  Textarea,
  Switch,
  ImageUpload,
} from '@/components/ui';
import type { Club } from '@/types';

const clubSchema = z.object({
  name: z.string().min(1, 'Введите название'),
  description: z.string().optional(),
  goal: z.string().optional(),
  cover_image: z.string().optional().nullable(),
  chat_link: z.string().url('Некорректная ссылка').optional().or(z.literal('')),
  channel_link: z.string().url('Некорректная ссылка').optional().or(z.literal('')),
  members_count: z.coerce.number().min(0).optional(),
  events_count: z.coerce.number().min(0).optional(),
  wins_count: z.coerce.number().min(0).optional(),
  is_visible: z.boolean().optional(),
});

export type ClubFormData = z.infer<typeof clubSchema>;

interface ClubFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ClubFormData) => void;
  isLoading?: boolean;
  club?: Club | null;
}

export function ClubFormModal({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
  club,
}: ClubFormModalProps) {
  const isEditing = !!club;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ClubFormData>({
    resolver: zodResolver(clubSchema),
    defaultValues: {
      name: '',
      description: '',
      goal: '',
      cover_image: null,
      chat_link: '',
      channel_link: '',
      members_count: 0,
      events_count: 0,
      wins_count: 0,
      is_visible: true,
    },
  });

  useEffect(() => {
    if (open) {
      if (club) {
        reset({
          name: club.name,
          description: club.description || '',
          goal: club.goal || '',
          cover_image: club.cover_image,
          chat_link: club.chat_link || '',
          channel_link: club.channel_link || '',
          members_count: club.members_count,
          events_count: club.events_count,
          wins_count: club.wins_count,
          is_visible: club.is_visible,
        });
      } else {
        reset({
          name: '',
          description: '',
          goal: '',
          cover_image: null,
          chat_link: '',
          channel_link: '',
          members_count: 0,
          events_count: 0,
          wins_count: 0,
          is_visible: true,
        });
      }
    }
  }, [open, club, reset]);

  const handleFormSubmit = (data: ClubFormData) => {
    onSubmit({
      ...data,
      cover_image: data.cover_image || undefined,
      chat_link: data.chat_link || undefined,
      channel_link: data.channel_link || undefined,
    });
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <ModalHeader>
          <ModalTitle>{isEditing ? 'Редактировать клуб' : 'Новый клуб'}</ModalTitle>
          <ModalDescription>
            {isEditing ? 'Измените данные клуба' : 'Заполните информацию о клубе'}
          </ModalDescription>
        </ModalHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Название *</Label>
            <Input
              id="name"
              placeholder="Название клуба"
              error={errors.name?.message}
              {...register('name')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              placeholder="Чем занимается клуб"
              error={errors.description?.message}
              {...register('description')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal">Цель</Label>
            <Textarea
              id="goal"
              placeholder="Основная цель клуба"
              error={errors.goal?.message}
              {...register('goal')}
            />
          </div>

          <div className="space-y-2">
            <Label>Обложка</Label>
            <Controller
              name="cover_image"
              control={control}
              render={({ field }) => (
                <ImageUpload
                  value={field.value}
                  onChange={field.onChange}
                  aspectRatio="video"
                />
              )}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="chat_link">Ссылка на чат</Label>
              <Input
                id="chat_link"
                type="url"
                placeholder="https://t.me/..."
                error={errors.chat_link?.message}
                {...register('chat_link')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="channel_link">Ссылка на канал</Label>
              <Input
                id="channel_link"
                type="url"
                placeholder="https://t.me/..."
                error={errors.channel_link?.message}
                {...register('channel_link')}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="members_count">Участников</Label>
              <Input
                id="members_count"
                type="number"
                min={0}
                error={errors.members_count?.message}
                {...register('members_count')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="events_count">Мероприятий</Label>
              <Input
                id="events_count"
                type="number"
                min={0}
                error={errors.events_count?.message}
                {...register('events_count')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wins_count">Побед</Label>
              <Input
                id="wins_count"
                type="number"
                min={0}
                error={errors.wins_count?.message}
                {...register('wins_count')}
              />
            </div>
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
