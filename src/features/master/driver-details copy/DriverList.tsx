import { useState, useMemo, useEffect } from "react";
import type { DriverEntry } from "../../../types";
import {
  FilePenLine,
  Trash2,
  Search,
  Download,
  Plus,
  UserCircle,
  Hash,
  Phone,
  CreditCard,
} from "lucide-react";
import { DriverForm } from "./DriverForm";
import { ConfirmationDialog } from "../../../components/shared/ConfirmationDialog";
import { useData } from "../../../hooks/useData";
import { Button } from "../../../components/shared/Button";
import { usePagination } from "../../../utils/usePagination";
import { Pagination } from "../../../components/shared/Pagination";
import { CsvImporter } from "../../../components/shared/CsvImporter";
import { useToast } from "../../../contexts/ToastContext";

const MOBILE_REGEX = /^[6-9]\d{9}$/;

export const DriverList = () => {
  const {
    driverEntries,
    addDriverEntry,
    updateDriverEntry,
    deleteDriverEntry,
    fetchDriverEntries,
    importDrivers
  } = useData();

  const toast = useToast();
  const [search, setSearch] = useState("");
  const [] = useState(false);
  const [dlFilter] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DriverEntry | undefined>(undefined);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteMessage, setDeleteMessage] = useState("");

  useEffect(() => {
    fetchDriverEntries();
  }, [fetchDriverEntries]);

  const filteredEntries = useMemo(() => {
    return driverEntries.filter((entry: DriverEntry) => {
      const matchesSearch =
        entry.driverName.toLowerCase().includes(search.toLowerCase()) ||
        entry.dlNo.toLowerCase().includes(search.toLowerCase()) ||
        entry.mobile.includes(search);
      const matchesDl = !dlFilter || entry.dlNo.toLowerCase().includes(dlFilter.toLowerCase());
      return matchesSearch && matchesDl;
    });
  }, [driverEntries, search, dlFilter]);

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



  const handleEdit = (entry: DriverEntry) => {
    setEditingEntry(entry);
    setIsFormOpen(true);
  };

  const handleDelete = (entry: DriverEntry) => {
    setDeletingId(entry.id);
    setDeleteMessage(`Are you sure you want to delete driver "${entry.driverName}"?`);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deletingId) deleteDriverEntry(deletingId);
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

  const handleFormSave = (entry: DriverEntry) => {
    if (editingEntry) updateDriverEntry(entry);
    else addDriverEntry(entry);
    handleFormClose();
  };

  const handleImport = async (data: DriverEntry[]) => {
    await importDrivers(data);
  };

  const handleExport = () => {
    if (filteredEntries.length === 0) {
      toast.error("No data to export");
      return;
    }
    const headers = ['Driver Name', 'DL No', 'Mobile'];

    const csvContent = [
      headers.join(','),
      ...filteredEntries.map(d => [
        `"${d.driverName.replace(/"/g, '""')}"`,
        `"${d.dlNo.replace(/"/g, '""')}"`,
        `"${d.mobile.replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'drivers_export.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const csvMapRow = (row: any) => {
    if (!row.drivername || !row.dlno) return null;
    const mobile = row.mobile || '';
    if (mobile && !MOBILE_REGEX.test(mobile)) return null;
    if (row.dlno.length < 5) return null;
    return {
      id: `drv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      driverName: row.drivername,
      dlNo: row.dlno,
      mobile: mobile
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
              placeholder="Search by Name, DL No or Mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-secondary/50 text-foreground rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60 text-sm"
            />
          </div>

          {/* Filter Button */}
          {/* <Button
            variant={hasActiveFilters ? 'primary' : 'outline'}
            onClick={() => setShowFilters(!showFilters)}
            className="h-10 px-4 shrink-0"
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1.5 w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            )}
          </Button> */}

          {/* Action Buttons */}
          <Button variant="outline" onClick={handleExport} className="h-10">
            <Download className="w-4 h-4" />
            Export
          </Button>
         <CsvImporter<DriverEntry>
            onImport={handleImport}
            existingData={driverEntries}
            label="Import Drivers"
            checkDuplicate={(newItem, existing) =>
              newItem.dlNo.trim().toLowerCase() === existing.dlNo.trim().toLowerCase()
            }
            mapRow={csvMapRow}
            // 泙 NEW: Added Template
            template={{
              filename: 'driver_import_template.csv',
              columns: ['Driver Name', 'DL No', 'Mobile'],
              sampleRow: ['Ramesh Kumar', 'TN0120200012345', '9876543210']
            }}
          />
          <Button variant="primary" onClick={handleCreateNew} className="h-10">
            <Plus className="w-4 h-4" />
            Add Driver
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
                placeholder="Search by Name, DL No or Mobile..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-secondary/50 text-foreground rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60 text-sm"
              />
            </div>
            {/* <Button
              variant={hasActiveFilters ? 'primary' : 'outline'}
              onClick={() => setShowFilters(!showFilters)}
              className="h-10 px-3 shrink-0"
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline ml-1">Filters</span>
              {hasActiveFilters && (
                <span className="ml-1.5 w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              )}
            </Button> */}
          </div>

          {/* Row 2: Action Buttons */}
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExport} className="flex-1 h-9 text-xs sm:text-sm">
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Export
            </Button>
           <CsvImporter<DriverEntry>
            onImport={handleImport}
            existingData={driverEntries}
            label="Import Drivers"
            checkDuplicate={(newItem, existing) =>
              newItem.dlNo.trim().toLowerCase() === existing.dlNo.trim().toLowerCase()
            }
            mapRow={csvMapRow}
            // 泙 NEW: Added Template
            template={{
              filename: 'driver_import_template.csv',
              columns: ['Driver Name', 'DL No', 'Mobile'],
              sampleRow: ['Ramesh Kumar', 'TN0120200012345', '9876543210']
            }}
          />
            <Button variant="primary" onClick={handleCreateNew} className="flex-1 h-9 text-xs sm:text-sm">
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />Add
              {/* <span className="hidden xs:inline">Add</span>
              <span className="hidden sm:inline ml-1">Driver</span> */}
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
                    <UserCircle className="w-3.5 h-3.5" />
                    Driver Name
                  </div>
                </th>
                <th className="px-4 py-3 text-left">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <CreditCard className="w-3.5 h-3.5" />
                    DL Number
                  </div>
                </th>
                <th className="px-4 py-3 text-left">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <Phone className="w-3.5 h-3.5" />
                    Mobile
                  </div>
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider w-24">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedData.length > 0 ? (
                paginatedData.map((entry: DriverEntry, index) => (
                  <tr key={entry.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-semibold text-primary">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-foreground font-medium">{entry.driverName}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-foreground font-medium">{entry.dlNo}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-foreground font-medium">{entry.mobile || "-"}</span>
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
                      <UserCircle className="w-10 h-10 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">No drivers found</p>
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
                  Name / DL No
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Mobile
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider w-20">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedData.length > 0 ? (
                paginatedData.map((entry: DriverEntry, index) => (
                  <tr key={entry.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-3">
                      <span className="font-semibold text-primary">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div>
                        <span className="text-sm font-medium text-foreground block">{entry.driverName}</span>
                        <span className="text-xs font-medium text-foreground font-medium mt-0.5 block">{entry.dlNo}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-sm text-foreground">{entry.mobile || "-"}</span>
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
                      <UserCircle className="w-10 h-10 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">No drivers found</p>
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
            paginatedData.map((entry: DriverEntry, index) => (
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
                      <h3 className="font-medium text-foreground truncate font-medium">{entry.driverName}</h3>
                      <div className="flex items-center gap-1.5 mt-1 text-foreground font-medium">
                        <CreditCard className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="font-medium text-sm truncate">{entry.dlNo}</span>
                      </div>
                    </div>

                    {/* Mobile Details */}
                    <div className="space-y-1 text-sm mb-3">
                      <div className="flex items-center gap-2 text-foreground">
                        <Phone className="w-3.5 h-3.5 text-foreground flex-shrink-0 font-medium" />
                        <span className="text-foreground font-medium">Mobile:</span>
                        <span className="text-foreground font-medium">{entry.mobile || "-"}</span>
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
                <UserCircle className="w-10 h-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No drivers found</p>
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
        <DriverForm
          initialData={editingEntry}
          onClose={handleFormClose}
          onSave={handleFormSave}
        />
      )}

      <ConfirmationDialog
        open={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Driver"
        description={deleteMessage}
      />
    </div>
  );
};