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
import { TagsInput } from './TagsInput';
import type { Project, Tag } from '@/types';

const projectSchema = z.object({
  title: z.string().min(1, 'Введите название'),
  description: z.string().optional(),
  cover_image: z.string().optional().nullable(),
  tag_ids: z.array(z.number()).optional(),
  is_published: z.boolean().optional(),
});

export type ProjectFormData = z.infer<typeof projectSchema>;

interface ProjectFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ProjectFormData) => void;
  isLoading?: boolean;
  project?: Project | null;
  tags: Tag[];
  onCreateTag: (name: string) => Promise<Tag>;
}

export function ProjectFormModal({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
  project,
  tags,
  onCreateTag,
}: ProjectFormModalProps) {
  const isEditing = !!project;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: '',
      description: '',
      cover_image: null,
      tag_ids: [],
      is_published: false,
    },
  });

  useEffect(() => {
    if (open) {
      if (project) {
        reset({
          title: project.title,
          description: project.description || '',
          cover_image: project.cover_image,
          tag_ids: project.tags?.map((t) => t.id) || [],
          is_published: project.is_published,
        });
      } else {
        reset({
          title: '',
          description: '',
          cover_image: null,
          tag_ids: [],
          is_published: false,
        });
      }
    }
  }, [open, project, reset]);

  const handleFormSubmit = (data: ProjectFormData) => {
    onSubmit({
      ...data,
      cover_image: data.cover_image || undefined,
    });
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <ModalHeader>
          <ModalTitle>{isEditing ? 'Редактировать проект' : 'Новый проект'}</ModalTitle>
          <ModalDescription>
            {isEditing ? 'Измените данные проекта' : 'Заполните информацию о проекте'}
          </ModalDescription>
        </ModalHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Название *</Label>
            <Input
              id="title"
              placeholder="Название проекта"
              error={errors.title?.message}
              {...register('title')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              placeholder="Краткое описание проекта"
              error={errors.description?.message}
              {...register('description')}
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

          <div className="space-y-2">
            <Label>Теги</Label>
            <Controller
              name="tag_ids"
              control={control}
              render={({ field }) => (
                <TagsInput
                  value={field.value || []}
                  onChange={field.onChange}
                  tags={tags}
                  onCreateTag={onCreateTag}
                />
              )}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_published" className="cursor-pointer">
              Опубликован
            </Label>
            <Controller
              name="is_published"
              control={control}
              render={({ field }) => (
                <Switch
                  id="is_published"
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
