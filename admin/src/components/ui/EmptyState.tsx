import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '@/utils/cn';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12', className)}>
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
        {icon || <Inbox className="h-8 w-8 text-gray-400" />}
      </div>
      <h3 className="mb-1 text-lg font-medium text-gray-900">{title}</h3>
      {description && (
        <p className="mb-4 text-sm text-gray-500 text-center max-w-sm">{description}</p>
      )}
      {action}
    </div>
  );
}
