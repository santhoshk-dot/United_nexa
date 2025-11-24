
import { useState, useMemo } from 'react';
import { Trash2, Search, Printer, PackageCheck, Filter, RotateCcw, XCircle } from 'lucide-react'; 
import { DateFilterButtons, getTodayDate, getYesterdayDate, isDateInLast7Days } from '../../components/shared/DateFilterButtons';
import { ConfirmationDialog } from '../../components/shared/ConfirmationDialog';
import { useData } from '../../hooks/useData';
import { Button } from '../../components/shared/Button';
import { AutocompleteInput } from '../../components/shared/AutocompleteInput';
import { MultiSelect } from '../../components/shared/MultiSelect';
import { GcPrintManager, type GcPrintJob } from '../gc-entry/GcPrintManager';
import type { GcEntry, Consignor, Consignee } from '../../types';

import { usePagination } from '../../utils/usePagination';
import { Pagination } from '../../components/shared/Pagination';
import { StockReportPrint } from '../pending-stock/StockReportView';
import { LoadListPrintManager, type LoadListJob } from './LoadListPrintManager'; 
import { QtySelectionDialog } from './QtySelectionDialog';

type ReportJob = {
  gc: GcEntry;
  consignor?: Consignor;
  consignee?: Consignee;
};

// --- LoadingSheetEntry Main Component ---

