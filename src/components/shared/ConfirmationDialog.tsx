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
  children?: React.ReactNode;
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
  children,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      {/* Modal Panel */}
      <div className="relative w-full max-w-sm bg-card border border-border rounded-xl shadow-lg">
        {/* Modal Body */}
        <div className="p-5">
          <div className="flex flex-col items-center justify-center gap-4">
            {/* Icon */}
            <div className={`flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full ${iconContainerClass}`}>
              <AlertTriangle className={`h-5 w-5 ${iconClass}`} />
            </div>

            {/* Content */}
            <div className="flex-1 pt-0.5">
              <h3 className="text-base font-semibold text-foreground text-center">
                {title}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground text-center">
                {description}
              </p>
            </div>
          </div>
          <div>
            {children && (
              <div className="mt-4">
                {children}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-border bg-muted/30 rounded-b-xl">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant={effectiveVariant}
            size="sm"
            onClick={() => {
              onConfirm();
            }}
          >
            <ConfirmIcon className="w-4 h-4" />
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};