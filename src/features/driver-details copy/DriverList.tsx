import { useState, useMemo, useEffect } from "react";
import type { DriverEntry } from "../../types";
import { FilePenLine, Trash2, Search, Download } from "lucide-react";
import { DriverForm } from "./DriverForm";
import { ConfirmationDialog } from "../../components/shared/ConfirmationDialog";
import { useData } from "../../hooks/useData";
import { Button } from "../../components/shared/Button";
import { usePagination } from "../../utils/usePagination";
import { Pagination } from "../../components/shared/Pagination";
import { CsvImporter } from "../../components/shared/CsvImporter";
import { useToast } from "../../contexts/ToastContext";

// 🟢 NEW: Regex
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
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DriverEntry | undefined>(undefined);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteMessage, setDeleteMessage] = useState("");

  useEffect(() => {
    fetchDriverEntries();
  }, [fetchDriverEntries]);

  const filteredEntries = useMemo(() => {
    return driverEntries.filter(
      (entry: DriverEntry) =>
        entry.driverName.toLowerCase().includes(search.toLowerCase()) ||
        entry.dlNo.toLowerCase().includes(search.toLowerCase()) ||
        entry.mobile.includes(search)
    );
  }, [driverEntries, search]);

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
      link.setAttribute('download', `drivers_export.csv`);
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
            placeholder="Search by Name, DL No or Mobile..."
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
          
          <CsvImporter<DriverEntry>
            onImport={handleImport}
            existingData={driverEntries}
            label="Import"
            className={responsiveBtnClass}
            checkDuplicate={(newItem, existing) => 
                newItem.dlNo.trim().toLowerCase() === existing.dlNo.trim().toLowerCase()
            }
            mapRow={(row) => {
                if (!row.drivername || !row.dlno) return null;
                const mobile = row.mobile || '';
                
                // 🟢 Regex Validation for Import
                if (mobile && !MOBILE_REGEX.test(mobile)) return null; 
                // Basic DL Length Check
                if (row.dlno.length < 5) return null;

                return {
                    id: `drv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    driverName: row.drivername,
                    dlNo: row.dlno,
                    mobile: mobile
                };
            }}
          />
          
          <Button variant="primary" onClick={handleCreateNew} size="sm" className={responsiveBtnClass}>
            + Add Driver
          </Button>
        </div>
      </div>

      <div className="bg-background rounded-lg shadow border border-muted overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-muted">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">S.No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Driver Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">DL No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Mobile</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-muted">
              {paginatedData.length > 0 ? (
                paginatedData.map((entry, index) => (
                  <tr key={entry.id} className="hover:bg-muted/30">
                    <td className="px-6 py-4 text-sm font-medium">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-foreground">{entry.driverName}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{entry.dlNo}</td>
                    <td className="px-6 py-4 text-sm">{entry.mobile || "-"}</td>
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
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                       No drivers found.
                    </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="block md:hidden divide-y divide-muted">
          {paginatedData.length > 0 ? (
            paginatedData.map((entry, index) => (
              <div key={entry.id} className="p-4 hover:bg-muted/30">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm text-muted-foreground">
                      #{(currentPage - 1) * itemsPerPage + index + 1}
                    </div>
                    <div className="text-lg font-semibold text-foreground">{entry.driverName}</div>
                    <div className="text-sm text-muted-foreground">DL: {entry.dlNo}</div>
                    <div className="text-sm text-muted-foreground">Mob: {entry.mobile || "-"}</div>
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
               No drivers found.
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