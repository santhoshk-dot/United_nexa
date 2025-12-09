import { useState, useEffect, useCallback } from 'react';
import { Trash2, Search, Printer, PackageCheck, Filter, XCircle, FilterX, ChevronUp } from 'lucide-react';
import { DateFilterButtons, getTodayDate, getYesterdayDate } from '../../components/shared/DateFilterButtons';
import { ConfirmationDialog } from '../../components/shared/ConfirmationDialog';
import { useData } from '../../hooks/useData';
import { Button } from '../../components/shared/Button';
import { AsyncAutocomplete } from '../../components/shared/AsyncAutocomplete';
import { GcPrintManager, type GcPrintJob } from '../gc-entry/GcPrintManager';
import type { GcEntry, Consignor, Consignee } from '../../types';

import { useServerPagination } from '../../hooks/useServerPagination';
import { Pagination } from '../../components/shared/Pagination';
import { StockReportPrint } from '../pending-stock/StockReportView';
import { LoadListPrintManager, type LoadListJob } from './LoadListPrintManager';
import { QtySelectionDialog } from './QtySelectionDialog';
import { useToast } from '../../contexts/ToastContext';

export const LoadingSheetEntry = () => {
  const {
    deleteGcEntry,
    saveLoadingProgress,
    fetchGcById,
    fetchLoadingSheetPrintData,
    searchConsignors,
    searchConsignees,
    searchToPlaces,
    searchGodowns
  } = useData();

  const toast = useToast();

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
  } = useServerPagination<GcEntry & { loadedCount?: number, consignorId?: string, destination?: string, totalQty?: number }>({
    endpoint: '/operations/loading-sheet',
    initialFilters: { search: '', filterType: 'all' },
    initialItemsPerPage: 10
  });

  // --- UI State ---
  const [showFilters, setShowFilters] = useState(false);
  const [destinationOption, setDestinationOption] = useState<any>(null);
  const [consignorOption, setConsignorOption] = useState<any>(null);
  const [godownOption, setGodownOption] = useState<any>(null);
  const [consigneeOptions, setConsigneeOptions] = useState<any[]>([]);

  // --- Selection State ---
  const [selectedGcIds, setSelectedGcIds] = useState<string[]>([]);
  const [selectAllMode, setSelectAllMode] = useState(false);
  const [excludedGcIds, setExcludedGcIds] = useState<string[]>([]);

  // --- Print/Modal State ---
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteMessage, setDeleteMessage] = useState("");
  const [isQtySelectOpen, setIsQtySelectOpen] = useState(false);
  
  // 🟢 UPDATED: State includes 'contentItems' for multi-item selection support
  const [currentQtySelection, setCurrentQtySelection] = useState<{ 
    gcId: string; 
    maxQty: number; 
    startNo: number; 
    loadedPackages: number[];
    contentItems: any[]; // Added field
  } | null>(null);
  
  const [reportPrintingJobs, setReportPrintingJobs] = useState<any[] | null>(null);
  const [gcPrintingJobs, setGcPrintingJobs] = useState<GcPrintJob[] | null>(null);
  const [loadListPrintingJobs, setLoadListPrintingJobs] = useState<LoadListJob[] | null>(null);

  // --- Filter Handlers (Unchanged) ---
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
    setDestinationOption(null);
    setConsignorOption(null);
    setConsigneeOptions([]);
    setGodownOption(null);

    setFilters({
      search: '',
      filterType: 'all',
      startDate: '',
      endDate: '',
      destination: '',
      consignor: '',
      consignee: [],
      godown: ''
    });
  };

  // --- Async Autocomplete Loaders (Unchanged) ---
  const loadDestinationOptions = useCallback(async (search: string, _prevOptions: any, { page }: any) => {
    const result = await searchToPlaces(search, page);
    return {
      options: result.data.map((p: any) => ({ value: p.placeName, label: p.placeName })),
      hasMore: result.hasMore,
      additional: { page: page + 1 },
    };
  }, [searchToPlaces]);

  const loadConsignorOptions = useCallback(async (search: string, _prevOptions: any, { page }: any) => {
    const result = await searchConsignors(search, page);
    return {
      options: result.data.map((c: any) => ({ value: c.id, label: c.name })),
      hasMore: result.hasMore,
      additional: { page: page + 1 },
    };
  }, [searchConsignors]);

  const loadConsigneeOptions = useCallback(async (search: string, _prevOptions: any, { page }: any) => {
    const result = await searchConsignees(search, page);
    return {
      options: result.data.map((c: any) => ({ value: c.id, label: c.name })),
      hasMore: result.hasMore,
      additional: { page: page + 1 },
    };
  }, [searchConsignees]);

  const loadGodownOptions = useCallback(async (search: string, _prevOptions: any, { page }: any) => {
    const result = await searchGodowns(search, page);
    return {
      options: result.data.map((g: any) => ({ value: g.godownName || g.name, label: g.godownName || g.name })),
      hasMore: result.hasMore,
      additional: { page: page + 1 },
    };
  }, [searchGodowns]);


  // --- SELECTION LOGIC (Unchanged) ---


  const handleSelectRow = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    const isChecked = e.target.checked;

    if (selectAllMode) {
      // We are in bulk mode. This action modifies the exclusion list.
      if (!isChecked) {
        // DESELECT (User unchecks a box): Add this item to the exclusion list
        setExcludedGcIds(prev => [...prev, id]);
      } else {
        // SELECT (User re-checks a box): Remove this item from the exclusion list
        setExcludedGcIds(prev => prev.filter(gcId => gcId !== id));
      }
    } else {
      // Standard row selection/deselection when not in Select All mode
      if (isChecked) {
        setSelectedGcIds(prev => [...prev, id]);
      } else {
        setSelectedGcIds(prev => prev.filter(gcId => gcId !== id));
      }
    }
  };

  const isRowSelected = (gcNo: string): boolean => {
    if (selectAllMode) {
      // If in Select All Mode, it is selected UNLESS it's in the excluded list
      return !excludedGcIds.includes(gcNo);
    }
    // Standard check
    return selectedGcIds.includes(gcNo);
  }

  // COMBINED DESELECT HANDLER
  const handleCombinedBulkDeselect = async () => {
    const isConsignorActive = !!filters.consignor;
    const isConsigneeActive = Array.isArray(filters.consignee) && filters.consignee.length > 0;
    const isDestinationActive = !!filters.destination;
    const isGodownActive = !!filters.godown;
    const isDateActive = filters.filterType !== 'all';
    const isSearchActive = !!filters.search;

    const hasFiltersToDeselect = isConsignorActive || isConsigneeActive || isDestinationActive || isGodownActive || isDateActive || isSearchActive;

    let totalDeselected = 0;

    if (!hasFiltersToDeselect) {
      // Fallback: Deselect all visible items if no specific filters are active but there is a selection
      const visibleSelectedIds = paginatedData.map(gc => gc.gcNo).filter(isRowSelected);
      if (visibleSelectedIds.length > 0) {
        if (selectAllMode) {
          setExcludedGcIds(prev => Array.from(new Set([...prev, ...visibleSelectedIds])));
        } else {
          setSelectedGcIds(prev => prev.filter(id => !visibleSelectedIds.includes(id)));
        }
        totalDeselected = visibleSelectedIds.length;
      }
    } else {
      try {
        // 1. Fetch ALL IDs that match the current full set of filters
        const allMatchingItems = await fetchLoadingSheetPrintData([], true, filters); 

        if (!allMatchingItems || allMatchingItems.length === 0) {
          toast.error(`No items found matching the current combination of active filters.`);
          clearAllFilters();
          return;
        }

        const allMatchingIds = allMatchingItems.map((item: any) => item.gcNo);
        totalDeselected = allMatchingIds.length;

        // 2. Deselect the matching IDs
        if (!selectAllMode) {
          setSelectedGcIds(prev => prev.filter(id => !allMatchingIds.includes(id)));
        } else {
          setExcludedGcIds(prev => Array.from(new Set([...prev, ...allMatchingIds])));
        }
        
      } catch (error) {
        console.error("Bulk deselect failed:", error);
        toast.error(`An error occurred while deselecting filtered items.`);
        return; 
      }
    }
    
    // 3. Clear all filters after successful deselection
    if (hasFiltersToDeselect || totalDeselected > 0) {
      clearAllFilters();
      toast.success(`Deselected ${totalDeselected} items and cleared all filters.`);
    } else if (totalDeselected === 0) {
        toast.error(`No items were deselected.`);
    }
  };

  // COMBINED BULK SELECT HANDLER
  const handleCombinedBulkSelect = async () => {
    // Determine if filters are active
    const hasFiltersToSelect = !!filters.consignor || 
                               (Array.isArray(filters.consignee) && filters.consignee.length > 0) || 
                               !!filters.destination || 
                               !!filters.godown || 
                               filters.filterType !== 'all' || 
                               !!filters.search;

    let totalSelected = 0;

    try {
        if (!hasFiltersToSelect) {
            // Case 1: No filters active. Select ALL items (True Bulk Mode).
            setSelectAllMode(true);
            setExcludedGcIds([]);
            setSelectedGcIds([]); 
            totalSelected = totalItems; 
        } else {
            // Case 2: Filters ARE active. Fetch all matching IDs.
            const allMatchingItems = await fetchLoadingSheetPrintData([], true, filters); 

            if (!allMatchingItems || allMatchingItems.length === 0) {
                toast.error(`No items found matching the current filters.`);
                return;
            }

            const allMatchingIds = allMatchingItems.map((item: any) => item.gcNo);
            totalSelected = allMatchingIds.length;

            // Enter Bulk Mode for the filtered set
            setSelectAllMode(true);
            setExcludedGcIds([]); 
            setSelectedGcIds(allMatchingIds); 
        }

        if (totalSelected > 0) {
            toast.success(`Selected ${totalSelected} items.`);
        }
    } catch (error) {
        console.error("Bulk select failed:", error);
        toast.error(`An error occurred while selecting items.`);
    }
  };

  // Keep visual selection in sync if Select All is active
  useEffect(() => {
    if (selectAllMode) {
      const currentVisibleIds = paginatedData
        .map(gc => gc.gcNo)
        .filter(gcId => !excludedGcIds.includes(gcId));

      const currentSelectedSet = new Set(selectedGcIds);
      const newVisibleSet = new Set(currentVisibleIds);

      if (currentSelectedSet.size !== newVisibleSet.size ||
        !currentVisibleIds.every(id => currentSelectedSet.has(id))) {
        setSelectedGcIds(currentVisibleIds);
      }
    }
  }, [paginatedData, selectAllMode, excludedGcIds, selectedGcIds]);

  // Handle deselect visible logic
  const isAllVisibleSelected = paginatedData.length > 0 && paginatedData.every(gc => isRowSelected(gc.gcNo));

  const handleDeselectAllVisible = () => { 
    const visibleGcNos = paginatedData.map(gc => gc.gcNo);
    const currentlyAllSelected = isAllVisibleSelected; 
    
    if (currentlyAllSelected) {
        if (selectAllMode) {
            setExcludedGcIds(prev => Array.from(new Set([...prev, ...visibleGcNos])));
        } else {
            setSelectedGcIds(prev => prev.filter(id => !visibleGcNos.includes(id)));
        }
    } else {
        if (selectAllMode) {
            setExcludedGcIds(prev => prev.filter(gcId => !visibleGcNos.includes(gcId)));
        } else {
            setSelectedGcIds(prev => Array.from(new Set([...prev, ...visibleGcNos])));
        }
    }
  };

  // --- ACTIONS (Unchanged) ---

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
        toast.error("Failed to fetch GC details.");
      }
    } catch (error) {
      console.error("Print error:", error);
      toast.error("An error occurred while fetching print data.");
    }
  };

  // --- OPTIMIZED BULK PRINT (Unchanged) ---
  const handlePrintSelected = async () => {
    const finalCount = selectAllMode ? Math.max(0, totalItems - excludedGcIds.length) : selectedGcIds.length;
    if (finalCount === 0) return;

    try {
      let results = [];

      if (selectAllMode) {
        // Send filters AND the exclusion list to the backend
        results = await fetchLoadingSheetPrintData([], true, {
          ...filters,
          excludeIds: excludedGcIds
        });
      } else {
        // Fetch specifically selected IDs
        results = await fetchLoadingSheetPrintData(selectedGcIds);
      }

      if (!results || results.length === 0) {
        toast.error("No data received for selected GCs.");
        return;
      }

      // Map backend response to LoadListJob format
      const jobs: LoadListJob[] = results.map((item: any) => {
        const { consignor, consignee, ...gcData } = item;

        return {
          gc: gcData as GcEntry,
          consignor: {
            ...consignor,
            id: consignor.id || consignor._id
          } as Consignor,
          consignee: {
            ...consignee,
            id: consignee.id || consignee._id
          } as Consignee
        };
      });

      if (jobs.length > 0) {
        setLoadListPrintingJobs(jobs);

        // Reset selection state after printing
        setSelectAllMode(false);
        setExcludedGcIds([]);
        setSelectedGcIds([]);
      }
    } catch (error) {
      console.error("Bulk print failed", error);
      toast.error("Failed to prepare print jobs.");
    }
  };

  // 🟢 UPDATED: Extract contentItems from full GC details and pass to state
  const handleOpenQtySelect = async (gc: GcEntry) => {
    const fullGc = await fetchGcById(gc.gcNo);

    if (fullGc) {
      const qtyStr = fullGc.quantity ? fullGc.quantity.toString() : "0";
      const maxQty = parseInt(qtyStr) || 1;
      const startNo = parseInt(fullGc.fromNo?.toString() || '1') || 1;
      const currentLoaded = fullGc.loadedPackages || [];
      
      // Extract contentItems
      const contentItems = fullGc.contentItems || [];

      setCurrentQtySelection({
        gcId: fullGc.gcNo,
        maxQty: maxQty,
        startNo: startNo,
        loadedPackages: currentLoaded,
        contentItems: contentItems // Pass to state
      });
      setIsQtySelectOpen(true);
    } else {
      toast.error("Failed to load GC details.");
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

  const hasActiveFilters = !!filters.destination || !!filters.consignor || (filters.consignee && filters.consignee.length > 0) || !!filters.godown || filters.filterType !== 'all' || !!filters.search;
  const responsiveBtnClass = "flex-1 md:flex-none text-[10px] xs:text-xs sm:text-sm h-8 sm:h-10 px-1 sm:px-4 whitespace-nowrap";

  // Determine source of total items
  const totalItemsInFilter = hasActiveFilters && selectAllMode 
      ? selectedGcIds.length 
      : totalItems;

  const finalCount = selectAllMode 
      ? Math.max(0, totalItemsInFilter - excludedGcIds.length) 
      : selectedGcIds.length;


  const printButtonText = selectAllMode
    ? `Print All (${finalCount})`
    : `Print (${finalCount})`;
  
  // DYNAMIC BUTTON LOGIC
  const bulkButtonText = selectAllMode ? "Deselect All" : "Select All";
  const bulkButtonIcon = selectAllMode ? XCircle : PackageCheck;
  const handleBulkAction = selectAllMode ? handleCombinedBulkDeselect : handleCombinedBulkSelect;
  const bulkButtonVariant = selectAllMode ? "destructive" : "primary";
  const BulkIconComponent = bulkButtonIcon;

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
            variant={bulkButtonVariant}
            onClick={handleBulkAction}
            className={responsiveBtnClass}
            title={selectAllMode 
              ? "Click to Deselect All (clear bulk mode)" 
              : "Select all items matching current filters, or all entries if no filters active."}
          >
            <BulkIconComponent size={14} className="mr-1 sm:mr-2" />
            {bulkButtonText}
          </Button>

          <Button
            variant="secondary"
            onClick={handlePrintSelected}
            disabled={finalCount === 0}
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
                <FilterX size={14} className="mr-1" /> Clear All
              </button>
              <button onClick={() => setShowFilters(false)} className="text-muted-foreground hover:text-foreground ml-2">
                <ChevronUp size={20} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <AsyncAutocomplete
              label="Filter by Godown"
              loadOptions={loadGodownOptions}
              value={godownOption}
              onChange={(val: any) => {
                setGodownOption(val);
                setFilters({ godown: val?.value || '' });
              }}
              placeholder="Search godown..."
              defaultOptions
            />
            <AsyncAutocomplete
              label="Filter by Destination"
              loadOptions={loadDestinationOptions}
              value={destinationOption}
              onChange={(val: any) => {
                setDestinationOption(val);
                setFilters({ destination: val?.value || '' });
              }}
              placeholder="Search destination..."
              defaultOptions
            />
            <AsyncAutocomplete
              label="Filter by Consignor"
              loadOptions={loadConsignorOptions}
              value={consignorOption}
              onChange={(val: any) => {
                setConsignorOption(val);
                setFilters({ consignor: val?.value || '' });
              }}
              placeholder="Search consignor..."
              defaultOptions
            />
            <div>
              <AsyncAutocomplete
                label="Filter by Consignee (Multi-select)"
                loadOptions={loadConsigneeOptions}
                value={consigneeOptions}
                onChange={(val: any) => {
                  const arr = Array.isArray(val) ? val : (val ? [val] : []);
                  setConsigneeOptions(arr);
                  const ids = arr.map((v: any) => v.value);
                  setFilters({ consignee: ids });
                }}
                placeholder="Select consignees..."
                isMulti={true}
                defaultOptions
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
                    checked={isAllVisibleSelected} 
                    onChange={handleDeselectAllVisible}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">GC No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Consignor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Consignee</th>
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
                  const consignorName = (gc as any).consignorName || 'N/A';
                  const consigneeName = (gc as any).consigneeName || 'N/A';

                  const loadedCount = gc.loadedCount || 0;
                  const qtyVal = gc.totalQty ?? 0;
                  const totalCount = parseInt(qtyVal.toString()) || 0;
                  const pendingCount = totalCount - loadedCount;

                  const isPartiallyPending = pendingCount > 0 && pendingCount < totalCount;
                  const isFullyPending = pendingCount === totalCount && totalCount > 0;
                  
                  const isSelected = isRowSelected(gc.gcNo);

                  return (
                    <tr key={gc.gcNo}>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-primary border-muted-foreground/30 rounded focus:ring-primary"
                          checked={isSelected}
                          onChange={() => handleSelectRow({ target: { checked: !isSelected } } as any, gc.gcNo)} 
                          title={isSelected ? "Click to Deselect" : "Click to Select"}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary">{gc.gcNo}</td>
                      <td className="px-6 py-4 text-sm">{consignorName}</td>
                      <td className="px-6 py-4 text-sm">{consigneeName}</td>
                      
                      <td className="px-6 py-4 text-sm font-semibold">{totalCount}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${isFullyPending ? 'text-foreground' : isPartiallyPending ? 'text-orange-500' : 'text-green-600'}`}>
                        {pendingCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3 flex items-center">
                        <button
                          onClick={() => handleOpenQtySelect(gc as GcEntry)}
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
              const consignorName = (gc as any).consignorName || 'N/A';
              const consigneeName = (gc as any).consigneeName || 'N/A';

              const loadedCount = gc.loadedCount || 0;
              const qtyVal = gc.totalQty ?? 0;
              const totalCount = parseInt(qtyVal.toString()) || 0;
              const pendingCount = totalCount - loadedCount;
              const isPartiallyPending = pendingCount > 0 && pendingCount < totalCount;
              const isFullyPending = pendingCount === totalCount && totalCount > 0;
              
              const isSelected = isRowSelected(gc.gcNo);

              return (
                <div key={gc.gcNo} className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-primary border-muted-foreground/30 rounded focus:ring-primary mt-1.5"
                        checked={isSelected}
                        onChange={() => handleSelectRow({ target: { checked: !isSelected } } as any, gc.gcNo)}
                        title={isSelected ? "Click to Deselect" : "Click to Select"}
                      />
                      <div>
                        <div className="text-lg font-semibold text-primary">GC #{gc.gcNo}</div>
                        <div className="text-md font-medium text-foreground">From: {consignorName}</div>
                        <div className="text-sm text-muted-foreground">To: {consigneeName}</div>
                      </div>
                    </div>
                    <div className="flex flex-col space-y-3 pt-1">
                      <button
                        onClick={() => handleOpenQtySelect(gc as GcEntry)}
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
          data={reportPrintingJobs}
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
          contentItems={currentQtySelection.contentItems} // 🟢 Pass new prop
        />
      )}
    </div>
  );
};