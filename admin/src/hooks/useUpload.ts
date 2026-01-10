import { useMutation } from '@tanstack/react-query';
import { uploadApi } from '@/api/upload';
import { useToast } from '@/components/ui';

export function useUploadImage() {
  const { error } = useToast();

  return useMutation({
    mutationFn: (file: File) => uploadApi.image(file),
    onError: (err) => {
      error('Ошибка загрузки', err instanceof Error ? err.message : 'Не удалось загрузить изображение');
    },
  });
}

export function useUploadSvg() {
  const { error } = useToast();

  return useMutation({
    mutationFn: (file: File) => uploadApi.svg(file),
    onError: (err) => {
      error('Ошибка загрузки', err instanceof Error ? err.message : 'Не удалось загрузить SVG');
    },
  });
}

export function useDeleteUpload() {
  const { error } = useToast();

  return useMutation({
    mutationFn: (filename: string) => uploadApi.delete(filename),
    onError: (err) => {
      error('Ошибка удаления', err instanceof Error ? err.message : 'Не удалось удалить файл');
    },
  });
}
