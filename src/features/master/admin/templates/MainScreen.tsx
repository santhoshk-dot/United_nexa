import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useDataContext } from "../../../../contexts/DataContext";
import { GcPrintTemplate } from "./GcPrintTemplate";
import { ClipboardList, FileText, Archive, Truck, Check, RotateCcw, X, ChevronDown } from "lucide-react";
import { LoadingSheetTemplate } from "./LoadingSheetTemplate";
import { StockReportTemplate } from "./StockReportTemplate";
import { TripSheetReportTemplate } from "./TripSheetReportTemplate";
import TripSheetPrintTemplate from "./TripSheetPrintTemplate";
import { ConfirmationDialog } from "../../../../components/shared/ConfirmationDialog";

// --- Button Component (Theme-aware) ---
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'default', children, ...props }, ref) => {
    const baseStyle = `
      flex justify-center items-center rounded-[var(--radius)] text-sm font-medium 
      focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background
      disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap 
      transition-all duration-200 ease-out
    `;
    
    const variantStyles = {
      primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      outline: 'border border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground',
      ghost: 'text-foreground hover:bg-accent hover:text-accent-foreground',
    };

    const sizeStyles = {
      default: "h-10 py-2 px-4",
      sm: "h-9 px-3",
      lg: "h-11 px-8",
    };

    return (
      <button
        type="button"
        ref={ref}
        className={`${baseStyle} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

type View = 'GC_ENTRY' | 'LOADING_SHEET' | 'PENDING_STOCK' | 'TRIPSHEET_REPORT' | 'TRIPSHEET_PRINT';

const MainScreen: React.FC = () => {
  const { printSettings, updatePrintSettings } = useDataContext(); 
  const [activeView, setActiveView] = useState<View>('GC_ENTRY');
  const [hasChanges, setHasChanges] = useState(false);

  const saveHandlerRef = useRef<(() => void) | null>(null);
  const resetHandlerRef = useRef<(() => void) | null>(null);
  const undoHandlerRef = useRef<(() => void) | null>(null);

  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);

  // Define View Options for Dropdown (Mobile/Tablet)
  const VIEW_OPTIONS: { value: View; label: string; shortLabel: string }[] = [
    { value: 'GC_ENTRY', label: 'GC Entry', shortLabel: 'GC' },
    { value: 'LOADING_SHEET', label: 'Loading Sheet', shortLabel: 'Loading' },
    { value: 'TRIPSHEET_PRINT', label: 'Tripsheet Print', shortLabel: 'TS Print' },
    { value: 'TRIPSHEET_REPORT', label: 'Tripsheet Report', shortLabel: 'TS Report' },
    { value: 'PENDING_STOCK', label: 'Pending Stock Report', shortLabel: 'Stock Report' },
  ];

  useEffect(() => {
    setHasChanges(false);
    saveHandlerRef.current = null;
    resetHandlerRef.current = null;
    undoHandlerRef.current = null;
  }, [activeView]);

  const handleTemplateEdit = useCallback((
      changes: boolean,
      save: () => void,
      reset: () => void,
      undo: () => void
  ) => {
      saveHandlerRef.current = save;
      resetHandlerRef.current = reset;
      undoHandlerRef.current = undo;

      setHasChanges((prev) => {
          if (prev !== changes) return changes;
          return prev;
      });
  }, []);

  const handleSaveConfirm = useCallback(() => {
      if (saveHandlerRef.current) {
          saveHandlerRef.current();
      }
      setIsSaveConfirmOpen(false);
  }, []);

  const handleSave = useCallback(() => {
      setIsSaveConfirmOpen(true);
  }, []);

  const handleDiscardConfirm = useCallback(() => {
      if (resetHandlerRef.current) {
          resetHandlerRef.current();
      }
      setIsDiscardConfirmOpen(false);
  }, []);

  const handleReset = useCallback(() => {
      setIsDiscardConfirmOpen(true);
  }, []);

  const handleUndo = useCallback(() => {
      if (undoHandlerRef.current) {
          undoHandlerRef.current();
      }
  }, []);

  const isEditableView = useMemo(() => {
      return activeView === 'LOADING_SHEET' || activeView === 'TRIPSHEET_REPORT' || activeView === 'PENDING_STOCK' || activeView === 'TRIPSHEET_PRINT' || activeView === 'GC_ENTRY';
  }, [activeView]);

  const renderContent = () => {
    switch (activeView) {
      case 'GC_ENTRY':
        return (
            <GcPrintTemplate 
                initialData={printSettings.gc} 
                onSave={(data) => updatePrintSettings({ ...printSettings, gc: data })} 
                onEdit={handleTemplateEdit}
            />
        );
      case 'LOADING_SHEET':
        return (
            <LoadingSheetTemplate 
                initialData={printSettings.loadingSheet}
                onSave={(data) => updatePrintSettings({ ...printSettings, loadingSheet: data })}
                onEdit={handleTemplateEdit} 
            />
        );
      case 'PENDING_STOCK':
        return (
            <StockReportTemplate 
                initialData={printSettings.stockReport}
                onSave={(data) => updatePrintSettings({ ...printSettings, stockReport: data })}
                onEdit={handleTemplateEdit}
            />
        );
      case 'TRIPSHEET_REPORT':
        return (
            <TripSheetReportTemplate 
                initialData={printSettings.tripReport}
                onSave={(data) => updatePrintSettings({ ...printSettings, tripReport: data })}
                onEdit={handleTemplateEdit}
            />
        );
      case 'TRIPSHEET_PRINT':
        return (
            <TripSheetPrintTemplate 
                initialData={printSettings.tripSheet}
                onSave={(data) => updatePrintSettings({ ...printSettings, tripSheet: data })}
                onEdit={handleTemplateEdit}
            />
        );
      default:
        return <div className="text-muted-foreground">Select a module.</div>;
    }
  };

  const getIcon = (view: View) => {
    switch (view) {
      case 'GC_ENTRY': return FileText;
      case 'LOADING_SHEET': return ClipboardList;
      case 'PENDING_STOCK': return Archive;
      case 'TRIPSHEET_REPORT': return FileText;
      case 'TRIPSHEET_PRINT': return Truck;
      default: return FileText;
    }
  };

  const TabButton: React.FC<{ view: View; label: string; shortLabel: string }> = ({ view, label, shortLabel }) => {
    const isActive = activeView === view;
    const Icon = getIcon(view);

    return (
      <button
        type="button"
        onClick={() => setActiveView(view)}
        className={`
          flex items-center gap-1.5 px-2.5 lg:px-3 xl:px-4 h-9
          rounded-[var(--radius)] text-xs lg:text-sm font-medium
          transition-all duration-200 ease-out
          focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background
          ${isActive 
            ? 'bg-primary text-primary-foreground shadow-sm glow-primary' 
            : 'bg-secondary/50 text-secondary-foreground hover:bg-secondary hover:text-foreground border border-border/50'
          }
        `}
      >
        <Icon className="w-3.5 h-3.5 lg:w-4 lg:h-4 shrink-0" />
        {/* Show short label on lg, full label on xl+ */}
        <span className="hidden lg:inline xl:hidden">{shortLabel}</span>
        <span className="hidden xl:inline">{label}</span>
      </button>
    );
  };

  return (
    <div className="p-2 sm:p-3 md:p-4 bg-background min-h-screen text-foreground transition-colors duration-300">
      {/* Header */}
      <header className="mb-3 sm:mb-4 rounded-[var(--radius)] p-2 sm:p-3 bg-card border border-border shadow-sm premium-shadow">
        
        {/* Row 1: Navigation (Dropdown on mobile/tablet, Tabs on desktop) */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 sm:gap-3">
          
          {/* === MOBILE & TABLET VIEW: SELECT DROPDOWN (< lg) === */}
          <div className="w-full lg:hidden">
            <div className="relative">
              <select
                value={activeView}
                onChange={(e) => setActiveView(e.target.value as View)}
                className="
                  w-full appearance-none 
                  bg-secondary text-foreground
                  border border-border
                  py-2 sm:py-2.5 px-3 sm:px-4 pr-10 
                  rounded-[var(--radius)] text-sm font-medium 
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background
                  shadow-sm transition-colors duration-200
                "
              >
                {VIEW_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-card text-foreground">
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 sm:px-3 text-muted-foreground">
                <ChevronDown size={16} />
              </div>
            </div>
          </div>

          {/* === DESKTOP VIEW: TAB BUTTONS (lg+) === */}
          <div className="hidden lg:flex flex-wrap gap-1.5 xl:gap-2">
            {VIEW_OPTIONS.map((opt) => (
              <TabButton 
                key={opt.value} 
                view={opt.value} 
                label={opt.label} 
                shortLabel={opt.shortLabel} 
              />
            ))}
          </div>

          {/* === ACTION BUTTONS === */}
          {isEditableView && (
            <div className="flex gap-1.5 sm:gap-2 shrink-0 w-full lg:w-auto">
              {/* Save Button */}
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave} 
                disabled={!hasChanges} 
                className={`
                  flex-1 lg:flex-none px-2 sm:px-3 text-xs sm:text-sm
                  ${hasChanges ? 'glow-primary' : ''}
                `}
              >
                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-0.5 sm:mr-1 shrink-0" />
                <span>Save</span>
              </Button>

              {/* Undo Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleUndo} 
                disabled={!hasChanges} 
                className="
                  flex-1 lg:flex-none px-2 sm:px-3 text-xs sm:text-sm
                  text-red-600 hover:bg-red-500/50 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:border-red-400
                "
              >
                <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-0.5 sm:mr-1 shrink-0" />
                Undo
              </Button>

              {/* Discard Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset} 
                disabled={!hasChanges} 
                className="
                  flex-1 lg:flex-none px-2 sm:px-3 text-xs sm:text-sm
                  text-red-600 hover:bg-red-500/50 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:border-red-400
                "
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-0.5 sm:mr-1 shrink-0" />
                <span className="inline">Discard</span>
                {/* <span className="sm:hidden">Del</span> */}
              </Button>
            </div>
          )}
        </div>
      </header>
      
      {/* Main Content */}
      <main className="mt-2 sm:mt-3 md:mt-4 lg:mt-6 overflow-x-auto">
        <div className="min-w-fit">
          {renderContent()}
        </div>
      </main>

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        open={isDiscardConfirmOpen}
        onClose={() => setIsDiscardConfirmOpen(false)}
        onConfirm={handleDiscardConfirm}
        title="Discard All Changes?"
        description="Are you sure you want to discard all your unsaved edits? This action cannot be undone."
        confirmText="Discard Changes"
        ConfirmIcon={X}
      />

      <ConfirmationDialog
        open={isSaveConfirmOpen}
        onClose={() => setIsSaveConfirmOpen(false)}
        onConfirm={handleSaveConfirm}
        title="Save Changes?"
        description="Are you sure you want to save all your changes?"
        confirmText="Save Changes"
        ConfirmIcon={Check}
        theme="primary"
      />
    </div>
  );
};

export default MainScreen;