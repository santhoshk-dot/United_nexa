import { useState, useMemo } from "react";
import type { VehicleEntry } from "../../types";
import { FilePenLine, Trash2, Search, Download } from "lucide-react";
import { VehicleForm } from "./VehicleForm";
import { ConfirmationDialog } from "../../components/shared/ConfirmationDialog";
import { useData } from "../../hooks/useData";
import { Button } from "../../components/shared/Button";
import { usePagination } from "../../utils/usePagination";
import { Pagination } from "../../components/shared/Pagination";
import { CsvImporter } from "../../components/shared/CsvImporter";

export const VehicleList = () => {
  const {
    vehicleEntries,
    addVehicleEntry,
    updateVehicleEntry,
    deleteVehicleEntry,
  } = useData();

  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<VehicleEntry | undefined>(undefined);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteMessage, setDeleteMessage] = useState("");

  // Filtered Data
  const filteredEntries = useMemo(() => {
    return vehicleEntries.filter(
      (entry: VehicleEntry) =>
        entry.vehicleNo.toLowerCase().includes(search.toLowerCase()) ||
        entry.vehicleName.toLowerCase().includes(search.toLowerCase())
    );
  }, [vehicleEntries, search]);

  // Pagination Setup
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

  // Actions
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

  const handleImport = (data: VehicleEntry[]) => {
    data.forEach(v => addVehicleEntry(v));
  };

  const handleExport = () => {
    if (filteredEntries.length === 0) {
      alert("No data to export");
      return;
    }
    const headers = ['Vehicle No', 'Vehicle Name'];
    const csvContent = [
      headers.join(','),
      ...filteredEntries.map(v => [
        `"${v.vehicleNo.replace(/"/g, '""')}"`,
        `"${v.vehicleName.replace(/"/g, '""')}"`
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

  return (
    <div className="space-y-6">

      {/* 1. Top Bar (Standardized) */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-background p-4 rounded-lg shadow border border-muted">
        {/* LEFT: Search */}
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

        {/* RIGHT: Create Button */}
        <div className="flex gap-2 w-full md:w-auto justify-end">
          <Button variant="outline" onClick={handleExport} size="sm" title="Export CSV">
            <Download size={16} className="mr-2" /> Export
          </Button>
           <CsvImporter<VehicleEntry>
            onImport={handleImport}
            existingData={vehicleEntries}
            checkDuplicate={(newItem, existing) => 
                newItem.vehicleNo.trim().toLowerCase() === existing.vehicleNo.trim().toLowerCase()
            }
            mapRow={(row) => {
                if (!row.vehicleno || !row.vehiclename) return null;
                return {
                    id: `veh-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    vehicleNo: row.vehicleno,
                    vehicleName: row.vehiclename
                };
            }}
          />
          <Button variant="primary" onClick={handleCreateNew}>
            + Add Vehicle
          </Button>
        </div>
      </div>

      {/* 2. Data Table */}
      <div className="bg-background rounded-lg shadow border border-muted overflow-hidden">

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-muted">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  S.No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Vehicle No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Vehicle Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Owner Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Owner Mobile
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Actions
                </th>
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
                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                       No vehicles found.
                    </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
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
                    <div className="text-sm text-muted-foreground">
                      Name: {entry.vehicleName}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Owner: {entry.ownerName || "-"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Mobile: {entry.ownerMobile || "-"}
                    </div>
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

        {/* Pagination */}
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

      {/* Delete Confirmation */}
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