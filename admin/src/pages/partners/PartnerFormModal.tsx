import { useEffect, useState, useCallback, type DragEvent, type ChangeEvent } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload, X, Loader2 } from 'lucide-react';
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
} from '@/components/ui';
import { useUploadSvg } from '@/hooks/useUpload';
import { cn } from '@/utils/cn';
import type { Partner } from '@/types';

const partnerSchema = z.object({
  name: z.string().min(1, 'Введите название'),
  logo_svg: z.string().optional().nullable(),
  website: z.string().url('Некорректная ссылка').optional().or(z.literal('')),
  is_visible: z.boolean().optional(),
});

export type PartnerFormData = z.infer<typeof partnerSchema>;

interface PartnerFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PartnerFormData) => void;
  isLoading?: boolean;
  partner?: Partner | null;
}

export function PartnerFormModal({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
  partner,
}: PartnerFormModalProps) {
  const isEditing = !!partner;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<PartnerFormData>({
    resolver: zodResolver(partnerSchema),
    defaultValues: {
      name: '',
      logo_svg: null,
      website: '',
      is_visible: true,
    },
  });

  useEffect(() => {
    if (open) {
      if (partner) {
        reset({
          name: partner.name,
          logo_svg: partner.logo_svg,
          website: partner.website || '',
          is_visible: partner.is_visible,
        });
      } else {
        reset({
          name: '',
          logo_svg: null,
          website: '',
          is_visible: true,
        });
      }
    }
  }, [open, partner, reset]);

  const handleFormSubmit = (data: PartnerFormData) => {
    onSubmit({
      ...data,
      logo_svg: data.logo_svg || undefined,
      website: data.website || undefined,
    });
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-lg">
        <ModalHeader>
          <ModalTitle>{isEditing ? 'Редактировать партнёра' : 'Новый партнёр'}</ModalTitle>
          <ModalDescription>
            {isEditing ? 'Измените данные партнёра' : 'Добавьте нового партнёра'}
          </ModalDescription>
        </ModalHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Название *</Label>
            <Input
              id="name"
              placeholder="Название компании"
              error={errors.name?.message}
              {...register('name')}
            />
          </div>

          <div className="space-y-2">
            <Label>Логотип (SVG)</Label>
            <Controller
              name="logo_svg"
              control={control}
              render={({ field }) => (
                <SvgUpload value={field.value} onChange={field.onChange} />
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Сайт</Label>
            <Input
              id="website"
              type="url"
              placeholder="https://company.com"
              error={errors.website?.message}
              {...register('website')}
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

interface SvgUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
}

function SvgUpload({ value, onChange }: SvgUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const uploadMutation = useUploadSvg();

  const handleFile = useCallback(
    async (file: File) => {
      if (file.type !== 'image/svg+xml') return;
      if (file.size > 1024 * 1024) return; // 1MB

      try {
        const result = await uploadMutation.mutateAsync(file);
        onChange(result.url);
      } catch {
        // Error handled in mutation
      }
    },
    [uploadMutation, onChange]
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const files = e.dataTransfer.files;
      if (files.length > 0 && files[0]) handleFile(files[0]);
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0 && files[0]) handleFile(files[0]);
      e.target.value = '';
    },
    [handleFile]
  );

  const isLoading = uploadMutation.isPending;

  return (
    <div>
      {value ? (
        <div className="relative rounded-lg border p-4 bg-gray-50">
          <img
            src={value}
            alt="Logo preview"
            className="max-h-20 mx-auto"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6"
            onClick={() => onChange(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors',
            isDragging ? 'border-primary bg-primary-light/20' : 'border-gray-300',
            isLoading && 'opacity-50'
          )}
        >
          <input
            type="file"
            accept=".svg,image/svg+xml"
            onChange={handleInputChange}
            disabled={isLoading}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
          {isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : (
            <>
              <Upload className="h-6 w-6 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">
                Перетащите SVG или <span className="text-primary">выберите</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">До 1 MB</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
