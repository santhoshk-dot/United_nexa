import { useState, useRef } from "react";
import type { VehicleEntry } from "../../types";
import { Input } from "../../components/shared/Input";
import { Button } from "../../components/shared/Button";
import { X } from "lucide-react";
import { useData } from "../../hooks/useData";
// 泙 NEW: Imports
import { vehicleSchema } from "../../schemas";
import { useToast } from "../../contexts/ToastContext";

interface VehicleFormProps {
  initialData?: VehicleEntry;
  onClose: () => void;
  onSave: (entry: VehicleEntry) => void;
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

export const VehicleForm = ({
  initialData,
  onClose,
  onSave,
}: VehicleFormProps) => {
  const { vehicleEntries } = useData();
  const toast = useToast();

  // 泙 NEW: Validation State
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [entry, setEntry] = useState({
    id: initialData?.id || "",
    vehicleNo: initialData?.vehicleNo || "",
    vehicleName: initialData?.vehicleName || "",
    ownerName: initialData?.ownerName || "",
    ownerMobile: initialData?.ownerMobile || "",
  });

  // Manual checks state
  const [manualErrors, setManualErrors] = useState({
    vehicleNo: "",
  });

  // 泙 NEW: Ref to store active timeouts for each field
 const validationTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});


  // 泙 NEW: Field Validation Helper
  const validateField = (name: string, value: string) => {
    try {
      // Cast to any to access shape dynamically
      const fieldSchema = (vehicleSchema.shape as any)[name];
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
    } catch (e) {
      // Ignore schema lookup errors
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // 1. Update State immediately so input is responsive
    setEntry((prev) => ({ ...prev, [name]: value }));
    
    // 2. Clear existing errors immediately while typing
    if (formErrors[name]) {
        setFormErrors(prev => {
            const next = { ...prev };
            delete next[name];
            return next;
        });
    }
    // Clear duplicate error immediately if editing vehicleNo
    if (name === "vehicleNo" && manualErrors.vehicleNo) {
        setManualErrors(prev => ({ ...prev, vehicleNo: "" }));
    }

    // 3. Clear existing timeout for this field
    if (validationTimeouts.current[name]) {
        clearTimeout(validationTimeouts.current[name]);
    }

    // 4. Set new timeout for delayed validation (500ms)
    validationTimeouts.current[name] = setTimeout(() => {
        // Run Schema Validation
        validateField(name, value);

        // Run Duplicate Check Logic
        if (name === "vehicleNo") {
            const trimmed = value.trim();
            const exists = vehicleEntries.some(
                (v) =>
                v.vehicleNo.toLowerCase() === trimmed.toLowerCase() &&
                v.id !== initialData?.id
            );

            setManualErrors((prev) => ({
                ...prev,
                vehicleNo: exists ? "Vehicle number already exists" : "",
            }));
        }
    }, 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Final complete validation before save (immediate)
    const validationResult = vehicleSchema.safeParse(entry);

    if (!validationResult.success) {
        const newErrors: Record<string, string> = {};
        validationResult.error.issues.forEach((err: any) => {
            if (err.path[0]) newErrors[err.path[0].toString()] = err.message;
        });
        setFormErrors(newErrors);
        toast.error("Please correct the errors in the form.");
        return;
    }

    // 泙 Check duplicates first
    if (manualErrors.vehicleNo) {
        toast.error("Vehicle number already exists.");
        return;
    }

    const savedEntry: VehicleEntry = {
      ...entry,
      id: initialData?.id || `VEH-${Date.now()}`,
      vehicleNo: entry.vehicleNo.trim(),
      vehicleName: entry.vehicleName.trim(),
      ownerName: entry.ownerName.trim(),
      ownerMobile: entry.ownerMobile.trim(),
    };

    onSave(savedEntry);
  };

  return (
    <div className="fixed -top-6 left-0 right-0 bottom-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-96 max-w-2xl bg-background rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between p-4 border-b border-muted">
          <h2 className="text-xl font-semibold text-foreground">
            {initialData ? "Edit Vehicle" : "Add Vehicle"}
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
                label="Vehicle Number"
                id="vehicleNo"
                name="vehicleNo"
                value={entry.vehicleNo}
                onChange={handleChange}
                className={manualErrors.vehicleNo ? "border-red-500" : ""}
                required { ...getValidationProp(entry.vehicleNo)}
              />
              {/* Show either manual dup error or zod error */}
              {manualErrors.vehicleNo && (
                <p className="text-sm text-red-600 mt-1">{manualErrors.vehicleNo}</p>
              )}
              {formErrors.vehicleNo && !manualErrors.vehicleNo && (
                  <p className="text-sm text-red-600 mt-1">{formErrors.vehicleNo}</p>
              )}
            </div>

            <div>
              <Input
                label="Vehicle Name"
                id="vehicleName"
                name="vehicleName"
                value={entry.vehicleName}
                onChange={handleChange}
                required { ...getValidationProp(entry.vehicleName)}
              />
              {formErrors.vehicleName && <p className="text-sm text-red-600 mt-1">{formErrors.vehicleName}</p>}
            </div>

            <div>
              <Input
                label="Owner Name"
                id="ownerName"
                name="ownerName"
                value={entry.ownerName}
                onChange={handleChange}
                { ...getValidationProp(entry.ownerName)}
              />
              {formErrors.ownerName && <p className="text-sm text-red-600 mt-1">{formErrors.ownerName}</p>}
            </div>

            <div>
              <Input
                label="Owner Mobile"
                id="ownerMobile"
                name="ownerMobile"
                value={entry.ownerMobile}
                onChange={handleChange}
                { ...getValidationProp(entry.ownerMobile)}
              />
              {formErrors.ownerMobile && <p className="text-sm text-red-600 mt-1">{formErrors.ownerMobile}</p>}
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
              Save Vehicle
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
};