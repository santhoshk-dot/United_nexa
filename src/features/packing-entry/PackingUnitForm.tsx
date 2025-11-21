import { useState } from "react";
import type { PackingEntry } from "../../types";
import { Input } from "../../components/shared/Input";
import { Button } from "../../components/shared/Button";
import { X } from "lucide-react";
import { useData } from "../../hooks/useData";

interface PackingEntryFormProps {
  initialData?: PackingEntry;
  onClose: () => void;
  onSave: (entry: PackingEntry) => void;
}

export const PackingUnitForm = ({
  initialData,
  onClose,
  onSave,
}: PackingEntryFormProps) => {
  const { packingEntries } = useData();

  const [entry, setEntry] = useState({
    id: initialData?.id || "",
    packingName: initialData?.packingName || "",
    shortName: initialData?.shortName || "",
  });

  // Changed to object to track errors per field
  const [errors, setErrors] = useState({
    packingName: "",
    shortName: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Update value
    setEntry((prev) => ({ ...prev, [name]: value }));

    // --- IMMEDIATE VALIDATION ---
    if (name === "packingName") {
      const trimmedValue = value.trim();
      if (!trimmedValue) {
        setErrors(prev => ({ ...prev, packingName: "Packing name is required" }));
      } else {
        // Check for duplicates immediately
        const exists = packingEntries.some(
          (p) =>
            p.packingName.toLowerCase() === trimmedValue.toLowerCase() &&
            p.id !== initialData?.id
        );
        
        setErrors(prev => ({ 
          ...prev, 
          packingName: exists ? "Packing name already exists" : "" 
        }));
      }
    }

    if (name === "shortName") {
      setErrors(prev => ({ 
        ...prev, 
        shortName: value.trim() ? "" : "Short name is required" 
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Final check before saving
    const name = entry.packingName.trim();
    const short = entry.shortName.trim();
    let hasError = false;
    const newErrors = { packingName: "", shortName: "" };

    if (!name) {
      newErrors.packingName = "Packing name is required";
      hasError = true;
    } else {
       const exists = packingEntries.some(
        (p) =>
          p.packingName.toLowerCase() === name.toLowerCase() &&
          p.id !== initialData?.id
      );
      if (exists) {
        newErrors.packingName = "Packing name already exists";
        hasError = true;
      }
    }

    if (!short) {
      newErrors.shortName = "Short name is required";
      hasError = true;
    }

    setErrors(newErrors);

    if (hasError) return;

    // If OK, save
    const savedEntry: PackingEntry = {
      ...entry,
      id: initialData?.id || `PCK-${Date.now()}`,
      packingName: name,
      shortName: short,
    };

    onSave(savedEntry);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-96 max-w-2xl bg-background rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-muted">
          <h2 className="text-xl font-semibold text-foreground">
            {initialData ? "Edit Packing Entry" : "Create New Packing Entry"}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
            
            {/* Packing Name */}
            <div>
              <Input
                label="Packing Name"
                id="packingName"
                name="packingName"
                value={entry.packingName}
                onChange={handleChange}
                required
                className={errors.packingName ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
              />
              {errors.packingName && (
                <p className="text-sm text-red-600 mt-1 animate-in fade-in slide-in-from-top-1">
                  {errors.packingName}
                </p>
              )}
            </div>

            {/* Short Name */}
            <div>
              <Input
                label="Short Name"
                id="shortName"
                name="shortName"
                value={entry.shortName}
                onChange={handleChange}
                required
                className={errors.shortName ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
              />
              {errors.shortName && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.shortName}
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-muted">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary"
              disabled={!!errors.packingName || !!errors.shortName} // Disable save if errors exist
            >
              Save Packing Entry
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
};