import { useState, useMemo, useEffect } from "react";
import type { VehicleEntry } from "../../types";
import { FilePenLine, Trash2, Search, Download } from "lucide-react";
import { VehicleForm } from "./VehicleForm";
import { ConfirmationDialog } from "../../components/shared/ConfirmationDialog";
import { useData } from "../../hooks/useData";
import { Button } from "../../components/shared/Button";
import { usePagination } from "../../utils/usePagination";
import { Pagination } from "../../components/shared/Pagination";
import { CsvImporter } from "../../components/shared/CsvImporter";
import { useToast } from "../../contexts/ToastContext";

// 🟢 NEW: Regex
const VEHICLE_REGEX = /^[A-Z]{2}[0-9]{1,2}(?:[A-Z])?(?:[A-Z]*)?[0-9]{4}$/;
const MOBILE_REGEX = /^[6-9]\d{9}$/;

export const VehicleList = () => {
  const {
    vehicleEntries,
    addVehicleEntry,
    updateVehicleEntry,
    deleteVehicleEntry,
    fetchVehicleEntries,
    importVehicles
  } = useData();
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<VehicleEntry | undefined>(undefined);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteMessage, setDeleteMessage] = useState("");

  useEffect(() => {
    fetchVehicleEntries();
  }, [fetchVehicleEntries]);

  const filteredEntries = useMemo(() => {
    return vehicleEntries.filter(
      (entry: VehicleEntry) =>
        entry.vehicleNo.toLowerCase().includes(search.toLowerCase()) ||
        entry.vehicleName.toLowerCase().includes(search.toLowerCase())
    );
  }, [vehicleEntries, search]);

  const {
    paginatedData,
    currentPage,
    setCurrentPage,
    totalPages,
    itemsPerPage,
    setItemsPerPage,
    totalItems,
  } = usePagination({
    data: filteredEntries,
    initialItemsPerPage: 10,
  });

  const handleEdit = (entry: VehicleEntry) => {
    setEditingEntry(entry);
    setIsFormOpen(true);
  };

  const handleDelete = (entry: VehicleEntry) => {
    setDeletingId(entry.id);
    setDeleteMessage(`Are you sure you want to delete vehicle "${entry.vehicleNo}"?`);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deletingId) deleteVehicleEntry(deletingId);
    setDeletingId(null);
    setIsConfirmOpen(false);
  };

  const handleCreateNew = () => {
    setEditingEntry(undefined);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingEntry(undefined);
  };

  const handleFormSave = (entry: VehicleEntry) => {
    if (editingEntry) updateVehicleEntry(entry);
    else addVehicleEntry(entry);
    handleFormClose();
  };

  const handleImport = async (data: VehicleEntry[]) => {
    await importVehicles(data);
  };

  const handleExport = () => {
    if (filteredEntries.length === 0) {
      toast.error("No data to export");
      return;
    }
    const headers = ['Vehicle No', 'Vehicle Name', 'Owner Name', 'Owner Mobile'];
    
    const csvContent = [
      headers.join(','),
      ...filteredEntries.map(v => [
        `"${v.vehicleNo.replace(/"/g, '""')}"`,
        `"${v.vehicleName.replace(/"/g, '""')}"`,
        `"${(v.ownerName || '').replace(/"/g, '""')}"`,   
        `"${(v.ownerMobile || '').replace(/"/g, '""')}"` 
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `vehicles_export.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const responsiveBtnClass = "flex-1 md:flex-none text-[10px] xs:text-xs sm:text-sm h-8 sm:h-10 px-1 sm:px-4 whitespace-nowrap";

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-background p-4 rounded-lg shadow border border-muted">
        <div className="w-full md:w-1/2 relative">
          <input
            type="text"
            placeholder="Search by Vehicle No or Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background text-foreground border border-muted-foreground/30 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        </div>

        <div className="flex gap-2 w-full md:w-auto justify-between md:justify-end">
          <Button variant="outline" onClick={handleExport} size="sm" title="Export CSV" className={responsiveBtnClass}>
            <Download size={14} className="mr-1 sm:mr-2" /> Export
          </Button>
          
          <CsvImporter<VehicleEntry>
            onImport={handleImport}
            existingData={vehicleEntries}
            label="Import" 
            className={responsiveBtnClass} 
            checkDuplicate={(newItem, existing) => 
                newItem.vehicleNo.trim().toLowerCase() === existing.vehicleNo.trim().toLowerCase()
            }
            mapRow={(row) => {
                if (!row.vehicleno || !row.vehiclename) return null;
                
                // 🟢 Regex Validation
                if (!VEHICLE_REGEX.test(row.vehicleno)) return null;
                if (row.ownermobile && !MOBILE_REGEX.test(row.ownermobile)) return null;

                return {
                    id: `veh-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    vehicleNo: row.vehicleno,
                    vehicleName: row.vehiclename,
                    ownerName: row.ownername || '',
                    ownerMobile: row.ownermobile || ''
                };
            }}
          />
          
          <Button variant="primary" onClick={handleCreateNew} size="sm" className={responsiveBtnClass}>
            + Add Vehicle
          </Button>
        </div>
      </div>

      <div className="bg-background rounded-lg shadow border border-muted overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-muted">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">S.No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Vehicle No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Vehicle Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Owner Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Owner Mobile</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-muted">
              {paginatedData.length > 0 ? (
                paginatedData.map((entry: VehicleEntry, index) => (
                  <tr key={entry.id} className="hover:bg-muted/30">
                    <td className="px-6 py-4 text-sm font-medium">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-foreground">{entry.vehicleNo}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{entry.vehicleName}</td>
                    <td className="px-6 py-4 text-sm">{entry.ownerName || "-"}</td>
                    <td className="px-6 py-4 text-sm">{entry.ownerMobile || "-"}</td>
                    <td className="px-6 py-4 text-sm space-x-3">
                      <button onClick={() => handleEdit(entry)} className="text-blue-600 hover:text-blue-800">
                        <FilePenLine size={18} />
                      </button>
                      <button onClick={() => handleDelete(entry)} className="text-destructive hover:text-destructive/80">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                 <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                       No vehicles found.
                    </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="block md:hidden divide-y divide-muted">
          {paginatedData.length > 0 ? (
            paginatedData.map((entry: VehicleEntry, index) => (
              <div key={entry.id} className="p-4 hover:bg-muted/30">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm text-muted-foreground">
                      #{(currentPage - 1) * itemsPerPage + index + 1}
                    </div>
                    <div className="text-lg font-semibold text-foreground">{entry.vehicleNo}</div>
                    <div className="text-sm text-muted-foreground">Name: {entry.vehicleName}</div>
                    <div className="text-sm text-muted-foreground">Owner: {entry.ownerName || "-"}</div>
                    <div className="text-sm text-muted-foreground">Mobile: {entry.ownerMobile || "-"}</div>
                  </div>

                  <div className="flex flex-col space-y-3 pt-1">
                    <button onClick={() => handleEdit(entry)} className="text-blue-600">
                      <FilePenLine size={18} />
                    </button>
                    <button onClick={() => handleDelete(entry)} className="text-destructive">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-muted-foreground">
               No vehicles found.
            </div>
          )}
        </div>

        {filteredEntries.length > 0 && (
          <div className="border-t border-muted p-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={setItemsPerPage}
              totalItems={totalItems}
            />
          </div>
        )}
      </div>

      {isFormOpen && (
        <VehicleForm
          initialData={editingEntry}
          onClose={handleFormClose}
          onSave={handleFormSave}
        />
      )}

      <ConfirmationDialog
        open={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Vehicle"
        description={deleteMessage}
      />
    </div>
  );
};