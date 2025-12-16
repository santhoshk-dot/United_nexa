import { useState, useEffect, useMemo } from 'react';
import type { PackingEntry } from '../../../types';
import {
  FilePenLine,
  Trash2,
  Search,
  Download,
  Plus,
  Package,
  Hash,
  Tag,
} from 'lucide-react';
import { PackingUnitForm } from './PackingUnitForm';
import { ConfirmationDialog } from '../../../components/shared/ConfirmationDialog';
import { useData } from '../../../hooks/useData';
import { Button } from '../../../components/shared/Button';
import { usePagination } from '../../../utils/usePagination';
import { Pagination } from '../../../components/shared/Pagination';
import { CsvImporter } from '../../../components/shared/CsvImporter';
import { useToast } from '../../../contexts/ToastContext';

export const PackingEntryList = () => {
  const { packingEntries, addPackingEntry, updatePackingEntry, deletePackingEntry, fetchPackingEntries, importPackings } = useData();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [] = useState(false);
  const [shortNameFilter] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<PackingEntry | undefined>(undefined);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteMessage, setDeleteMessage] = useState("");

  useEffect(() => {
    fetchPackingEntries();
  }, [fetchPackingEntries]);

  const filteredEntries = useMemo(() => {
    return packingEntries.filter((entry: PackingEntry) => {
      const matchesSearch =
        entry.packingName.toLowerCase().includes(search.toLowerCase()) ||
        entry.shortName.toLowerCase().includes(search.toLowerCase());
      const matchesShortName = !shortNameFilter || entry.shortName.toLowerCase().includes(shortNameFilter.toLowerCase());
      return matchesSearch && matchesShortName;
    });
  }, [packingEntries, search, shortNameFilter]);

  const {
    paginatedData,
    currentPage,
    setCurrentPage,
    totalPages,
    itemsPerPage,
    setItemsPerPage,
    totalItems
  } = usePagination({ data: filteredEntries, initialItemsPerPage: 10 });



  const handleEdit = (entry: PackingEntry) => {
    setEditingEntry(entry);
    setIsFormOpen(true);
  };

  const handleDelete = (entry: PackingEntry) => {
    setDeletingId(entry.id);
    setDeleteMessage(`Are you sure you want to delete packing type "${entry.packingName}"?`);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deletingId) deletePackingEntry(deletingId);
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

  const handleFormSave = (entry: PackingEntry) => {
    if (editingEntry) updatePackingEntry(entry);
    else addPackingEntry(entry);
    handleFormClose();
  };

  const handleImport = async (data: PackingEntry[]) => {
    await importPackings(data);
  };

  const handleExport = () => {
    if (filteredEntries.length === 0) {
      toast.error("No data to export");
      return;
    }
    const headers = ['Packing Name', 'Short Name'];
    const csvContent = [
      headers.join(','),
      ...filteredEntries.map(p => [
        `"${p.packingName.replace(/"/g, '""')}"`,
        `"${p.shortName.replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'packing_units_export.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const csvMapRow = (row: any) => {
    if (!row.packingname || !row.shortname) return null;
    return {
      id: `pk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      packingName: row.packingname,
      shortName: row.shortname
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
              placeholder="Search by Packing Name or Short Name..."
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
         <CsvImporter<PackingEntry>
            onImport={handleImport}
            existingData={packingEntries}
            label="Import Packing Units"
            checkDuplicate={(newItem, existing) =>
              newItem.packingName.toLowerCase() === existing.packingName.toLowerCase() ||
              newItem.shortName.toLowerCase() === existing.shortName.toLowerCase()
            }
            mapRow={csvMapRow}
            // 泙 NEW: Added Template
            template={{
              filename: 'packing_units_import_template.csv',
              columns: ['Packing Name', 'Short Name'],
              sampleRow: ['Box', 'BX']
            }}
          />
          <Button variant="primary" onClick={handleCreateNew} className="h-10">
            <Plus className="w-4 h-4" />
            Add Packing
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
                placeholder="Search packing..."
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
            <CsvImporter<PackingEntry>
            onImport={handleImport}
            existingData={packingEntries}
            label="Import Packing Units"
            checkDuplicate={(newItem, existing) =>
              newItem.packingName.toLowerCase() === existing.packingName.toLowerCase() ||
              newItem.shortName.toLowerCase() === existing.shortName.toLowerCase()
            }
            mapRow={csvMapRow}
            // 泙 NEW: Added Template
            template={{
              filename: 'packing_units_import_template.csv',
              columns: ['Packing Name', 'Short Name'],
              sampleRow: ['Box', 'BX']
            }}
          />
            <Button variant="primary" onClick={handleCreateNew} className="flex-1 h-9 text-xs sm:text-sm">
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />Add
              {/* <span className="hidden xs:inline">Add</span>
              <span className="hidden sm:inline ml-1">Packing</span> */}
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
                    <Package className="w-3.5 h-3.5" />
                    Packing Name
                  </div>
                </th>
                <th className="px-4 py-3 text-left">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <Tag className="w-3.5 h-3.5" />
                    Short Name
                  </div>
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider w-24">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedData.length > 0 ? (
                paginatedData.map((entry, index) => (
                  <tr key={entry.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-semibold text-primary">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-foreground font-medium">{entry.packingName}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-foreground font-medium">{entry.shortName}</span>
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
                  <td colSpan={4} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="w-10 h-10 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">No packing entries found</p>
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
                  Packing Name / Short Name
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider w-20">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedData.length > 0 ? (
                paginatedData.map((entry, index) => (
                  <tr key={entry.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-3">
                      <span className="font-semibold text-primary">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div>
                        <span className="text-sm font-medium text-foreground block">{entry.packingName}</span>
                        <span className="text-xs font-medium text-foreground mt-0.5 block">{entry.shortName}</span>
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
                  <td colSpan={3} className="px-3 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="w-10 h-10 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">No packing entries found</p>
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
            paginatedData.map((entry, index) => (
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
                      <h3 className="text-sm font-medium text-foreground truncate">{entry.packingName}</h3>
                      <div className="flex font-medium items-center gap-1.5 mt-1 text-foreground">
                        <Tag className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="text-sm truncate">{entry.shortName}</span>
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
                <Package className="w-10 h-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No packing entries found</p>
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
        <PackingUnitForm
          initialData={editingEntry}
          onClose={handleFormClose}
          onSave={handleFormSave}
        />
      )}

      <ConfirmationDialog
        open={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Packing Entry"
        description={deleteMessage}
      />
    </div>
  );
};