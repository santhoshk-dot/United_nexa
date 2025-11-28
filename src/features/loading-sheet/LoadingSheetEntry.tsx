import { useState, useMemo, useEffect } from 'react';
import { Trash2, Search, Printer, PackageCheck, Filter, RotateCcw, XCircle } from 'lucide-react';
import { DateFilterButtons, getTodayDate, getYesterdayDate } from '../../components/shared/DateFilterButtons';
import { ConfirmationDialog } from '../../components/shared/ConfirmationDialog';
import { useData } from '../../hooks/useData';
import { Button } from '../../components/shared/Button';
import { AutocompleteInput } from '../../components/shared/AutocompleteInput';
import { MultiSelect } from '../../components/shared/MultiSelect';
import { GcPrintManager, type GcPrintJob } from '../gc-entry/GcPrintManager';
import type { GcEntry, Consignor, Consignee } from '../../types';

import { useServerPagination } from '../../hooks/useServerPagination';
import { Pagination } from '../../components/shared/Pagination';
import { StockReportPrint } from '../pending-stock/StockReportView';
import { LoadListPrintManager, type LoadListJob } from './LoadListPrintManager';
import { QtySelectionDialog } from './QtySelectionDialog';

type ReportJob = {
  gc: GcEntry;
  consignor?: Consignor;
  consignee?: Consignee;
};

