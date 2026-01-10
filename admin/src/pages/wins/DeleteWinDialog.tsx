import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui';

interface DeleteWinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  winName?: string;
  isLoading?: boolean;
}

export function DeleteWinDialog({
  open,
  onOpenChange,
  onConfirm,
  winName,
  isLoading = false,
}: DeleteWinDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Удалить победу?</AlertDialogTitle>
          <AlertDialogDescription>
            {winName ? (
              <>
                Вы уверены, что хотите удалить победу <strong>"{winName}"</strong>?
              </>
            ) : (
              'Вы уверены, что хотите удалить эту победу?'
            )}
            <br />
            Это действие нельзя отменить.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Отмена</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-accent-red hover:bg-red-600"
          >
            {isLoading ? 'Удаление...' : 'Удалить'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
