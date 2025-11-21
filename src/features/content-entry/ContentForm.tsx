import { useState } from "react";
import type { ContentEntry } from "../../types";
import { Input } from "../../components/shared/Input";
import { Button } from "../../components/shared/Button";
import { X } from "lucide-react";
import { useData } from "../../hooks/useData";

interface ContentEntryFormProps {
  initialData?: ContentEntry;
  onClose: () => void;
  onSave: (entry: ContentEntry) => void;
}

export const ContentForm = ({
  initialData,
  onClose,
  onSave,
}: ContentEntryFormProps) => {
  const { contentEntries } = useData();

  const [entry, setEntry] = useState({
    id: initialData?.id || "",
    contentName: initialData?.contentName || "",
    shortName: initialData?.shortName || "",
  });

  // Changed to object to track errors per field
  const [errors, setErrors] = useState({
    contentName: "",
    shortName: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEntry((prev) => ({ ...prev, [name]: value }));

    // --- IMMEDIATE VALIDATION ---
    if (name === "contentName") {
      const trimmedValue = value.trim();
      if (!trimmedValue) {
        setErrors(prev => ({ ...prev, contentName: "Content name is required" }));
      } else {
        const exists = contentEntries.some(
          (c) =>
            c.contentName.toLowerCase() === trimmedValue.toLowerCase() &&
            c.id !== initialData?.id
        );
        setErrors(prev => ({ 
          ...prev, 
          contentName: exists ? "Content name already exists" : "" 
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

  // Persist to local storage logic (kept from your previous code)
  const persistToLocal = (saved: ContentEntry) => {
    try {
      const raw = localStorage.getItem("contentEntries");
      const existing: ContentEntry[] = raw ? JSON.parse(raw) : [];
      const index = existing.findIndex((c) => c.id === saved.id);
      if (index >= 0) {
        existing[index] = saved;
      } else {
        existing.push(saved);
      }
      localStorage.setItem("contentEntries", JSON.stringify(existing));
    } catch (err) {
      console.warn("Could not persist contentEntries to localStorage", err);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const name = entry.contentName.trim();
    const short = entry.shortName.trim();
    let hasError = false;
    const newErrors = { contentName: "", shortName: "" };

    if (!name) {
      newErrors.contentName = "Content name is required";
      hasError = true;
    } else {
      const exists = contentEntries.some(
        (c) =>
          c.contentName.toLowerCase() === name.toLowerCase() &&
          c.id !== initialData?.id
      );
      if (exists) {
        newErrors.contentName = "Content name already exists";
        hasError = true;
      }
    }

    if (!short) {
      newErrors.shortName = "Short name is required";
      hasError = true;
    }

    setErrors(newErrors);
    if (hasError) return;

    // Final data
    const savedEntry: ContentEntry = {
      ...initialData,
      id: initialData?.id || `CNT-${Date.now()}`,
      contentName: name,
      shortName: short,
    };

    // Update global state
    onSave(savedEntry);

    // Persist to localStorage
    persistToLocal(savedEntry);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-96 max-w-2xl bg-background rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
            
            {/* Content Name */}
            <div>
              <Input
                label="Content Name"
                id="contentName"
                name="contentName"
                value={entry.contentName}
                onChange={handleChange}
                required
                className={errors.contentName ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
              />
              {errors.contentName && (
                <p className="text-sm text-red-600 mt-1 animate-in fade-in slide-in-from-top-1">
                  {errors.contentName}
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
              disabled={!!errors.contentName || !!errors.shortName}
            >
              Save Content Entry
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};