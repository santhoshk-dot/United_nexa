import { useState, useMemo, useEffect } from 'react';
import type { Consignor, Consignee } from '../../../types';
import {
  FilePenLine,
  Trash2,
  Search,
  Filter,
  Download,
  FilterX,
  Plus,
  Store,
  Hash,
  User,
  ChevronUp
} from 'lucide-react';
import { ConsignorForm } from './ConsignorForm';
import { DateFilterButtons, getTodayDate, getYesterdayDate, isDateInLast7Days } from '../../../components/shared/DateFilterButtons';
import { ConfirmationDialog } from '../../../components/shared/ConfirmationDialog';
import { useData } from '../../../hooks/useData';
import { Button } from '../../../components/shared/Button';
import { usePagination } from '../../../utils/usePagination';
import { Pagination } from '../../../components/shared/Pagination';
import { CsvImporter } from '../../../components/shared/CsvImporter';
import { useToast } from '../../../contexts/ToastContext';

// Regex Validators for Import
const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const MOBILE_REGEX = /^[6-9]\d{9}$/;
const AADHAR_REGEX = /^\d{12}$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

export const ConsignorList = () => {
  const { consignors, addConsignor, updateConsignor, deleteConsignor, addConsignee, fetchConsignors, importConsignors } = useData();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingConsignor, setEditingConsignor] = useState<Consignor | undefined>(undefined);

  const [filterType, setFilterType] = useState('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteMessage, setDeleteMessage] = useState("");

  useEffect(() => {
    fetchConsignors();
  }, [fetchConsignors]);

  const clearAllFilters = () => {
    setSearch('');
    setFilterType('all');
    setCustomStart('');
    setCustomEnd('');
  };

  const filteredConsignors = useMemo(() => {
    return consignors.filter(
      c =>
        (c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.gst.toLowerCase().includes(search.toLowerCase())) &&
        (() => {
          const date = c.filingDate;
          switch (filterType) {
            case 'today': return date === getTodayDate();
            case 'yesterday': return date === getYesterdayDate();
            case 'week': return isDateInLast7Days(date);
            case 'custom': return (!customStart || date >= customStart) && (!customEnd || date <= customEnd);
            default: return true;
          }
        })()
    );
  }, [consignors, search, filterType, customStart, customEnd]);

  const {
    paginatedData,
    currentPage,
    setCurrentPage,
    totalPages,
    itemsPerPage,
    setItemsPerPage,
    totalItems,
  } = usePagination({ data: filteredConsignors, initialItemsPerPage: 10 });

  const handleEdit = (consignor: Consignor) => {
    setEditingConsignor(consignor);
    setIsFormOpen(true);
  };

  const handleDelete = (consignor: Consignor) => {
    setDeletingId(consignor.id);
    setDeleteMessage(`Are you sure you want to delete consignor "${consignor.name}"?`);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deletingId) deleteConsignor(deletingId);
    setIsConfirmOpen(false);
    setDeletingId(null);
  };

  const handleCreateNew = () => {
    setEditingConsignor(undefined);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingConsignor(undefined);
  };

  const handleFormSave = (savedConsignor: Consignor, firstConsignee?: Consignee) => {
    const exists = consignors.some(c => c.id === savedConsignor.id);
    if (exists) updateConsignor(savedConsignor);
    else addConsignor(savedConsignor);

    if (firstConsignee) addConsignee(firstConsignee);
    handleFormClose();
  };

  const handleImport = async (data: Consignor[]) => {
    await importConsignors(data);
  };

  const handleExport = () => {
    if (filteredConsignors.length === 0) {
      toast.error("No data to export");
      return;
    }
    const headers = ['Name', 'GST', 'Address', 'Mobile', 'From', 'PAN', 'Aadhar', 'Filing Date'];
    const csvContent = [
      headers.join(','),
      ...filteredConsignors.map(c => [
        `"${c.name.replace(/"/g, '""')}"`,
        `"${c.gst.replace(/"/g, '""')}"`,
        `"${(c.address || '').replace(/"/g, '""')}"`, // Handle optional address
        `"${(c.mobile || '').replace(/"/g, '""')}"`,
        `"${c.from.replace(/"/g, '""')}"`,
        `"${c.pan || ''}"`,
        `"${c.aadhar || ''}"`,
        `"${c.filingDate}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `consignors_export_${getTodayDate()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const hasActiveFilters = filterType !== 'all' || search !== '';

  const csvMapRow = (row: any) => {
    if (!row.name || !row.gst) return null; // Address check removed
    if (!GST_REGEX.test(row.gst)) return null;
    if (row.mobile && !MOBILE_REGEX.test(row.mobile)) return null;
    if (row.pan && !PAN_REGEX.test(row.pan)) return null;
    if (row.aadhar && !AADHAR_REGEX.test(row.aadhar)) return null;

    return {
      id: `cn-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: row.name,
      gst: row.gst,
      address: row.address || '', // Default to empty string if missing
      from: row.from || 'Sivakasi',
      filingDate: row.filingdate || getTodayDate(),
      mobile: row.mobile || '',
      pan: row.pan || undefined,
      aadhar: row.aadhar || undefined,
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
              placeholder="Search by name or GST..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-secondary/50 text-foreground rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60 text-sm"
            />
          </div>

          {/* Filter Button */}
          <Button
            variant={hasActiveFilters ? 'primary' : 'outline'}
            onClick={() => setShowFilters(!showFilters)}
            className="h-10 px-4 shrink-0"
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1.5 w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            )}
          </Button>

          {/* Action Buttons */}
          <Button variant="outline" onClick={handleExport} className="h-10">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <CsvImporter<Consignor>
            onImport={handleImport}
            existingData={consignors}
            label="Import Consignors"
            checkDuplicate={(newItem, existing) => 
              newItem.gst.trim().toLowerCase() === existing.gst.trim().toLowerCase()
            }
            mapRow={csvMapRow}
            // 泙 NEW: Add template prop here
            template={{
              filename: 'consignor_import_template.csv',
              columns: ['Name', 'GST', 'Address', 'Mobile', 'From', 'PAN', 'Aadhar'],
              sampleRow: ['ABC Traders', '33ABCDE1234F1Z5', '123 Main St, City', '9876543210', 'Sivakasi', 'ABCDE1234F', '123456789012']
            }}
          />
          <Button variant="primary" onClick={handleCreateNew} className="h-10">
            <Plus className="w-4 h-4" />
            Add Consignor
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
                placeholder="Search by name or GST..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-secondary/50 text-foreground rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60 text-sm"
              />
            </div>
            <Button
              variant={hasActiveFilters ? 'primary' : 'outline'}
              onClick={() => setShowFilters(!showFilters)}
              className="h-10 px-3 shrink-0"
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline ml-1">Filters</span>
              {hasActiveFilters && (
                <span className="ml-1.5 w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              )}
            </Button>
          </div>

          {/* Row 2: Action Buttons */}
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExport} className="flex-1 h-9 text-xs sm:text-sm">
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Export
            </Button>
            <CsvImporter<Consignor>
            onImport={handleImport}
            existingData={consignors}
            label="Import Consignors"
            checkDuplicate={(newItem, existing) => 
              newItem.gst.trim().toLowerCase() === existing.gst.trim().toLowerCase()
            }
            mapRow={csvMapRow}
            // 泙 NEW: Add template prop here
            template={{
              filename: 'consignor_import_template.csv',
              columns: ['Name', 'GST', 'Address', 'Mobile', 'From', 'PAN', 'Aadhar'],
              sampleRow: ['ABC Traders', '33ABCDE1234F1Z5', '123 Main St, City', '9876543210', 'Sivakasi', 'ABCDE1234F', '123456789012']
            }}
          />
            <Button variant="primary" onClick={handleCreateNew} className="flex-1 h-9 text-xs sm:text-sm">
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />Add
              {/* <span className="hidden xs:inline">Add</span>
              <span className="hidden sm:inline ml-1">Consignor</span> */}
            </Button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm animate-in slide-in-from-top-2 duration-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-foreground">Filters</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={clearAllFilters}
                className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium"
              >
                <FilterX className="w-3.5 h-3.5" />
                Clear All
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>
          </div>
          <DateFilterButtons
            filterType={filterType}
            setFilterType={setFilterType}
            customStart={customStart}
            setCustomStart={setCustomStart}
            customEnd={customEnd}
            setCustomEnd={setCustomEnd}
          />
        </div>
      )}

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
                    <User className="w-3.5 h-3.5" />
                    Consignor Name
                  </div>
                </th>
                <th className="px-4 py-3 text-left">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <Store className="w-3.5 h-3.5" />
                    GST Number
                  </div>
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider w-24">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedData.length > 0 ? (
                paginatedData.map((consignor, index) => (
                  <tr key={consignor.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-semibold text-primary">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-foreground font-medium">{consignor.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-foreground font-medium">{consignor.gst}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(consignor)}
                          className="p-1.5 rounded-md text-blue-600 hover:bg-blue-500/10 transition-colors"
                          title="Edit"
                        >
                          <FilePenLine className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(consignor)}
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
                      <Store className="w-10 h-10 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">No consignors found</p>
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
                  Name / GST
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider w-20">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedData.length > 0 ? (
                paginatedData.map((consignor, index) => (
                  <tr key={consignor.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-3">
                      <span className="font-semibold text-primary">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div>
                        <span className="text-sm text-foreground block font-medium">{consignor.name}</span>
                        <span className="text-xs text-foreground mt-0.5 block font-medium">{consignor.gst}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(consignor)}
                          className="p-1.5 rounded-md text-blue-600 hover:bg-blue-500/10 transition-colors"
                          title="Edit"
                        >
                          <FilePenLine className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(consignor)}
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
                      <Store className="w-10 h-10 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">No consignors found</p>
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
            paginatedData.map((consignor, index) => (
              <div key={consignor.id} className="p-4">
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
                      <h3 className="text-md text-foreground truncate font-medium">{consignor.name}</h3>
                      <div className="flex items-center gap-1.5 mt-1 text-foreground">
                        <Store className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="font-medium text-xs truncate">{consignor.gst}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-3 border-t border-border">
                      <button
                        onClick={() => handleEdit(consignor)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-blue-600 bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
                      >
                        <FilePenLine className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(consignor)}
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
                <Store className="w-10 h-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No consignors found</p>
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {filteredConsignors.length > 0 && (
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
        <ConsignorForm
          initialData={editingConsignor}
          onClose={handleFormClose}
          onSave={handleFormSave}
        />
      )}

      <ConfirmationDialog
        open={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Consignor"
        description={deleteMessage}
      />
    </div>
  );
};