import { useState } from "react";
import type { VehicleEntry } from "../../types";
import { Input } from "../../components/shared/Input";
import { Button } from "../../components/shared/Button";
import { X } from "lucide-react";
import { useData } from "../../hooks/useData";

interface VehicleFormProps {
  initialData?: VehicleEntry;
  onClose: () => void;
  onSave: (entry: VehicleEntry) => void;
}

export const VehicleForm = ({
  initialData,
  onClose,
  onSave,
}: VehicleFormProps) => {
  const { vehicleEntries } = useData();

  const [entry, setEntry] = useState({
    id: initialData?.id || "",
    vehicleNo: initialData?.vehicleNo || "",
    vehicleName: initialData?.vehicleName || "",
    ownerName: initialData?.ownerName || "",
    ownerMobile: initialData?.ownerMobile || "",
  });

  const [errors, setErrors] = useState({
    vehicleNo: "",
    vehicleName: "",
    ownerName: "",
    ownerMobile: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setEntry((prev) => ({ ...prev, [name]: value }));

    //-------------- IMMEDIATE VALIDATION -----------------
    if (name === "vehicleNo") {
      const trimmed = value.trim();

      if (!trimmed) {
        setErrors((prev) => ({
          ...prev,
          vehicleNo: "Vehicle number is required",
        }));
      } else {
        const exists = vehicleEntries.some(
          (v) =>
            v.vehicleNo.toLowerCase() === trimmed.toLowerCase() &&
            v.id !== initialData?.id
        );

        setErrors((prev) => ({
          ...prev,
          vehicleNo: exists ? "Vehicle number already exists" : "",
        }));
      }
    }

    if (name === "vehicleName") {
      const trimmed = value.trim();
      setErrors((prev) => ({
        ...prev,
        vehicleName: trimmed ? "" : "Vehicle name is required",
      }));
    }

    if (name === "ownerName") {
      const trimmed = value.trim();
      setErrors((prev) => ({
        ...prev,
        ownerName: trimmed ? "" : "Owner name is required",
      }));
    }

    if (name === "ownerMobile") {
      const trimmed = value.trim();
      if (!trimmed) {
        setErrors((prev) => ({
          ...prev,
          ownerMobile: "Owner mobile is required",
        }));
      } else if (!/^\d{10}$/.test(trimmed)) {
        setErrors((prev) => ({
          ...prev,
          ownerMobile: "Mobile number must be 10 digits",
        }));
      } else {
        setErrors((prev) => ({
          ...prev,
          ownerMobile: "",
        }));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let hasError = false;

    const no = entry.vehicleNo.trim();
    const name = entry.vehicleName.trim();
    const owner = entry.ownerName.trim();
    const mobile = entry.ownerMobile.trim();

    const newErrors = {
      vehicleNo: "",
      vehicleName: "",
      ownerName: "",
      ownerMobile: "",
    };

    // Final validations
    if (!no) {
      newErrors.vehicleNo = "Vehicle number is required";
      hasError = true;
    } else {
      const exists = vehicleEntries.some(
        (v) =>
          v.vehicleNo.toLowerCase() === no.toLowerCase() &&
          v.id !== initialData?.id
      );

      if (exists) {
        newErrors.vehicleNo = "Vehicle number already exists";
        hasError = true;
      }
    }

    if (!name) {
      newErrors.vehicleName = "Vehicle name is required";
      hasError = true;
    }

    if (!owner) {
      newErrors.ownerName = "Owner name is required";
      hasError = true;
    }

    if (!mobile) {
      newErrors.ownerMobile = "Owner mobile is required";
      hasError = true;
    } else if (!/^\d{10}$/.test(mobile)) {
      newErrors.ownerMobile = "Mobile number must be 10 digits";
      hasError = true;
    }

    setErrors(newErrors);

    if (hasError) return;

    const savedEntry: VehicleEntry = {
      ...entry,
      id: initialData?.id || `VEH-${Date.now()}`,
      vehicleNo: no,
      vehicleName: name,
      ownerName: owner,
      ownerMobile: mobile,
    };

    onSave(savedEntry);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-96 max-w-2xl bg-background rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">

            {/* Vehicle No */}
            <div>
              <Input
                label="Vehicle Number"
                id="vehicleNo"
                name="vehicleNo"
                value={entry.vehicleNo}
                onChange={handleChange}
                className={errors.vehicleNo ? "border-red-500" : ""}
              />
              {errors.vehicleNo && (
                <p className="text-sm text-red-600 mt-1">{errors.vehicleNo}</p>
              )}
            </div>

            {/* Vehicle Name */}
            <div>
              <Input
                label="Vehicle Name"
                id="vehicleName"
                name="vehicleName"
                value={entry.vehicleName}
                onChange={handleChange}
                className={errors.vehicleName ? "border-red-500" : ""}
              />
              {errors.vehicleName && (
                <p className="text-sm text-red-600 mt-1">{errors.vehicleName}</p>
              )}
            </div>

            {/* Owner Name */}
            <div>
              <Input
                label="Owner Name"
                id="ownerName"
                name="ownerName"
                value={entry.ownerName}
                onChange={handleChange}
                className={errors.ownerName ? "border-red-500" : ""}
              />
              {errors.ownerName && (
                <p className="text-sm text-red-600 mt-1">{errors.ownerName}</p>
              )}
            </div>

            {/* Owner Mobile */}
            <div>
              <Input
                label="Owner Mobile"
                id="ownerMobile"
                name="ownerMobile"
                value={entry.ownerMobile}
                onChange={handleChange}
                className={errors.ownerMobile ? "border-red-500" : ""}
              />
              {errors.ownerMobile && (
                <p className="text-sm text-red-600 mt-1">{errors.ownerMobile}</p>
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
              disabled={
                !!errors.vehicleNo ||
                !!errors.vehicleName ||
                !!errors.ownerName ||
                !!errors.ownerMobile
              }
            >
              Save Vehicle
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
};
