import { useState, useRef } from "react";
import type { ContentEntry } from "../../types";
import { Input } from "../../components/shared/Input";
import { Button } from "../../components/shared/Button";
import { X } from "lucide-react";
import { useData } from "../../hooks/useData";
// 泙 NEW: Imports
import { contentSchema } from "../../schemas";
import { useToast } from "../../contexts/ToastContext";

interface ContentEntryFormProps {
  initialData?: ContentEntry;
  onClose: () => void;
  onSave: (entry: ContentEntry) => void;
}

const isValueValid = (value: any): boolean => {
    if (typeof value === 'string') {
        return value.trim().length > 0;
    }
    return !!value; 
};

const getValidationProp = (value: any) => ({
    hideRequiredIndicator: isValueValid(value)
});

export const ContentForm = ({
  initialData,
  onClose,
  onSave,
}: ContentEntryFormProps) => {
  const { contentEntries } = useData();
  const toast = useToast();

  const [entry, setEntry] = useState({
    id: initialData?.id || "",
    contentName: initialData?.contentName || "",
    shortName: initialData?.shortName || "",
  });

  // 泙 NEW: Validation State
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Manual duplicate check state
  const [dupErrors, setDupErrors] = useState({
    contentName: "",
  });

  // 泙 NEW: Ref for debouncing
  const validationTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // 泙 NEW: Field Validation Helper
  const validateField = (name: string, value: string) => {
    try {
      const fieldSchema = (contentSchema.shape as any)[name];
      if (fieldSchema) {
        const result = fieldSchema.safeParse(value);
        if (!result.success) {
          setFormErrors(prev => ({ ...prev, [name]: result.error.issues[0].message }));
        } else {
          setFormErrors(prev => {
            const next = { ...prev };
            delete next[name];
            return next;
          });
        }
      }
    } catch (e) {}
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    // 1. Update State
    setEntry((prev) => ({ ...prev, [name]: value }));
    
    // 2. Clear immediate errors
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
    if (name === "contentName" && dupErrors.contentName) {
        setDupErrors(prev => ({ ...prev, contentName: "" }));
    }

    // 3. Clear timeout
    if (validationTimeouts.current[name]) {
        clearTimeout(validationTimeouts.current[name]);
    }

    // 4. Delayed Validation
    validationTimeouts.current[name] = setTimeout(() => {
        // Run Zod Validation
        validateField(name, value);

        // Run Duplicate Check
        if (name === "contentName") {
            const trimmedValue = value.trim();
            const exists = contentEntries.some(
                (c) =>
                    c.contentName.toLowerCase() === trimmedValue.toLowerCase() &&
                    c.id !== initialData?.id
            );
            setDupErrors(prev => ({ 
                ...prev, 
                contentName: exists ? "Content name already exists" : "" 
            }));
        }
    }, 500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 泙 1. Check Duplicates
    if (dupErrors.contentName) {
        toast.error("Please resolve duplicate entries.");
        return;
    }

    // 泙 2. Validate against Zod Schema
    const validationResult = contentSchema.safeParse(entry);

    if (!validationResult.success) {
        const newErrors: Record<string, string> = {};
        validationResult.error.issues.forEach((err: any) => {
            if (err.path[0]) newErrors[err.path[0].toString()] = err.message;
        });
        setFormErrors(newErrors);
        toast.error("Please correct the errors in the form.");
        return;
    }

    // Final data
    const savedEntry: ContentEntry = {
      ...initialData,
      id: initialData?.id || `CNT-${Date.now()}`,
      contentName: entry.contentName.trim(),
      shortName: entry.shortName.trim(),
    };

    onSave(savedEntry);
  };

  return (
    <div className="fixed -top-6 left-0 right-0 bottom-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-96 max-w-2xl bg-background rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        
        <div className="flex items-center justify-between p-4 border-b border-muted">
          <h2 className="text-xl font-semibold text-foreground">
            {initialData ? "Edit Content Entry" : "Create New Content Entry"}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
            
            <div>
              <Input
                label="Content Name"
                id="contentName"
                name="contentName"
                value={entry.contentName}
                onChange={handleChange}
                required
                { ...getValidationProp(entry.contentName)}
                className={dupErrors.contentName ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
              />
              {dupErrors.contentName && (
                <p className="text-sm text-red-600 mt-1">{dupErrors.contentName}</p>
              )}
              {formErrors.contentName && !dupErrors.contentName && (
                <p className="text-sm text-red-600 mt-1">{formErrors.contentName}</p>
              )}
            </div>

            <div>
              <Input
                label="Short Name"
                id="shortName"
                name="shortName"
                value={entry.shortName}
                onChange={handleChange}
                required
                { ...getValidationProp(entry.shortName)}
              />
              {formErrors.shortName && (
                <p className="text-sm text-red-600 mt-1">{formErrors.shortName}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-muted">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>

            <Button 
              type="submit" 
              variant="primary"
            >
              Save Content Entry
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};