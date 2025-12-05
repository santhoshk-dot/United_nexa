import { Button } from './Button';
import { AlertTriangle, Trash2, type LucideIcon } from 'lucide-react';

interface ConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  ConfirmIcon?: LucideIcon;
  variant?: 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost';
  // Alias to support usage as 'theme' in MainScreen.tsx
  theme?: 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost'; 
}

export const ConfirmationDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm Delete",
  ConfirmIcon = Trash2,
  variant,
  theme,
}: ConfirmationDialogProps) => {
  if (!open) {
    return null;
  }

  // Determine effective variant (defaulting to 'destructive' to maintain backward compatibility)
  const effectiveVariant = variant || theme || 'destructive';

  // Dynamic styles for the icon container based on variant
  const iconContainerClass = effectiveVariant === 'destructive' 
    ? 'bg-destructive/10' 
    : 'bg-primary/10';
    
  const iconClass = effectiveVariant === 'destructive'
    ? 'text-destructive'
    : 'text-primary';

  return (
    // Modal Backdrop
    <div className="fixed -top-6 left-0 right-0 bottom-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      {/* Modal Panel */}
      <div className="relative w-full max-w-md bg-background rounded-lg shadow-xl">
        {/* Modal Body */}
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${iconContainerClass} sm:h-10 sm:w-10`}>
              <AlertTriangle className={`h-6 w-6 ${iconClass}`} />
            </div>
            <div className="mt-0 flex-1">
              <h3 className="text-lg font-semibold leading-6 text-foreground">
                {title}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-muted-foreground">
                  {description}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Modal Footer (Actions) */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 p-4 rounded-b-lg">
          <Button type="button" variant="secondary" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button
            type="button"
            variant={effectiveVariant}
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="w-full sm:w-auto"
          >
            <ConfirmIcon className="size-4 mr-2" />
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};