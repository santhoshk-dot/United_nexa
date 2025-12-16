import { useState, useMemo, useCallback, useEffect } from 'react';
import type { FromPlace } from '../../../types';
import {
  FilePenLine,
  Trash2,
  Search,
  Download,
  Plus,
  FilterX,
  MapPin,
  Hash,
  Tag,
  ChevronUp,
} from 'lucide-react';
import { FromPlacesForm } from './FromPlacesForm';
import { ConfirmationDialog } from '../../../components/shared/ConfirmationDialog';
import { useData } from '../../../hooks/useData';
import { Button } from '../../../components/shared/Button';
import { usePagination } from '../../../utils/usePagination';
import { Pagination } from '../../../components/shared/Pagination';
import { CsvImporter } from '../../../components/shared/CsvImporter';
import { useToast } from '../../../contexts/ToastContext';

interface FormErrorState { general: string | null; }
export type DuplicateCheckFn = (currentPlaceName: string, currentShortName: string, editingId: string | undefined) => { place: string | null; short: string | null; };

export const FromPlaceList = () => {
  const { fromPlaces, addFromPlace, updateFromPlace, deleteFromPlace, fetchFromPlaces, importFromPlaces } = useData();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [shortNameFilter, setShortNameFilter] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFromPlace, setEditingFromPlace] = useState<FromPlace | undefined>(undefined);
  const [, setGeneralError] = useState<FormErrorState>({ general: null });

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteMessage, setDeleteMessage] = useState("");

  useEffect(() => {
    fetchFromPlaces();
  }, [fetchFromPlaces]);

  const filteredFromPlaces = useMemo(() => {
    return fromPlaces.filter(fp => {
      const matchesSearch =
        fp.placeName.toLowerCase().includes(search.toLowerCase()) ||
        fp.shortName.toLowerCase().includes(search.toLowerCase());
      const matchesShortName = !shortNameFilter || fp.shortName.toLowerCase().includes(shortNameFilter.toLowerCase());
      return matchesSearch && matchesShortName;
    });
  }, [fromPlaces, search, shortNameFilter]);

  const {
    paginatedData: currentFromPlaces,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    totalItems,
    totalPages
  } = usePagination({ data: filteredFromPlaces, initialItemsPerPage: 10 });


  const clearAllFilters = () => {
    setSearch('');
    setShortNameFilter('');
  };

  const checkDuplicates: DuplicateCheckFn = useCallback((currentPlaceName, currentShortName, editingId) => {
    let placeConflict: string | null = null;
    let shortConflict: string | null = null;
    const placeNameNormalized = currentPlaceName.trim().toLowerCase();
    const shortNameNormalized = currentShortName.trim().toLowerCase();

    fromPlaces.forEach(fp => {
      if (editingId && fp.id === editingId) return;
      if (fp.placeName.toLowerCase() === placeNameNormalized && placeNameNormalized !== '') placeConflict = 'Place Name Already Exists';
      if (fp.shortName.toLowerCase() === shortNameNormalized && shortNameNormalized !== '') shortConflict = 'Short Name Already Exists';
    });
    return { place: placeConflict, short: shortConflict };
  }, [fromPlaces]);

  const clearFormErrors = () => setGeneralError({ general: null });

  const handleEdit = (fromPlace: FromPlace) => {
    clearFormErrors();
    setEditingFromPlace(fromPlace);
    setIsFormOpen(true);
  };

  const handleDelete = (fromPlace: FromPlace) => {
    setDeletingId(fromPlace.id);
    setDeleteMessage(`Are you sure you want to delete from place "${fromPlace.placeName}"?`);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deletingId) deleteFromPlace(deletingId);
    setIsConfirmOpen(false);
    setDeletingId(null);
  };

  const handleCreateNew = () => {
    clearFormErrors();
    setEditingFromPlace(undefined);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingFromPlace(undefined);
    clearFormErrors();
  };

  const handleFormError = (message: string) => {
    setGeneralError({ general: message });
  };

  const handleFormSave = (savedFromPlace: FromPlace) => {
    clearFormErrors();
    const errors = checkDuplicates(savedFromPlace.placeName, savedFromPlace.shortName, editingFromPlace?.id);
    if (errors.place || errors.short) {
      setGeneralError({ general: 'Cannot save due to duplicate entry.' });
      return;
    }
    if (editingFromPlace) updateFromPlace(savedFromPlace);
    else addFromPlace(savedFromPlace);
    handleFormClose();
  };

  const handleImport = async (data: FromPlace[]) => {
    await importFromPlaces(data);
  };

  const handleExport = () => {
    if (filteredFromPlaces.length === 0) {
      toast.error("No data to export");
      return;
    }
    const headers = ['Place Name', 'Short Name'];
    const csvContent = [
      headers.join(','),
      ...filteredFromPlaces.map(fp => [
        `"${fp.placeName.replace(/"/g, '""')}"`,
        `"${fp.shortName.replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'from_places_export.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const csvMapRow = (row: any) => {
    if (!row.placename || !row.shortname) return null;
    return {
      id: `fp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      placeName: row.placename,
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
              placeholder="Search by Place Name or Short Name..."
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
          <CsvImporter<FromPlace>
            onImport={handleImport}
            existingData={fromPlaces}
            label="Import From Places"
            checkDuplicate={(newItem, existing) =>
              newItem.placeName.toLowerCase() === existing.placeName.toLowerCase() ||
              newItem.shortName.toLowerCase() === existing.shortName.toLowerCase()
            }
            mapRow={csvMapRow}
            // 泙 NEW: Added Template
            template={{
              filename: 'from_places_import_template.csv',
              columns: ['Place Name', 'Short Name'],
              sampleRow: ['Sivakasi', 'SVKS']
            }}
          />
          <Button variant="primary" onClick={handleCreateNew} className="h-10">
            <Plus className="w-4 h-4" />
            Add From Place
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
                placeholder="Search places..."
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
           <CsvImporter<FromPlace>
            onImport={handleImport}
            existingData={fromPlaces}
            label="Import From Places"
            checkDuplicate={(newItem, existing) =>
              newItem.placeName.toLowerCase() === existing.placeName.toLowerCase() ||
              newItem.shortName.toLowerCase() === existing.shortName.toLowerCase()
            }
            mapRow={csvMapRow}
            // 泙 NEW: Added Template
            template={{
              filename: 'from_places_import_template.csv',
              columns: ['Place Name', 'Short Name'],
              sampleRow: ['Sivakasi', 'SVKS']
            }}
          />
            <Button variant="primary" onClick={handleCreateNew} className="flex-1 h-9 text-xs sm:text-sm">
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />Add
              {/* <span className="hidden xs:inline">Add</span>
              <span className="hidden sm:inline ml-1">Place</span> */}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Short Name</label>
              <input
                type="text"
                placeholder="Filter by short name..."
                value={shortNameFilter}
                onChange={(e) => setShortNameFilter(e.target.value)}
                className="w-full h-10 px-3 bg-secondary/50 text-foreground rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60 text-sm"
              />
            </div>
          </div>
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
                    <MapPin className="w-3.5 h-3.5" />
                    From Place Name
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
              {currentFromPlaces.length > 0 ? (
                currentFromPlaces.map((fromPlace, index) => (
                  <tr key={fromPlace.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-semibold text-primary">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-foreground font-medium">{fromPlace.placeName}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-foreground font-medium">{fromPlace.shortName}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(fromPlace)}
                          className="p-1.5 rounded-md text-blue-600 hover:bg-blue-500/10 transition-colors"
                          title="Edit"
                        >
                          <FilePenLine className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(fromPlace)}
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
                      <MapPin className="w-10 h-10 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">No from places found</p>
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
                  Place Name / Short Name
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider w-20">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {currentFromPlaces.length > 0 ? (
                currentFromPlaces.map((fromPlace, index) => (
                  <tr key={fromPlace.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-3">
                      <span className="font-semibold text-primary">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div>
                        <span className="text-sm font-medium text-foreground block">{fromPlace.placeName}</span>
                        <span className="text-xs font-medium text-foreground mt-0.5 block">{fromPlace.shortName}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(fromPlace)}
                          className="p-1.5 rounded-md text-blue-600 hover:bg-blue-500/10 transition-colors"
                          title="Edit"
                        >
                          <FilePenLine className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(fromPlace)}
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
                      <MapPin className="w-10 h-10 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">No from places found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards - show on small screens only */}
        <div className="block md:hidden divide-y divide-border">
          {currentFromPlaces.length > 0 ? (
            currentFromPlaces.map((fromPlace, index) => (
              <div key={fromPlace.id} className="p-4">
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
                      <h3 className="text-md font-medium text-foreground truncate">{fromPlace.placeName}</h3>
                      <div className="flex font-medium items-center gap-1.5 mt-1 text-foreground">
                        <Tag className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="text-sm truncate">{fromPlace.shortName}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-3 border-t border-border">
                      <button
                        onClick={() => handleEdit(fromPlace)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-blue-600 bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
                      >
                        <FilePenLine className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(fromPlace)}
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
                <MapPin className="w-10 h-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No from places found</p>
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalItems > 0 && (
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
        <FromPlacesForm
          initialData={editingFromPlace}
          onClose={handleFormClose}
          onSave={handleFormSave}
          onError={handleFormError}
          checkDuplicates={checkDuplicates}
        />
      )}

      <ConfirmationDialog
        open={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Entry"
        description={deleteMessage}
      />
    </div>
  );
};