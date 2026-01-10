import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary-light text-primary',
        success: 'bg-green-100 text-green-800',
        warning: 'bg-orange-100 text-orange-800',
        error: 'bg-red-100 text-red-800',
        gray: 'bg-gray-100 text-gray-800',
        purple: 'bg-purple-100 text-purple-800',
        outline: 'border border-gray-300 text-gray-600 bg-white',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

// Helper для результатов хакатонов
export function getResultBadgeVariant(result: string): BadgeProps['variant'] {
  const lowerResult = result.toLowerCase();
  if (lowerResult.includes('1') || lowerResult.includes('первое') || lowerResult.includes('гран-при')) {
    return 'success';
  }
  if (lowerResult.includes('2') || lowerResult.includes('второе')) {
    return 'default';
  }
  if (lowerResult.includes('3') || lowerResult.includes('третье')) {
    return 'purple';
  }
  return 'gray';
}
