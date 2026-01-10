import { useCallback, useState, type DragEvent, type ChangeEvent } from 'react';
import { Upload, File, X, AlertCircle } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from './Button';

interface FileUploadProps {
  accept?: string;
  maxSize?: number; // in bytes
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  className?: string;
}

export function FileUpload({
  accept,
  maxSize = 5 * 1024 * 1024, // 5MB default
  onFileSelect,
  disabled = false,
  className,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback(
    (file: File): string | null => {
      if (accept) {
        const acceptedTypes = accept.split(',').map((t) => t.trim());
        const fileType = file.type;
        const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();

        const isValidType = acceptedTypes.some(
          (type) =>
            type === fileType ||
            type === fileExt ||
            (type.endsWith('/*') && fileType.startsWith(type.replace('/*', '/')))
        );

        if (!isValidType) {
          return `Неподдерживаемый тип файла. Разрешены: ${accept}`;
        }
      }

      if (file.size > maxSize) {
        const maxSizeMB = (maxSize / 1024 / 1024).toFixed(1);
        return `Файл слишком большой. Максимум: ${maxSizeMB} MB`;
      }

      return null;
    },
    [accept, maxSize]
  );

  const handleFile = useCallback(
    (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        setSelectedFile(null);
        return;
      }

      setError(null);
      setSelectedFile(file);
      onFileSelect(file);
    },
    [validateFile, onFileSelect]
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

      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFile(files[0]!);
      }
    },
    [disabled, handleFile]
  );

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFile(files[0]!);
      }
    },
    [handleFile]
  );

  const handleRemove = useCallback(() => {
    setSelectedFile(null);
    setError(null);
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  };

  return (
    <div className={className}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors',
          isDragging
            ? 'border-primary bg-primary-light/20'
            : 'border-gray-300 hover:border-gray-400',
          disabled && 'cursor-not-allowed opacity-50',
          error && 'border-accent-red'
        )}
      >
        <input
          type="file"
          accept={accept}
          onChange={handleInputChange}
          disabled={disabled}
          className="absolute inset-0 cursor-pointer opacity-0"
        />

        {selectedFile ? (
          <div className="flex items-center gap-3">
            <File className="h-8 w-8 text-primary" />
            <div>
              <p className="font-medium text-gray-900">{selectedFile.name}</p>
              <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleRemove}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            <Upload className="mb-3 h-10 w-10 text-gray-400" />
            <p className="mb-1 text-sm font-medium text-gray-700">
              Перетащите файл сюда или{' '}
              <span className="text-primary">выберите</span>
            </p>
            <p className="text-xs text-gray-500">
              {accept ? `Форматы: ${accept}` : 'Любой файл'} • Макс.{' '}
              {(maxSize / 1024 / 1024).toFixed(0)} MB
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="mt-2 flex items-center gap-2 text-sm text-accent-red">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
    </div>
  );
}
