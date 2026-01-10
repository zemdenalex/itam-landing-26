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
  Switch,
  ImageUpload,
} from '@/components/ui';
import type { News } from '@/types';

const newsSchema = z.object({
  title: z.string().min(1, 'Введите заголовок'),
  source: z.string().min(1, 'Введите источник'),
  source_link: z.string().url('Некорректная ссылка').optional().or(z.literal('')),
  image: z.string().optional().nullable(),
  published_date: z.string().optional(),
  is_visible: z.boolean().optional(),
});

export type NewsFormData = z.infer<typeof newsSchema>;

interface NewsFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: NewsFormData) => void;
  isLoading?: boolean;
  news?: News | null;
}

export function NewsFormModal({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
  news,
}: NewsFormModalProps) {
  const isEditing = !!news;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<NewsFormData>({
    resolver: zodResolver(newsSchema),
    defaultValues: {
      title: '',
      source: '',
      source_link: '',
      image: null,
      published_date: '',
      is_visible: true,
    },
  });

  useEffect(() => {
    if (open) {
      if (news) {
        reset({
          title: news.title,
          source: news.source,
          source_link: news.source_link || '',
          image: news.image,
          published_date: news.published_date?.split('T')[0] || '',
          is_visible: news.is_visible,
        });
      } else {
        reset({
          title: '',
          source: '',
          source_link: '',
          image: null,
          published_date: '',
          is_visible: true,
        });
      }
    }
  }, [open, news, reset]);

  const handleFormSubmit = (data: NewsFormData) => {
    onSubmit({
      ...data,
      image: data.image || undefined,
      source_link: data.source_link || undefined,
      published_date: data.published_date || undefined,
    });
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <ModalHeader>
          <ModalTitle>{isEditing ? 'Редактировать новость' : 'Новая новость'}</ModalTitle>
          <ModalDescription>
            {isEditing ? 'Измените данные новости' : 'Добавьте публикацию СМИ о вас'}
          </ModalDescription>
        </ModalHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Заголовок *</Label>
            <Input
              id="title"
              placeholder="Заголовок публикации"
              error={errors.title?.message}
              {...register('title')}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="source">Источник *</Label>
              <Input
                id="source"
                placeholder="РБК, Коммерсант..."
                error={errors.source?.message}
                {...register('source')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="published_date">Дата публикации</Label>
              <Input
                id="published_date"
                type="date"
                error={errors.published_date?.message}
                {...register('published_date')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="source_link">Ссылка на публикацию</Label>
            <Input
              id="source_link"
              type="url"
              placeholder="https://..."
              error={errors.source_link?.message}
              {...register('source_link')}
            />
          </div>

          <div className="space-y-2">
            <Label>Изображение</Label>
            <Controller
              name="image"
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
