import { useState, useMemo, useEffect } from "react";
import type { VehicleEntry } from "../../../types";
import {
  FilePenLine,
  Trash2,
  Search,
  Download,
  Plus,

  Truck,
  Hash,
  User,
  Phone,

} from "lucide-react";
import { VehicleForm } from "./VehicleForm";
import { ConfirmationDialog } from "../../../components/shared/ConfirmationDialog";
import { useData } from "../../../hooks/useData";
import { Button } from "../../../components/shared/Button";
import { usePagination } from "../../../utils/usePagination";
import { Pagination } from "../../../components/shared/Pagination";
import { CsvImporter } from "../../../components/shared/CsvImporter";
import { useToast } from "../../../contexts/ToastContext";

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
  const [] = useState(false);
  const [ownerFilter] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<VehicleEntry | undefined>(undefined);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteMessage, setDeleteMessage] = useState("");

  useEffect(() => {
    fetchVehicleEntries();
  }, [fetchVehicleEntries]);

  const filteredEntries = useMemo(() => {
    return vehicleEntries.filter((entry: VehicleEntry) => {
      const searchLower = search.toLowerCase();

      const matchesSearch =
        entry.vehicleNo.toLowerCase().includes(searchLower) ||
        entry.vehicleName.toLowerCase().includes(searchLower) ||
        (entry.ownerName || '').toLowerCase().includes(searchLower) ||   // Added Owner Name
        (entry.ownerMobile || '').toLowerCase().includes(searchLower);   // Added Owner Mobile

      const matchesOwner = !ownerFilter || (entry.ownerName || '').toLowerCase().includes(ownerFilter.toLowerCase());

      return matchesSearch && matchesOwner;
    });
  }, [vehicleEntries, search, ownerFilter]);

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
      link.setAttribute('download', 'vehicles_export.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const csvMapRow = (row: any) => {
    if (!row.vehicleno || !row.vehiclename) return null;
    if (!VEHICLE_REGEX.test(row.vehicleno)) return null;

    // Strict validation for required fields: Owner Name and Mobile
    if (!row.ownername || row.ownername.trim() === '') return null;
    if (!row.ownermobile || !MOBILE_REGEX.test(row.ownermobile)) return null;

    return {
      id: `veh-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      vehicleNo: row.vehicleno,
      vehicleName: row.vehiclename,
      ownerName: row.ownername,
      ownerMobile: row.ownermobile
    };
  };

  return (
    <div className="space-y-4">
      {/* Control Bar */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
        {/* Desktop - Single Row (lg and above) */}
        <div className="hidden lg:flex items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by Vehicle No or Name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-secondary/50 text-foreground rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60 text-sm"
            />
          </div>



          {/* Action Buttons */}
          <Button variant="outline" onClick={handleExport} className="h-10">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <CsvImporter<VehicleEntry>
            onImport={handleImport}
            existingData={vehicleEntries}
            label="Import Vehicles"
            checkDuplicate={(newItem, existing) =>
              newItem.vehicleNo.trim().toLowerCase() === existing.vehicleNo.trim().toLowerCase()
            }
            mapRow={csvMapRow}
            // 泙 NEW: Add template prop here
            template={{
              filename: 'vehicle_import_template.csv',
              columns: ['Vehicle No', 'Vehicle Name', 'Owner Name', 'Owner Mobile'],
              sampleRow: ['TN01AB1234', 'Tata Ace', 'John Doe', '9876543210']
            }}
          />
          <Button variant="primary" onClick={handleCreateNew} className="h-10">
            <Plus className="w-4 h-4" />
            Add Vehicle
          </Button>
        </div>

        {/* Tablet & Mobile - Two Rows (below lg) */}
        <div className="flex lg:hidden flex-col gap-3">
          {/* Row 1: Search + Filter */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by Vehicle No or Name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-secondary/50 text-foreground rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60 text-sm"
              />
            </div>

          </div>

          {/* Row 2: Action Buttons */}
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExport} className="flex-1 h-9 text-xs sm:text-sm">
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Export
            </Button>
           <CsvImporter<VehicleEntry>
            onImport={handleImport}
            existingData={vehicleEntries}
            label="Import Vehicles"
            checkDuplicate={(newItem, existing) =>
              newItem.vehicleNo.trim().toLowerCase() === existing.vehicleNo.trim().toLowerCase()
            }
            mapRow={csvMapRow}
            // 泙 NEW: Add template prop here
            template={{
              filename: 'vehicle_import_template.csv',
              columns: ['Vehicle No', 'Vehicle Name', 'Owner Name', 'Owner Mobile'],
              sampleRow: ['TN01AB1234', 'Tata Ace', 'John Doe', '9876543210']
            }}
          />
            <Button variant="primary" onClick={handleCreateNew} className="flex-1 h-9 text-xs sm:text-sm">
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />Add
              {/* <span className="hidden xs:inline">Add</span>
              <span className="hidden sm:inline ml-1">Vehicle</span> */}
            </Button>
          </div>
        </div>
      </div>



      {/* Data Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {/* Desktop Table - show on lg and above */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left w-16">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <Hash className="w-3.5 h-3.5" />
                    S.No
                  </div>
                </th>
                <th className="px-4 py-3 text-left">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <Truck className="w-3.5 h-3.5" />
                    Vehicle No
                  </div>
                </th>
                <th className="px-4 py-3 text-left">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <User className="w-3.5 h-3.5" />
                    Vehicle Name
                  </div>
                </th>
                <th className="px-4 py-3 text-left">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <Phone className="w-3.5 h-3.5" />
                    Owner Details
                  </div>
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider w-24">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedData.length > 0 ? (
                paginatedData.map((entry: VehicleEntry, index) => (
                  <tr key={entry.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-semibold text-primary">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-foreground font-medium">{entry.vehicleNo}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-foreground font-medium">{entry.vehicleName}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <span className="text-sm font-medium text-foreground block">{entry.ownerName || "-"}</span>
                        <span className="text-xs text-foreground">{entry.ownerMobile || "-"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(entry)}
                          className="p-1.5 rounded-md text-blue-600 hover:bg-blue-500/10 transition-colors"
                          title="Edit"
                        >
                          <FilePenLine className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(entry)}
                          className="p-1.5 rounded-md text-destructive hover:bg-destructive/10 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Truck className="w-10 h-10 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">No vehicles found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Tablet View - show on md screens */}
        <div className="hidden md:block lg:hidden overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-3 py-3 text-left w-12">
                  <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Vehicle No / Name
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Owner / Mobile
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider w-20">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedData.length > 0 ? (
                paginatedData.map((entry: VehicleEntry, index) => (
                  <tr key={entry.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-3">
                      <span className="font-semibold text-primary">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div>
                        <span className="text-sm font-medium text-foreground block">{entry.vehicleNo}</span>
                        <span className="text-xs font-medium text-foreground mt-0.5 block">{entry.vehicleName}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div>
                        <span className="text-sm font-medium text-foreground block">{entry.ownerName || "-"}</span>
                        <span className="text-xs font-medium text-foreground mt-0.5 block">{entry.ownerMobile || "-"}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(entry)}
                          className="p-1.5 rounded-md text-blue-600 hover:bg-blue-500/10 transition-colors"
                          title="Edit"
                        >
                          <FilePenLine className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(entry)}
                          className="p-1.5 rounded-md text-destructive hover:bg-destructive/10 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-3 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Truck className="w-10 h-10 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">No vehicles found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards - show on small screens only */}
        <div className="block md:hidden divide-y divide-border">
          {paginatedData.length > 0 ? (
            paginatedData.map((entry: VehicleEntry, index) => (
              <div key={entry.id} className="p-4">
                <div className="flex gap-3">
                  {/* Number Badge */}
                  <div className="pt-0.5 flex-shrink-0">
                    <span className="font-semibold text-primary">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="mb-2">
                      <h3 className="text-md font-medium text-foreground truncate">{entry.vehicleNo}</h3>
                      <div className="flex font-medium items-center gap-1.5 mt-1 text-foreground">
                        <Truck className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="text-sm truncate">{entry.vehicleName}</span>
                      </div>
                    </div>

                    {/* Owner Details */}
                    <div className="space-y-1 text-sm mb-3">
                      <div className="flex items-center gap-2 text-foreground">
                        <User className="w-3.5 h-3.5 text-foreground font-medium flex-shrink-0" />
                        <span className="text-foreground font-medium">Owner:</span>
                        <span className="truncate text-foreground font-medium">{entry.ownerName || "-"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-foreground">
                        <Phone className="w-3.5 h-3.5 text-foreground font-medium flex-shrink-0" />
                        <span className="text-foreground font-medium">Mobile:</span>
                        <span className="truncate text-foreground font-medium">{entry.ownerMobile || "-"}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-3 border-t border-border">
                      <button
                        onClick={() => handleEdit(entry)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-blue-600 bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
                      >
                        <FilePenLine className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(entry)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center">
              <div className="flex flex-col items-center gap-2">
                <Truck className="w-10 h-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No vehicles found</p>
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {filteredEntries.length > 0 && (
          <div className="border-t border-border p-4">
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

      {/* Modals */}
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