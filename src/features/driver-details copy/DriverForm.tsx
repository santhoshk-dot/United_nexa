import { useState, useRef } from "react";
import type { DriverEntry } from "../../types";
import { Input } from "../../components/shared/Input";
import { Button } from "../../components/shared/Button";
import { X } from "lucide-react";
import { useData } from "../../hooks/useData";
// 泙 NEW: Imports
import { driverSchema } from "../../schemas";
import { useToast } from "../../contexts/ToastContext";

interface DriverFormProps {
  initialData?: DriverEntry;
  onClose: () => void;
  onSave: (entry: DriverEntry) => void;
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

export const DriverForm = ({
  initialData,
  onClose,
  onSave,
}: DriverFormProps) => {
  const { driverEntries } = useData();
  const toast = useToast();

  // 泙 NEW: Validation State
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Manual duplicate checking state
  const [dupErrors, setDupErrors] = useState({
      driverName: "",
      dlNo: "",
      mobile: ""
  });

  const [entry, setEntry] = useState({
    id: initialData?.id || "",
    driverName: initialData?.driverName || "",
    dlNo: initialData?.dlNo || "",
    mobile: initialData?.mobile || "",
  });

  // 泙 NEW: Ref for debouncing
  const validationTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});


  // 泙 NEW: Field Validation Helper
  const validateField = (name: string, value: string) => {
    try {
      const fieldSchema = (driverSchema.shape as any)[name];
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const trimmed = value.trim();

    // 1. Update State
    setEntry((prev) => ({ ...prev, [name]: value }));
    
    // 2. Clear immediate error UI
    if (formErrors[name]) {
        setFormErrors(prev => {
            const next = { ...prev };
            delete next[name];
            return next;
        });
    }
    // Clear dup error for this field
    if (dupErrors[name as keyof typeof dupErrors]) {
        setDupErrors(prev => ({ ...prev, [name]: "" }));
    }

    // 3. Clear Timeout
    if (validationTimeouts.current[name]) {
        clearTimeout(validationTimeouts.current[name]);
    }

    // 4. Set Delayed Validation
    validationTimeouts.current[name] = setTimeout(() => {
        // Run Zod
        validateField(name, value);

        // Run Duplicate Checks
        if (name === "driverName") {
            const exists = driverEntries.some(
                (d) => d.driverName.toLowerCase() === trimmed.toLowerCase() && d.id !== initialData?.id
            );
            setDupErrors(prev => ({ ...prev, driverName: exists ? "Driver name already exists" : "" }));
        }

        if (name === "dlNo") {
            const exists = driverEntries.some(
                (d) => d.dlNo.toLowerCase() === trimmed.toLowerCase() && d.id !== initialData?.id
            );
            setDupErrors(prev => ({ ...prev, dlNo: exists ? "DL number already exists" : "" }));
        }

        if (name === "mobile") {
            const exists = driverEntries.some(
                (d) => d.mobile === trimmed && d.id !== initialData?.id
            );
            setDupErrors(prev => ({ ...prev, mobile: exists ? "Mobile number already exists" : "" }));
        }
    }, 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 泙 1. Check Duplicates
    if (dupErrors.driverName || dupErrors.dlNo || dupErrors.mobile) {
        toast.error("Please resolve duplicate entries.");
        return;
    }

    // 泙 2. Zod Validation
    const validationResult = driverSchema.safeParse(entry);

    if (!validationResult.success) {
        const newErrors: Record<string, string> = {};
        validationResult.error.issues.forEach((err: any) => {
            if (err.path[0]) newErrors[err.path[0].toString()] = err.message;
        });
        setFormErrors(newErrors);
        toast.error("Please correct the errors in the form.");
        return;
    }

    const savedEntry: DriverEntry = {
      ...entry,
      id: initialData?.id || `DRV-${Date.now()}`,
      driverName: entry.driverName.trim(),
      dlNo: entry.dlNo.trim(),
      mobile: entry.mobile.trim(),
    };

    onSave(savedEntry);
  };

  return (
    <div className="fixed -top-6 left-0 right-0 bottom-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-96 max-w-2xl bg-background rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between p-4 border-b border-muted">
          <h2 className="text-xl font-semibold text-foreground">
            {initialData ? "Edit Driver" : "Add Driver"}
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

            {/* Driver Name */}
            <div>
              <Input
                label="Driver Name"
                id="driverName"
                name="driverName"
                value={entry.driverName}
                onChange={handleChange}
                className={dupErrors.driverName ? "border-red-500" : ""}
                required { ...getValidationProp(entry.driverName)}
              />
              {dupErrors.driverName && <p className="text-sm text-red-600 mt-1">{dupErrors.driverName}</p>}
              {formErrors.driverName && !dupErrors.driverName && <p className="text-sm text-red-600 mt-1">{formErrors.driverName}</p>}
            </div>

            {/* DL No */}
            <div>
              <Input
                label="DL Number"
                id="dlNo"
                name="dlNo"
                value={entry.dlNo}
                onChange={handleChange}
                className={dupErrors.dlNo ? "border-red-500" : ""}
                required { ...getValidationProp(entry.dlNo)}
              />
              {dupErrors.dlNo && <p className="text-sm text-red-600 mt-1">{dupErrors.dlNo}</p>}
              {formErrors.dlNo && !dupErrors.dlNo && <p className="text-sm text-red-600 mt-1">{formErrors.dlNo}</p>}
            </div>

            {/* Mobile */}
            <div>
              <Input
                label="Mobile Number"
                id="mobile"
                name="mobile"
                value={entry.mobile}
                onChange={handleChange}
                className={dupErrors.mobile ? "border-red-500" : ""}
                required { ...getValidationProp(entry.mobile)}
              />
              {dupErrors.mobile && <p className="text-sm text-red-600 mt-1">{dupErrors.mobile}</p>}
              {formErrors.mobile && !dupErrors.mobile && <p className="text-sm text-red-600 mt-1">{formErrors.mobile}</p>}
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
              Save Driver
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};