import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <Loader2 className={cn('animate-spin text-primary', sizes[size], className)} />
  );
}

interface LoadingProps {
  text?: string;
  className?: string;
}

export function Loading({ text = 'Загрузка...', className }: LoadingProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12', className)}>
      <Spinner size="lg" />
      <p className="mt-3 text-sm text-gray-500">{text}</p>
    </div>
  );
}
