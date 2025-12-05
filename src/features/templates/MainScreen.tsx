import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { GcPrintTemplate } from "./GcPrintTemplate";
import { ClipboardList, FileText, Archive, Truck, Check, RotateCcw, X } from "lucide-react";
import { LoadingSheetTemplate } from "./LoadingSheetTemplate";
import { StockReportTemplate } from "./StockReportTemplate";
import { TripSheetReportTemplate } from "./TripSheetReportTemplate";
import TripSheetPrintTemplate from "./TripSheetPrintTemplate";
import { ConfirmationDialog } from "../../components/shared/ConfirmationDialog";

// --- Button Component (Preserved from original) ---
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'default', children, ...props }, ref) => {
    const baseStyle = "flex justify-center items-center rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap";
   
    const variantStyles = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
      secondary: 'bg-gray-400 text-gray-800 hover:bg-gray-500 focus:ring-gray-400',
      destructive: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
      outline: 'border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 focus:ring-blue-500',
      ghost: 'hover:bg-gray-200 text-gray-700 focus:ring-blue-500',
    };

    const sizeStyles = {
      default: "h-10 py-2 px-4",
      sm: "h-9 rounded-md px-3",
      lg: "h-11 rounded-md px-8",
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
// ------------------------------------

type View = 'GC_ENTRY' | 'LOADING_SHEET' | 'PENDING_STOCK' | 'TRIPSHEET_REPORT' | 'TRIPSHEET_PRINT';

const MainScreen: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('GC_ENTRY');
  const [hasChanges, setHasChanges] = useState(false);

  // 🟢 FIX: Use Refs instead of State for handlers to prevent infinite re-render loops
  const saveHandlerRef = useRef<(() => void) | null>(null);
  const resetHandlerRef = useRef<(() => void) | null>(null);
  const undoHandlerRef = useRef<(() => void) | null>(null);

  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);

  // Reset state when view changes to prevent stale data
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
      // Update refs immediately (does not trigger re-render)
      saveHandlerRef.current = save;
      resetHandlerRef.current = reset;
      undoHandlerRef.current = undo;

      // Only update state if the boolean value actually changes
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
      return activeView === 'LOADING_SHEET' || activeView === 'TRIPSHEET_REPORT' ||  activeView === 'PENDING_STOCK' ||  activeView === 'TRIPSHEET_PRINT' ||  activeView === 'GC_ENTRY';
  }, [activeView]);

  const renderContent = () => {
    switch (activeView) {
      case 'GC_ENTRY':
        return <GcPrintTemplate onEdit={handleTemplateEdit}/>;
      case 'LOADING_SHEET':
        return <LoadingSheetTemplate onEdit={handleTemplateEdit} />;
      case 'PENDING_STOCK':
        return <StockReportTemplate onEdit={handleTemplateEdit}/>;
      case 'TRIPSHEET_REPORT':
        return <TripSheetReportTemplate onEdit={handleTemplateEdit}/>;
      case 'TRIPSHEET_PRINT':
        return <TripSheetPrintTemplate onEdit={handleTemplateEdit}/>;
      default:
        return <div>Select a module.</div>;
    }
  };

  const TabButton: React.FC<{ view: View, label: string }> = ({ view, label }) => {
    const buttonVariant = activeView === view ? 'primary' : 'outline';

    const Icon = view === 'GC_ENTRY' ? FileText : (
        view === 'LOADING_SHEET' ? ClipboardList : (
            view === 'PENDING_STOCK' ? Archive : (
                view === 'TRIPSHEET_REPORT' ? FileText : Truck
            )
        )
    );

    return (
      <Button
        variant={buttonVariant}
        onClick={() => setActiveView(view)}
        className="shadow-sm flex gap-1"
      >
        <Icon className="w-4 h-4" />
        {label}
      </Button>
    );
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <header className="mb-4 rounded-lg p-2 flex flex-col md:flex-row justify-between items-center border-b border-gray-300 gap-4">
       
        {/* RIGHT SIDE: Navigation Tabs */}
        <div className="flex space-x-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          <TabButton view="GC_ENTRY" label="GC Entry" />
          <TabButton view="LOADING_SHEET" label="Loading Sheet" />
          <TabButton view="TRIPSHEET_PRINT" label="Tripsheet Print" />
          <TabButton view="TRIPSHEET_REPORT" label="Tripsheet Report" />
          <TabButton view="PENDING_STOCK" label="Pending Stock Report" />
        </div>

        <div className="flex space-x-2 shrink-0">
            {isEditableView && (
                <>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={handleSave} 
                        disabled={!hasChanges} 
                        className="transition-opacity"
                    >
                        <Check className="w-4 h-4 mr-1" />
                        Save
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleUndo} 
                        disabled={!hasChanges} 
                        className="text-red-600 hover:bg-red-50 transition-opacity"
                    >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Undo
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleReset} 
                        disabled={!hasChanges} 
                        className="text-red-600 hover:bg-red-50 transition-opacity"
                    >
                        <X className="w-4 h-4 mr-1" />
                        Discard
                    </Button>
                </>
            )}
        </div>

      </header>
     
      <main className="mt-6">
        {renderContent()}
      </main>

      {/* Confirmation Dialog Components */}
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