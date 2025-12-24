import { useState, useMemo, useCallback, useEffect } from 'react';
import type { ToPlace } from '../../../types';
import {
  FilePenLine,
  Trash2,
  Search,
  Download,
  Plus,
  MapPinned,
  Hash,
  Tag,
} from 'lucide-react';
import { ToPlacesForm } from './ToPlacesForm';
import { ConfirmationDialog } from '../../../components/shared/ConfirmationDialog';
import { useData } from '../../../hooks/useData';
import { Button } from '../../../components/shared/Button';
import { usePagination } from '../../../utils/usePagination';
import { Pagination } from '../../../components/shared/Pagination';
import { CsvImporter } from '../../../components/shared/CsvImporter';
import { useToast } from '../../../contexts/ToastContext';

interface FormErrorState { general: string | null; }
export type DuplicateCheckFn = (currentPlaceName: string, currentShortName: string, editingId: string | undefined) => { place: string | null; short: string | null; };

export const ToPlacesList = () => {
  const { toPlaces, addToPlace, updateToPlace, deleteToPlace, fetchToPlaces, importToPlaces } = useData();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [shortNameFilter] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingToPlace, setEditingToPlace] = useState<ToPlace | undefined>(undefined);
  const [, setGeneralError] = useState<FormErrorState>({ general: null });

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteMessage, setDeleteMessage] = useState("");

  useEffect(() => {
    fetchToPlaces();
  }, [fetchToPlaces]);

  const filteredToPlaces = useMemo(() => {
    return toPlaces.filter(tp => {
      const matchesSearch =
        tp.placeName.toLowerCase().includes(search.toLowerCase()) ||
        tp.shortName.toLowerCase().includes(search.toLowerCase());
      const matchesShortName = !shortNameFilter || tp.shortName.toLowerCase().includes(shortNameFilter.toLowerCase());
      return matchesSearch && matchesShortName;
    });
  }, [toPlaces, search, shortNameFilter]);

  const {
    paginatedData: currentToPlaces,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    totalItems,
    totalPages
  } = usePagination({ data: filteredToPlaces, initialItemsPerPage: 10 });



  const checkDuplicates: DuplicateCheckFn = useCallback((currentPlaceName, currentShortName, editingId) => {
    let placeConflict: string | null = null;
    let shortConflict: string | null = null;
    const placeNameNormalized = currentPlaceName.trim().toLowerCase();
    const shortNameNormalized = currentShortName.trim().toLowerCase();

    toPlaces.forEach(tp => {
      if (editingId && tp.id === editingId) return;
      if (tp.placeName.toLowerCase() === placeNameNormalized && placeNameNormalized !== '') placeConflict = 'Place Name Already Exists';
      if (tp.shortName.toLowerCase() === shortNameNormalized && shortNameNormalized !== '') shortConflict = 'Short Name Already Exists';
    });
    return { place: placeConflict, short: shortConflict };
  }, [toPlaces]);

  const clearFormErrors = () => setGeneralError({ general: null });

  const handleEdit = (toPlace: ToPlace) => {
    clearFormErrors();
    setEditingToPlace(toPlace);
    setIsFormOpen(true);
  };

  const handleDelete = (toPlace: ToPlace) => {
    setDeletingId(toPlace.id);
    setDeleteMessage(`Are you sure you want to delete to place "${toPlace.placeName}"?`);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deletingId) deleteToPlace(deletingId);
    setIsConfirmOpen(false);
    setDeletingId(null);
  };

  const handleCreateNew = () => {
    clearFormErrors();
    setEditingToPlace(undefined);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingToPlace(undefined);
    clearFormErrors();
  };

  const handleFormError = (message: string) => {
    setGeneralError({ general: message });
  };

  const handleFormSave = (savedToPlace: ToPlace) => {
    clearFormErrors();
    const errors = checkDuplicates(savedToPlace.placeName, savedToPlace.shortName, editingToPlace?.id);
    if (errors.place || errors.short) {
      setGeneralError({ general: 'Cannot save due to duplicate entry.' });
      return;
    }
    if (editingToPlace) updateToPlace(savedToPlace);
    else addToPlace(savedToPlace);
    handleFormClose();
  };

  const handleImport = async (data: ToPlace[]) => {
    await importToPlaces(data);
  };

  const handleExport = () => {
    if (filteredToPlaces.length === 0) {
      toast.error("No data to export");
      return;
    }
    const headers = ['Place Name', 'Short Name'];
    const csvContent = [
      headers.join(','),
      ...filteredToPlaces.map(tp => [
        `"${tp.placeName.replace(/"/g, '""')}"`,
        `"${tp.shortName.replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'to_places_export.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const csvMapRow = (row: any) => {
    if (!row.placename || !row.shortname) return null;
    return {
      id: `tp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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


          {/* Action Buttons */}
          <Button variant="outline" onClick={handleExport} className="h-10">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <CsvImporter<ToPlace>
            onImport={handleImport}
            existingData={toPlaces}
            label="Import To Places"
            checkDuplicate={(newItem, existing) =>
              newItem.placeName.toLowerCase() === existing.placeName.toLowerCase() ||
              newItem.shortName.toLowerCase() === existing.shortName.toLowerCase()
            }
            mapRow={csvMapRow}
            // 泙 NEW: Added Template
            template={{
              filename: 'to_places_import_template.csv',
              columns: ['Place Name', 'Short Name'],
              sampleRow: ['Chennai', 'MAA']
            }}
          />
          <Button variant="primary" onClick={handleCreateNew} className="h-10">
            <Plus className="w-4 h-4" />
            Add To Place
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

          </div>

          {/* Row 2: Action Buttons */}
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExport} className="flex-1 h-9 text-xs sm:text-sm">
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Export
            </Button>
            <CsvImporter<ToPlace>
            onImport={handleImport}
            existingData={toPlaces}
            label="Import To Places"
            checkDuplicate={(newItem, existing) =>
              newItem.placeName.toLowerCase() === existing.placeName.toLowerCase() ||
              newItem.shortName.toLowerCase() === existing.shortName.toLowerCase()
            }
            mapRow={csvMapRow}
            // 泙 NEW: Added Template
            template={{
              filename: 'to_places_import_template.csv',
              columns: ['Place Name', 'Short Name'],
              sampleRow: ['Chennai', 'MAA']
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
                    <MapPinned className="w-3.5 h-3.5" />
                    To Place Name
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
              {currentToPlaces.length > 0 ? (
                currentToPlaces.map((toPlace, index) => (
                  <tr key={toPlace.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-semibold text-primary">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-foreground font-medium">{toPlace.placeName}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-foreground font-medium">{toPlace.shortName}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(toPlace)}
                          className="p-1.5 rounded-md text-blue-600 hover:bg-blue-500/10 transition-colors"
                          title="Edit"
                        >
                          <FilePenLine className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(toPlace)}
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
                      <MapPinned className="w-10 h-10 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">No to places found</p>
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
              {currentToPlaces.length > 0 ? (
                currentToPlaces.map((toPlace, index) => (
                  <tr key={toPlace.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-3">
                      <span className="font-semibold text-primary">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div>
                        <span className="text-sm font-medium text-foreground block">{toPlace.placeName}</span>
                        <span className="text-xs font-medium text-foreground mt-0.5 block">{toPlace.shortName}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(toPlace)}
                          className="p-1.5 rounded-md text-blue-600 hover:bg-blue-500/10 transition-colors"
                          title="Edit"
                        >
                          <FilePenLine className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(toPlace)}
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
                      <MapPinned className="w-10 h-10 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">No to places found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards - show on small screens only */}
        <div className="block md:hidden divide-y divide-border">
          {currentToPlaces.length > 0 ? (
            currentToPlaces.map((toPlace, index) => (
              <div key={toPlace.id} className="p-4">
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
                      <h3 className="text-md font-medium text-foreground truncate">{toPlace.placeName}</h3>
                      <div className="flex font-medium items-center gap-1.5 mt-1 text-foreground">
                        <Tag className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="text-sm truncate">{toPlace.shortName}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-3 border-t border-border">
                      <button
                        onClick={() => handleEdit(toPlace)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-blue-600 bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
                      >
                        <FilePenLine className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(toPlace)}
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
                <MapPinned className="w-10 h-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No to places found</p>
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
        <ToPlacesForm
          initialData={editingToPlace}
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