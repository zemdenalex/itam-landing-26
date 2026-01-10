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
} from '@/components/ui';
import type { Win } from '@/types';

const winSchema = z.object({
  team_name: z.string().min(1, 'Введите название команды'),
  hackathon_name: z.string().min(1, 'Введите название хакатона'),
  result: z.string().min(1, 'Выберите результат'),
  prize: z.coerce.number().min(0, 'Призовой не может быть отрицательным').optional(),
  year: z.coerce.number().min(2000, 'Некорректный год').max(2100, 'Некорректный год'),
  award_date: z.string().optional(),
  link: z.string().url('Некорректная ссылка').optional().or(z.literal('')),
});

export type WinFormData = z.infer<typeof winSchema>;

interface WinFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: WinFormData) => void;
  isLoading?: boolean;
  win?: Win | null;
}

const resultOptions = [
  { value: '1 место', label: '1 место' },
  { value: '2 место', label: '2 место' },
  { value: '3 место', label: '3 место' },
  { value: 'Гран-при', label: 'Гран-при' },
  { value: 'Победитель', label: 'Победитель' },
  { value: 'Призёр', label: 'Призёр' },
  { value: 'Финалист', label: 'Финалист' },
  { value: 'Специальный приз', label: 'Специальный приз' },
];

export function WinFormModal({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
  win,
}: WinFormModalProps) {
  const isEditing = !!win;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<WinFormData>({
    resolver: zodResolver(winSchema),
    defaultValues: {
      team_name: '',
      hackathon_name: '',
      result: '',
      prize: 0,
      year: new Date().getFullYear(),
      award_date: '',
      link: '',
    },
  });

  useEffect(() => {
    if (open) {
      if (win) {
        reset({
          team_name: win.team_name,
          hackathon_name: win.hackathon_name,
          result: win.result,
          prize: win.prize || 0,
          year: win.year,
          award_date: win.award_date?.split('T')[0] || '',
          link: win.link || '',
        });
      } else {
        reset({
          team_name: '',
          hackathon_name: '',
          result: '',
          prize: 0,
          year: new Date().getFullYear(),
          award_date: '',
          link: '',
        });
      }
    }
  }, [open, win, reset]);

  const handleFormSubmit = (data: WinFormData) => {
    // Clean up empty strings
    const cleanData = {
      ...data,
      link: data.link || undefined,
      award_date: data.award_date || undefined,
      prize: data.prize || 0,
    };
    onSubmit(cleanData);
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-lg">
        <ModalHeader>
          <ModalTitle>{isEditing ? 'Редактировать победу' : 'Добавить победу'}</ModalTitle>
          <ModalDescription>
            {isEditing
              ? 'Измените данные о победе на хакатоне'
              : 'Заполните информацию о новой победе'}
          </ModalDescription>
        </ModalHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="team_name">Команда *</Label>
              <Input
                id="team_name"
                placeholder="MISIS GO"
                error={errors.team_name?.message}
                {...register('team_name')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hackathon_name">Хакатон *</Label>
              <Input
                id="hackathon_name"
                placeholder="TulaHackDays"
                error={errors.hackathon_name?.message}
                {...register('hackathon_name')}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="result">Результат *</Label>
              <Controller
                name="result"
                control={control}
                render={({ field }) => (
                  <Select
                    id="result"
                    options={resultOptions}
                    placeholder="Выберите результат"
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.result?.message}
                  />
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prize">Призовой (₽)</Label>
              <Input
                id="prize"
                type="number"
                placeholder="100000"
                error={errors.prize?.message}
                {...register('prize')}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="year">Год *</Label>
              <Input
                id="year"
                type="number"
                placeholder="2025"
                error={errors.year?.message}
                {...register('year')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="award_date">Дата награждения</Label>
              <Input
                id="award_date"
                type="date"
                error={errors.award_date?.message}
                {...register('award_date')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="link">Ссылка</Label>
            <Input
              id="link"
              type="url"
              placeholder="https://t.me/itatmisis/1556"
              error={errors.link?.message}
              {...register('link')}
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
