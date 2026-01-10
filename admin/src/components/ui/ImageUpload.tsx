import { useState, useCallback, type DragEvent, type ChangeEvent } from 'react';
import { X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from './Button';
import { useUploadImage } from '@/hooks/useUpload';

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'auto';
}

export function ImageUpload({
  value,
  onChange,
  disabled = false,
  className,
  aspectRatio = 'auto',
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const uploadMutation = useUploadImage();

  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    auto: 'min-h-[200px]',
  };

  const handleFile = useCallback(
    async (file: File) => {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        return;
      }

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
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled || uploadMutation.isPending) return;

      const files = e.dataTransfer.files;
      if (files.length > 0 && files[0]) {
        handleFile(files[0]);
      }
    },
    [disabled, uploadMutation.isPending, handleFile]
  );

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0 && files[0]) {
        handleFile(files[0]);
      }
      // Reset input to allow selecting the same file
      e.target.value = '';
    },
    [handleFile]
  );

  const handleRemove = useCallback(() => {
    onChange(null);
  }, [onChange]);

  const isLoading = uploadMutation.isPending;

  return (
    <div className={className}>
      {value ? (
        <div className={cn('relative rounded-lg overflow-hidden border', aspectClasses[aspectRatio])}>
          <img
            src={value}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors group">
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleRemove}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors',
            aspectClasses[aspectRatio],
            isDragging
              ? 'border-primary bg-primary-light/20'
              : 'border-gray-300 hover:border-gray-400',
            (disabled || isLoading) && 'cursor-not-allowed opacity-50'
          )}
        >
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleInputChange}
            disabled={disabled || isLoading}
            className="absolute inset-0 cursor-pointer opacity-0"
          />

          {isLoading ? (
            <>
              <Loader2 className="mb-2 h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-gray-600">Загрузка...</p>
            </>
          ) : (
            <>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <ImageIcon className="h-6 w-6 text-gray-400" />
              </div>
              <p className="mb-1 text-sm font-medium text-gray-700">
                Перетащите или <span className="text-primary">выберите</span>
              </p>
              <p className="text-xs text-gray-500">
                JPG, PNG, WebP • до 5 MB
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