export const LoadingSheetEntry = () => {
  const { deleteGcEntry, consignors, consignees, getUniqueDests, saveLoadingProgress, fetchGcById, fetchLoadingSheetPrintData } = useData();

  // --- SERVER-SIDE PAGINATION HOOK ---
  const {
    data: paginatedData,
    loading,
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    setItemsPerPage,
    setFilters,
    filters,
    refresh
  } = useServerPagination<GcEntry & { loadedCount?: number }>({ 
    endpoint: '/operations/loading-sheet',
    initialFilters: { search: '', filterType: 'all' },
    initialItemsPerPage: 5
  });

  // --- UI State ---
  const [showFilters, setShowFilters] = useState(false);
  
  // --- Selection and Delete State ---
  const [selectedGcIds, setSelectedGcIds] = useState<string[]>([]);
  // NEW: Select All Mode
  const [selectAllMode, setSelectAllMode] = useState(false);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteMessage, setDeleteMessage] = useState("");

  // --- Quantity Selection State ---
  const [isQtySelectOpen, setIsQtySelectOpen] = useState(false);
  const [currentQtySelection, setCurrentQtySelection] = useState<{ gcId: string; maxQty: number; startNo: number; loadedPackages: number[] } | null>(null);

  // --- Printing State ---
  const [reportPrintingJobs, setReportPrintingJobs] = useState<ReportJob[] | null>(null);
  const [gcPrintingJobs, setGcPrintingJobs] = useState<GcPrintJob[] | null>(null);
  const [loadListPrintingJobs, setLoadListPrintingJobs] = useState<LoadListJob[] | null>(null);

  // --- Filter Handlers ---
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ search: e.target.value });
  };

  const handleFilterTypeChange = (type: string) => {
    let start = '';
    let end = '';
    
    if (type === 'today') {
        start = getTodayDate();
        end = getTodayDate();
    } else if (type === 'yesterday') {
        start = getYesterdayDate();
        end = getYesterdayDate();
    } else if (type === 'week') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        start = d.toISOString().split('T')[0];
        end = getTodayDate();
    }

    setFilters({ 
        filterType: type, 
        startDate: start, 
        endDate: end,
        customStart: '', 
        customEnd: ''
    });
  };

  const handleCustomDateChange = (start: string, end: string) => {
      setFilters({ 
          filterType: 'custom', 
          customStart: start, 
          customEnd: end,
          startDate: start,
          endDate: end
      });
  };

  const clearAllFilters = () => {
    setFilters({ 
        search: '', 
        filterType: 'all', 
        startDate: '', 
        endDate: '', 
        destination: '', 
        consignor: '', 
        consignee: [] 
    });
  };

  const destinationOptions = useMemo(getUniqueDests, [getUniqueDests]);
  const allConsignorOptions = useMemo(() => consignors.map(c => ({ value: c.id, label: c.name })), [consignors]);
  const allConsigneeOptions = useMemo(() => consignees.map(c => ({ value: c.id, label: c.name })), [consignees]);

  // --- ACTIONS ---

  const handleDelete = (gcNo: string) => {
    setDeletingId(gcNo);
    setDeleteMessage(`Are you sure you want to delete GC #${gcNo}?`);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deletingId) {
      await deleteGcEntry(deletingId);
      refresh();
    }
    setIsConfirmOpen(false);
    setDeletingId(null);
  };

  const handlePrintSingle = async (gcNo: string) => {
    try {
        const printData = await fetchLoadingSheetPrintData([gcNo]);
        
        if (printData && printData.length > 0) {
            const item = printData[0];
            const { consignor, consignee, ...gcData } = item;
            
            setLoadListPrintingJobs([{
                gc: gcData as GcEntry,
                consignor: { ...consignor, id: consignor.id || consignor._id || 'unknown' } as Consignor,
                consignee: { ...consignee, id: consignee.id || consignee._id || 'unknown' } as Consignee
            }]);
        } else {
            alert("Failed to fetch GC details.");
        }
    } catch (error) {
        console.error("Print error:", error);
        alert("An error occurred while fetching print data.");
    }
  };

  // --- OPTIMIZED BULK PRINT ---
  const handlePrintSelected = async () => {
    if (selectedGcIds.length === 0 && !selectAllMode) return;

    try {
        let results = [];
        
        if (selectAllMode) {
            // Fetch ALL matching data based on filters
            results = await fetchLoadingSheetPrintData([], true, filters);
        } else {
            // Fetch specifically selected IDs
            results = await fetchLoadingSheetPrintData(selectedGcIds);
        }

        if (!results || results.length === 0) {
            alert("No data received for selected GCs.");
            return;
        }

        // Map backend response to LoadListJob format
        const jobs: LoadListJob[] = results.map((item: any) => {
            const { consignor, consignee, ...gcData } = item;
            
            return {
                gc: gcData as GcEntry,
                consignor: { 
                    ...consignor, 
                    id: consignor.id || consignor._id // Map _id if id is missing
                } as Consignor,
                consignee: { 
                    ...consignee, 
                    id: consignee.id || consignee._id 
                } as Consignee
            };
        });

        if (jobs.length > 0) {
            setLoadListPrintingJobs(jobs);
            if (!selectAllMode) setSelectedGcIds([]);
            setSelectAllMode(false);
        }
    } catch (error) {
        console.error("Bulk print failed", error);
        alert("Failed to prepare print jobs.");
    }
  };

  const handleOpenQtySelect = async (gc: GcEntry) => {
    const fullGc = await fetchGcById(gc.gcNo);
    
    if (fullGc) {
        const maxQty = parseInt(fullGc.quantity.toString()) || 1;
        const startNo = parseInt(fullGc.fromNo) || 1;
        const currentLoaded = fullGc.loadedPackages || [];

        setCurrentQtySelection({ 
            gcId: fullGc.gcNo, 
            maxQty: maxQty, 
            startNo: startNo,
            loadedPackages: currentLoaded
        });
        setIsQtySelectOpen(true);
    } else {
        alert("Failed to load GC details.");
    }
  };

  const handleSaveSelectedQty = async (qtyArray: number[]) => {
    if (currentQtySelection) {
      await saveLoadingProgress(currentQtySelection.gcId, qtyArray);
      refresh(); 
    }
    setIsQtySelectOpen(false);
    setCurrentQtySelection(null);
  };

  const handleCloseQtySelect = () => {
    setIsQtySelectOpen(false);
    setCurrentQtySelection(null);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
        setSelectAllMode(true);
        setSelectedGcIds(paginatedData.map(gc => gc.gcNo));
    } else {
        setSelectAllMode(false);
        setSelectedGcIds([]);
    }
  };
  
  // Keep visual selection in sync if Select All is active
  useEffect(() => {
    if (selectAllMode) {
        setSelectedGcIds(paginatedData.map(gc => gc.gcNo));
    }
  }, [paginatedData, selectAllMode]);

  const handleSelectRow = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    if (selectAllMode) {
        setSelectAllMode(false);
        if (!e.target.checked) {
            setSelectedGcIds(prev => prev.filter(gcId => gcId !== id));
        }
    } else {
        if (e.target.checked) setSelectedGcIds(prev => [...prev, id]);
        else setSelectedGcIds(prev => prev.filter(gcId => gcId !== id));
    }
  };

  const isAllSelected = selectAllMode || (paginatedData.length > 0 && paginatedData.every(gc => selectedGcIds.includes(gc.gcNo)));
  const hasActiveFilters = !!filters.destination || !!filters.consignor || (filters.consignee && filters.consignee.length > 0) || filters.filterType !== 'all' || !!filters.search;
  const responsiveBtnClass = "flex-1 md:flex-none text-[10px] xs:text-xs sm:text-sm h-8 sm:h-10 px-1 sm:px-4 whitespace-nowrap";

  // Calculate display count
  const printButtonText = selectAllMode 
    ? `Print All (${totalItems})` 
    : `Print (${selectedGcIds.length})`;

  return (
    <div className="space-y-6">

      {/* 1. Top Control Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-background p-4 rounded-lg shadow border border-muted">

        {/* LEFT: Search + Filter Toggle */}
        <div className="flex items-center gap-2 w-full md:w-1/2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search all data..."
              value={filters.search || ''}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 bg-background text-foreground border border-muted-foreground/30 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          </div>

          <Button
            variant={hasActiveFilters ? 'primary' : 'outline'}
            onClick={() => setShowFilters(!showFilters)}
            className="h-10 px-3 shrink-0"
            title="Toggle Filters"
          >
            <Filter size={18} className={hasActiveFilters ? "mr-2" : ""} />
            {hasActiveFilters && "Active"}
          </Button>
        </div>

        {/* RIGHT: Actions */}
        <div className="flex gap-2 w-full md:w-auto justify-between md:justify-end">
          <Button
            variant="secondary"
            onClick={handlePrintSelected}
            disabled={selectedGcIds.length === 0 && !selectAllMode}
            className={responsiveBtnClass}
          >
            <Printer size={14} className="mr-1 sm:mr-2" />
            {printButtonText}
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
              value={filters.destination || ''}
              onSelect={(val) => setFilters({ destination: val })}
              placeholder="Type to search destination..."
            />
            <AutocompleteInput
              label="Filter by Consignor"
              options={allConsignorOptions}
              value={filters.consignor || ''}
              onSelect={(val) => setFilters({ consignor: val })}
              placeholder="Type to search consignor..."
            />
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Filter by Consignee (Multi-select)</label>
              <MultiSelect
                options={allConsigneeOptions}
                selected={filters.consignee || []}
                onChange={(val) => setFilters({ consignee: val })}
                placeholder="Select consignees..."
                searchPlaceholder="Search..."
                emptyPlaceholder="None found."
              />
            </div>
          </div>

          <DateFilterButtons
            filterType={filters.filterType || 'all'} 
            setFilterType={handleFilterTypeChange} 
            customStart={filters.customStart || ''} 
            setCustomStart={(val) => handleCustomDateChange(val, filters.customEnd)} 
            customEnd={filters.customEnd || ''} 
            setCustomEnd={(val) => handleCustomDateChange(filters.customStart, val)} 
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
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">QTY (Pending)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted">
              {loading ? (
                 <tr><td colSpan={9} className="px-6 py-12 text-center">Loading data...</td></tr>
              ) : paginatedData.length > 0 ? (
                paginatedData.map((gc) => {
                  const consignor = consignors.find(c => c.id === gc.consignorId);
                  const consignee = consignees.find(c => c.id === gc.consigneeId);
                  
                  const loadedCount = gc.loadedCount || 0;
                  const totalCount = parseInt(gc.quantity.toString()) || 0;
                  const pendingCount = totalCount - loadedCount;

                  const isPartiallyPending = pendingCount > 0 && pendingCount < totalCount;
                  const isFullyPending = pendingCount === totalCount && totalCount > 0;

                  return (
                    <tr key={gc.gcNo}>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-primary border-muted-foreground/30 rounded focus:ring-primary"
                          checked={selectedGcIds.includes(gc.gcNo)}
                          onChange={(e) => handleSelectRow(e, gc.gcNo)}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-primary">{gc.gcNo}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{consignor?.name || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{consignee?.name || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{gc.packing || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{gc.contents || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{totalCount}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${isFullyPending ? 'text-foreground' : isPartiallyPending ? 'text-orange-500' : 'text-green-600'}`}>
                        {pendingCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3 flex items-center">
                        <button
                          onClick={() => handleOpenQtySelect(gc)}
                          className={`hover:text-blue-800 h-auto flex items-center text-blue-600`}
                          title={`Pending Qty (${pendingCount}/${totalCount})`}
                        >
                          <PackageCheck size={18} />
                        </button>
                        <button onClick={() => handlePrintSingle(gc.gcNo)} className="text-green-600 hover:text-green-800" title="Print Load Slip">
                          <Printer size={18} />
                        </button>
                        <button onClick={() => handleDelete(gc.gcNo)} className="text-destructive hover:text-destructive/80" title="Delete">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={9} className="px-6 py-12 text-center text-muted-foreground">No entries found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* --- MOBILE CARD LIST --- */}
        <div className="block md:hidden divide-y divide-muted">
          {paginatedData.length > 0 ? (
            paginatedData.map((gc) => {
              const consignor = consignors.find(c => c.id === gc.consignorId);
              const consignee = consignees.find(c => c.id === gc.consigneeId);
              
              const loadedCount = gc.loadedCount || 0;
              const totalCount = parseInt(gc.quantity.toString()) || 0;
              const pendingCount = totalCount - loadedCount;
              const isPartiallyPending = pendingCount > 0 && pendingCount < totalCount;
              const isFullyPending = pendingCount === totalCount && totalCount > 0;

              return (
                <div key={gc.gcNo} className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-primary border-muted-foreground/30 rounded focus:ring-primary mt-1.5"
                        checked={selectedGcIds.includes(gc.gcNo)}
                        onChange={(e) => handleSelectRow(e, gc.gcNo)}
                      />
                      <div>
                        <div className="text-lg font-semibold text-primary">GC #{gc.gcNo}</div>
                        <div className="text-md font-medium text-foreground">From: {consignor?.name || 'N/A'}</div>
                        <div className="text-sm text-muted-foreground">To: {consignee?.name || 'N/A'}</div>
                        <div className="text-sm text-muted-foreground">Packing: {gc.packing || '-'}</div>
                        <div className="text-sm text-muted-foreground">Content: {gc.contents || '-'}</div>
                      </div>
                    </div>
                    <div className="flex flex-col space-y-3 pt-1">
                      <button
                        onClick={() => handleOpenQtySelect(gc)}
                        className={`hover:text-blue-800 h-auto ${isFullyPending ? 'text-red-600' : 'text-blue-600'}`}
                        title={`Pending Qty (${pendingCount}/${totalCount})`}
                      >
                        <PackageCheck size={18} />
                      </button>
                      <button onClick={() => handlePrintSingle(gc.gcNo)} className="text-green-600" title="Print Load Slip">
                        <Printer size={18} />
                      </button>
                      <button onClick={() => handleDelete(gc.gcNo)} className="text-destructive" title="Delete">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between mt-2 pt-2 border-t border-muted">
                    <span className="text-sm font-medium">Case Qty: <span className="text-foreground">{totalCount}</span></span>
                    <span className="text-sm font-medium">Pending Qty: <span className={`font-bold ${isFullyPending ? 'text-foreground' : isPartiallyPending ? 'text-orange-500' : 'text-green-600'}`}>{pendingCount}</span></span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-muted-foreground">No entries found.</div>
          )}
        </div>

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

      <ConfirmationDialog
        open={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete GC Entry"
        description={deleteMessage} 
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

      {currentQtySelection && (
        <QtySelectionDialog
          open={isQtySelectOpen}
          onClose={handleCloseQtySelect}
          onSelect={handleSaveSelectedQty}
          gcId={currentQtySelection.gcId}
          maxQty={currentQtySelection.maxQty}
          startNo={currentQtySelection.startNo}
          currentSelected={currentQtySelection.loadedPackages}
        />
      )}
    </div>
  );
};