export const LoadingSheetEntry = () => {
  const { gcEntries, deleteGcEntry, consignors, consignees, getUniqueDests } = useData();
    
  // --- Filter State ---
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [destFilter, setDestFilter] = useState('');
  const [consignorFilter, setConsignorFilter] = useState('');
  const [consigneeFilter, setConsigneeFilter] = useState<string[]>([]);

  // --- Selection and Delete State ---
  const [selectedGcIds, setSelectedGcIds] = useState<string[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // --- Quantity Selection State (KEY STATE) ---
  // Map<GC_ID, Selected_Quantity_ARRAY> stores an array of selected numbers (e.g., [1, 5, 8])
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number[]>>({}); 
  const [isQtySelectOpen, setIsQtySelectOpen] = useState(false);
  const [currentQtySelection, setCurrentQtySelection] = useState<{ gcId: string; maxQty: number } | null>(null);

  // --- Printing State ---
  const [reportPrintingJobs, setReportPrintingJobs] = useState<ReportJob[] | null>(null);
  const [gcPrintingJobs, setGcPrintingJobs] = useState<GcPrintJob[] | null>(null);
  const [loadListPrintingJobs, setLoadListPrintingJobs] = useState<LoadListJob[] | null>(null);
    
  // --- Filtering (Memoized) ---
  const filteredGcEntries = useMemo(() => {
    return gcEntries.filter(gc => { 
      const consignor = consignors.find(c => c.id === gc.consignorId);
        
      const searchMatch = 
        gc.id.toLowerCase().includes(search.toLowerCase()) ||
        (consignor && consignor.name.toLowerCase().includes(search.toLowerCase()));
        
      const date = gc.gcDate;
      const dateMatch = (() => {
        switch (filterType) {
          case 'today': return date === getTodayDate();
          case 'yesterday': return date === getYesterdayDate();
          case 'week': return isDateInLast7Days(date);
          case 'custom': return (!customStart || date >= customStart) && (!customEnd || date <= customEnd);
          default: return true;
        }
      })();
        
      const destMatch = !destFilter || gc.destination === destFilter;
      const consignorMatch = !consignorFilter || gc.consignorId === consignorFilter;
      const consigneeMatch = consigneeFilter.length === 0 || consigneeFilter.includes(gc.consigneeId);

      return searchMatch && dateMatch && destMatch && consignorMatch && consigneeMatch;
    });
  }, [gcEntries, consignors, search, filterType, customStart, customEnd, destFilter, consignorFilter, consigneeFilter]);

  // --- Dependent Utility Functions ---
  const getFilteredConsignors = (currentGcEntries: GcEntry[], currentConsignors: Consignor[]) => {
    const ids = new Set(currentGcEntries.map(gc => gc.consignorId));
    return currentConsignors
      .filter(c => ids.has(c.id))
      .map(c => ({ value: c.id, label: c.name }));
  };

  const getFilteredConsignees = (currentGcEntries: GcEntry[], currentConsignees: Consignee[]) => {
    const ids = new Set(currentGcEntries.map(gc => gc.consigneeId));
    return currentConsignees
      .filter(c => ids.has(c.id))
      .map(c => ({ value: c.id, label: c.name }));
  };
    
  // --- Independent Memoized Options (for Destination) ---
  const destinationOptions = useMemo(getUniqueDests, [getUniqueDests]);

  // --- Dependent Memoized Options ---
  const filteredConsignorOptions = useMemo(() => {
    const tempFilteredGc = gcEntries.filter(gc => {
      const consignor = consignors.find(c => c.id === gc.consignorId);
      const searchMatch = 
        gc.id.toLowerCase().includes(search.toLowerCase()) ||
        (consignor && consignor.name.toLowerCase().includes(search.toLowerCase()));
      const dateMatch = (() => {
        switch (filterType) {
          case 'today': return gc.gcDate === getTodayDate();
          case 'yesterday': return gc.gcDate === getYesterdayDate();
          case 'week': return isDateInLast7Days(gc.gcDate);
          case 'custom': return (!customStart || gc.gcDate >= customStart) && (!customEnd || gc.gcDate <= customEnd);
          default: return true;
        }
      })();
      const destMatch = !destFilter || gc.destination === destFilter;
      const consigneeMatch = consigneeFilter.length === 0 || consigneeFilter.includes(gc.consigneeId);

      return searchMatch && dateMatch && destMatch && consigneeMatch;
    });
    return getFilteredConsignors(tempFilteredGc, consignors);
  }, [gcEntries, consignors, search, filterType, customStart, customEnd, destFilter, consigneeFilter]);

  const filteredConsigneeOptions = useMemo(() => {
    const tempFilteredGc = gcEntries.filter(gc => {
      const consignor = consignors.find(c => c.id === gc.consignorId);
      const searchMatch = 
        gc.id.toLowerCase().includes(search.toLowerCase()) ||
        (consignor && consignor.name.toLowerCase().includes(search.toLowerCase()));
      const dateMatch = (() => {
        switch (filterType) {
          case 'today': return gc.gcDate === getTodayDate();
          case 'yesterday': return gc.gcDate === getYesterdayDate();
          case 'week': return isDateInLast7Days(gc.gcDate);
          case 'custom': return (!customStart || gc.gcDate >= customStart) && (!customEnd || gc.gcDate <= customEnd);
          default: return true;
        }
      })();
      const destMatch = !destFilter || gc.destination === destFilter;
      const consignorMatch = !consignorFilter || gc.consignorId === consignorFilter;

      return searchMatch && dateMatch && destMatch && consignorMatch;
    });
    return getFilteredConsignees(tempFilteredGc, consignees);
  }, [gcEntries, consignees, consignors, search, filterType, customStart, customEnd, destFilter, consignorFilter]);


  // --- Pagination ---
  const {
    paginatedData,
    currentPage,
    setCurrentPage,
    totalPages,
    itemsPerPage,
    setItemsPerPage,
    totalItems,
  } = usePagination({ data: filteredGcEntries, initialItemsPerPage: 10 });

  // --- Action Handlers ---
  const handleDelete = (gcNo: string) => {
    setDeletingId(gcNo);
    setIsConfirmOpen(true);
  };
  const handleConfirmDelete = () => {
    if (deletingId) deleteGcEntry(deletingId);
    setIsConfirmOpen(false);
    setDeletingId(null);
  };
    
  const handlePrintSingle = (gcNo: string) => {
    const gc = gcEntries.find(g => g.id === gcNo);
    if (!gc) return;
    const consignor = consignors.find(c => c.id === gc.consignorId);
    const consignee = consignees.find(c => c.id === gc.consigneeId);
        
    if (consignor && consignee) {
      setLoadListPrintingJobs([{ gc, consignor, consignee }]);
    }
    else alert("Error: Consignor or Consignee data missing for this GC.");
  };
    
  const handlePrintSelected = () => {
    if (selectedGcIds.length === 0) return;
        
    const jobs: LoadListJob[] = selectedGcIds.map(id => {
      const gc = gcEntries.find(g => g.id === id);
      if (!gc) return null;
      const consignor = consignors.find(c => c.id === gc.consignorId);
      const consignee = consignees.find(c => c.id === gc.consigneeId);
      
      if (!consignor || !consignee) return null;
      
      return { gc, consignor, consignee }; 
    }).filter(Boolean) as LoadListJob[];

    if (jobs.length > 0) {
      setLoadListPrintingJobs(jobs); 
      setSelectedGcIds([]);
    }
  };

  // --- QUANTITY SELECTION HANDLERS (Integration with QtySelectionDialog) ---
  const handleOpenQtySelect = (gc: GcEntry) => {
    const maxQty = parseInt(gc.quantity.toString()) || 1;
    setCurrentQtySelection({ gcId: gc.id, maxQty: maxQty });
    setIsQtySelectOpen(true);
  };

  const handleSaveSelectedQty = (qtyArray: number[]) => {
    if (currentQtySelection) {
      setSelectedQuantities(prev => ({
        ...prev,
        [currentQtySelection.gcId]: qtyArray
      }));
    }
    setIsQtySelectOpen(false);
    setCurrentQtySelection(null);
  };

  const handleCloseQtySelect = () => {
    setIsQtySelectOpen(false);
    setCurrentQtySelection(null);
  };

  // --- Selection Handlers ---
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedGcIds(paginatedData.map(gc => gc.id));
    else setSelectedGcIds([]);
  };
  const handleSelectRow = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    if (e.target.checked) setSelectedGcIds(prev => [...prev, id]);
    else setSelectedGcIds(prev => prev.filter(gcId => gcId !== id));
  };
    
  const isAllSelected = paginatedData.length > 0 && paginatedData.every(gc => selectedGcIds.includes(gc.id));

  // --- Clear Filters ---
  const clearAllFilters = () => {
    setSearch('');
    setFilterType('all');
    setCustomStart('');
    setCustomEnd('');
    setDestFilter('');
    setConsignorFilter('');
    setConsigneeFilter([]);
  };

  const hasActiveFilters = destFilter || consignorFilter || consigneeFilter.length > 0 || filterType !== 'all' || search !== '';

  return (
    <div className="space-y-6">
      
      {/* 1. Top Control Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-background p-4 rounded-lg shadow border border-muted">
        
        {/* LEFT: Search + Filter Toggle */}
        <div className="flex items-center gap-2 w-full md:w-1/2">
          <div className="relative flex-1">
             <input
              type="text"
              placeholder="Search by GC No or Consignor Name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background text-foreground border border-muted-foreground/30 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          </div>
          
          <Button 
            variant={hasActiveFilters ? 'primary' : 'outline'}
            onClick={() => setShowFilters(!showFilters)}
            className="h-10 px-3"
            title="Toggle Filters"
          >
            <Filter size={18} className={hasActiveFilters ? "mr-2" : ""} />
            {hasActiveFilters && "Active"}
          </Button>
        </div>

        {/* RIGHT: Actions */}
        <div className="flex gap-2 w-full md:w-auto justify-end">
          <Button 
            variant="secondary"
            onClick={handlePrintSelected}
            disabled={selectedGcIds.length === 0}
          >
            <Printer size={16} className="mr-2" />
            Print Selected ({selectedGcIds.length})
          </Button>
        </div>
      </div>

      {/* 2. Collapsible Filters */}
      {showFilters && (
        <div className="p-4 bg-muted/20 rounded-lg border border-muted animate-in fade-in slide-in-from-top-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Advanced Filters</h3>
            <div className="flex gap-2">
              <button 
                onClick={clearAllFilters} 
                className="text-xs flex items-center text-primary hover:text-primary/80 font-medium"
              >
                <RotateCcw size={14} className="mr-1" /> Clear All
              </button>
              <button onClick={() => setShowFilters(false)} className="text-muted-foreground hover:text-foreground ml-2">
                <XCircle size={18} />
              </button>
            </div>
          </div>
            
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
             <AutocompleteInput
                label="Filter by Destination"
                options={destinationOptions} 
                value={destFilter}
                onSelect={setDestFilter}
                placeholder="Type to search destination..."
              />
              <AutocompleteInput
                label="Filter by Consignor"
                options={filteredConsignorOptions} 
                value={consignorFilter}
                onSelect={setConsignorFilter}
                placeholder="Type to search consignor..."
              />
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Filter by Consignee (Multi-select)</label>
                <MultiSelect
                  options={filteredConsigneeOptions}
                  selected={consigneeFilter}
                  onChange={setConsigneeFilter}
                  placeholder="Select consignees..."
                  searchPlaceholder="Search..."
                  emptyPlaceholder="None found."
                />
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

      {/* 3. Responsive Data Display */}
      <div className="bg-background rounded-lg shadow border border-muted overflow-hidden">
        {/* --- DESKTOP TABLE --- */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-muted">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-primary border-muted-foreground/30 rounded focus:ring-primary"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">GC No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Consignor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Consignee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Packing DTS</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Content DTS</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">QTY (Total)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">QTY (Loaded)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted">
              {paginatedData.map((gc) => {
                const consignor = consignors.find(c => c.id === gc.consignorId);
                const consignee = consignees.find(c => c.id === gc.consigneeId);
                const loadedCount = selectedQuantities[gc.id]?.length || 0;
                const totalCount = parseInt(gc.quantity.toString()) || 0;
                
                const isPartiallyLoaded = loadedCount > 0 && loadedCount < totalCount;
                const isFullyLoaded = loadedCount === totalCount && totalCount > 0;

                return (
                  <tr key={gc.id}>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-primary border-muted-foreground/30 rounded focus:ring-primary"
                        checked={selectedGcIds.includes(gc.id)}
                        onChange={(e) => handleSelectRow(e, gc.id)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-primary">{gc.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{consignor?.name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{consignee?.name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{gc.packing || '-'}</td> 
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{gc.contents || '-'}</td> 
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{totalCount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold" style={{ color: isFullyLoaded ? 'green' : isPartiallyLoaded ? 'orange' : 'inherit' }}>
                        {loadedCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3 flex items-center">
                       {/* Button to open Quantity Selection Dialog */}
                      <button 
                        onClick={() => handleOpenQtySelect(gc)} 
                        className={`hover:text-blue-800 h-auto flex items-center ${isFullyLoaded ? 'text-green-600' : 'text-blue-600'}`}
                        title={`Loaded Qty (${loadedCount}/${totalCount})`} 
                      >
                        <PackageCheck size={18} />
                      </button>
                      <button onClick={() => handlePrintSingle(gc.id)} className="text-green-600 hover:text-green-800" title="Print Load Slip">
                        <Printer size={18} />
                      </button>
                      <button onClick={() => handleDelete(gc.id)} className="text-destructive hover:text-destructive/80" title="Delete">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* --- MOBILE CARD LIST --- */}
        <div className="block md:hidden divide-y divide-muted">
          {paginatedData.map((gc) => {
                const consignor = consignors.find(c => c.id === gc.consignorId);
                const consignee = consignees.find(c => c.id === gc.consigneeId);
                const loadedCount = selectedQuantities[gc.id]?.length || 0;
                const totalCount = parseInt(gc.quantity.toString()) || 0;
                const isPartiallyLoaded = loadedCount > 0 && loadedCount < totalCount;
                const isFullyLoaded = loadedCount === totalCount && totalCount > 0;
                
              return (
                <div key={gc.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-primary border-muted-foreground/30 rounded focus:ring-primary mt-1.5"
                        checked={selectedGcIds.includes(gc.id)}
                        onChange={(e) => handleSelectRow(e, gc.id)}
                      />
                      <div>
                        <div className="text-lg font-semibold text-primary">GC #{gc.id}</div>
                        <div className="text-md font-medium text-foreground">From: {consignor?.name || 'N/A'}</div>
                        <div className="text-sm text-muted-foreground">To: {consignee?.name || 'N/A'}</div>
                        <div className="text-sm text-muted-foreground">Packing: {gc.packing || '-'}</div>
                        <div className="text-sm text-muted-foreground">Content: {gc.contents || '-'}</div>
                      </div>
                    </div>
                    <div className="flex flex-col space-y-3 pt-1">
                      {/* Button to open Quantity Selection Dialog */}
                      <button 
                        onClick={() => handleOpenQtySelect(gc)} 
                        className={`hover:text-blue-800 h-auto ${isFullyLoaded ? 'text-green-600' : 'text-blue-600'}`}
                        title={`Loaded Qty (${loadedCount}/${totalCount})`}
                      >
                        <PackageCheck size={18} />
                      </button>
                      <button onClick={() => handlePrintSingle(gc.id)} className="text-green-600" title="Print Load Slip">
                        <Printer size={18} />
                      </button>
                      <button onClick={() => handleDelete(gc.id)} className="text-destructive" title="Delete">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between mt-2 pt-2 border-t border-muted">
                    <span className="text-sm font-medium">Case Qty: <span className="text-foreground">{totalCount}</span></span>
                    <span className="text-sm font-medium">Loaded Qty: <span className="font-bold" style={{ color: isFullyLoaded ? 'green' : isPartiallyLoaded ? 'orange' : 'inherit' }}>{loadedCount}</span></span>
                  </div>
                </div>
              );
            })}
        </div>

        {/* No results message (Inside Table Container) */}
        {filteredGcEntries.length === 0 && (
          <div className="text-center py-24 text-muted-foreground">
            No GC Entries match the selected filters.
          </div>
        )}

        {/* --- PAGINATION (Always visible at bottom) --- */}
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
      </div>

      {/* Modals (Print Managers & Confirmation) */}
      <ConfirmationDialog
        open={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete GC Entry"
        description={`Are you sure you want to delete GC No: ${deletingId}? This action cannot be undone.`}
      />
      
      {reportPrintingJobs && (
        <StockReportPrint 
          jobs={reportPrintingJobs} 
          onClose={() => setReportPrintingJobs(null)} 
        />
      )}
      
      {gcPrintingJobs && (
        <GcPrintManager
          jobs={gcPrintingJobs}
          onClose={() => setGcPrintingJobs(null)}
        />
      )}
      
      {loadListPrintingJobs && (
        <LoadListPrintManager
          jobs={loadListPrintingJobs}
          onClose={() => setLoadListPrintingJobs(null)}
        />
      )}

      {/* Quantity Selection Modal with Drag-and-Drop */}
      {currentQtySelection && (
        <QtySelectionDialog
          open={isQtySelectOpen}
          onClose={handleCloseQtySelect}
          onSelect={handleSaveSelectedQty}
          gcId={currentQtySelection.gcId}
          maxQty={currentQtySelection.maxQty}
          // Pass the current selections for this GC to the dialog
          currentSelected={selectedQuantities[currentQtySelection.gcId] || []} 
        />
      )}
    </div>
  );
};