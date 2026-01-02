import { useState, useCallback, useMemo } from 'react';
import {
  Trash2,
  Search,
  Printer,
  PackageCheck,
  Filter,
  XCircle,
  FilterX,
  Hash,
  User,
  Package,
  ChevronRight,
  ChevronUp,
} from 'lucide-react';
import { DateFilterButtons, getTodayDate, getYesterdayDate } from '../../../components/shared/DateFilterButtons';
import { ConfirmationDialog } from '../../../components/shared/ConfirmationDialog';
import { useData } from '../../../hooks/useData';
import { Button } from '../../../components/shared/Button';
import { Input } from '../../../components/shared/Input'; // 🟢 Used for Godown Filter
import { AsyncAutocomplete } from '../../../components/shared/AsyncAutocomplete';
import { GcPrintManager, type GcPrintJob } from '../gc-entry/GcPrintManager';
import type { GcEntry, Consignor, Consignee, LoadingSheetFilter } from '../../../types';

import { useServerPagination } from '../../../hooks/useServerPagination';
import { Pagination } from '../../../components/shared/Pagination';
import { StockReportPrint } from '../pending-stock/StockReportView';
import { LoadListPrintManager, type LoadListJob } from './LoadListPrintManager';
import { QtySelectionDialog } from './QtySelectionDialog';
import { useToast } from '../../../contexts/ToastContext';
import { deleteSchema } from '../../../schemas';

type ExclusionFilterState = {
  isActive: boolean;
  filterKey?: string;
};

type SelectAllSnapshot = {
  active: boolean;
  total: number;
  filters: LoadingSheetFilter;
};


export const LoadingSheetEntry = () => {
  const {
    deleteGcEntry,
    saveLoadingProgress,
    fetchGcById,
    fetchLoadingSheetPrintData,
    searchConsignors,
    searchConsignees,
    searchToPlaces,
    // searchGodowns // 🔴 Removed: No longer needed for text input
  } = useData();

  const toast = useToast();

  // Server-side pagination hook
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
  } = useServerPagination<
    GcEntry & { loadedCount?: number; consignorId?: string; destination?: string; totalQty?: number }
  >({
    endpoint: '/operations/loading-sheet',
    skipLoader: true,
    initialFilters: {
      search: '',
      filterType: 'all',
      startDate: '',
      endDate: '',
      customStart: '',
      customEnd: '',
      destination: '',
      consignor: '',
      consignee: [],
      godown: '',
      pending: 'true',
    } as LoadingSheetFilter,
    initialItemsPerPage: 10,
  });

  // UI State
  const [showFilters, setShowFilters] = useState(false);
  const [destinationOption, setDestinationOption] = useState<any>(null);
  const [consignorOption, setConsignorOption] = useState<any>(null);
  // const [godownOption, setGodownOption] = useState<any>(null); // 🔴 Removed: State for dropdown not needed
  const [consigneeOptions, setConsigneeOptions] = useState<any[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Selection State
  const [selectedGcIds, setSelectedGcIds] = useState<string[]>([]);
  const [selectAllMode, setSelectAllMode] = useState(false);
  const [excludedGcIds, setExcludedGcIds] = useState<string[]>([]);
  const [selectAllSnapshot, setSelectAllSnapshot] = useState<SelectAllSnapshot>({
    active: false,
    total: 0,
    filters: {
      search: '',
      filterType: 'all',
      startDate: '',
      endDate: '',
      customStart: '',
      customEnd: '',
      destination: '',
      consignor: '',
      consignee: [],
      godown: ''
    },
  });

  // Exclusion Banner State
  const [, setExclusionFilter] = useState<ExclusionFilterState>({
    isActive: false,
    filterKey: '',
  });

  // Print/Modal State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteMessage, setDeleteMessage] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [isQtySelectOpen, setIsQtySelectOpen] = useState(false);

  const [currentQtySelection, setCurrentQtySelection] = useState<{
    gcId: string;
    maxQty: number;
    startNo: number;
    loadedPackages: any[];
    contentItems: any[];
  } | null>(null);

  const [reportPrintingJobs, setReportPrintingJobs] = useState<any[] | null>(null);
  const [gcPrintingJobs, setGcPrintingJobs] = useState<GcPrintJob[] | null>(null);
  const [loadListPrintingJobs, setLoadListPrintingJobs] = useState<LoadListJob[] | null>(null);

  // ---------------------------------------------------------------------------
  // Helper: Create complete filter object
  // ---------------------------------------------------------------------------
  const createCompleteFilters = (sourceFilters: Partial<LoadingSheetFilter>): LoadingSheetFilter => {
    return {
      search: sourceFilters.search || '',
      filterType: sourceFilters.filterType || 'all',
      startDate: sourceFilters.startDate || '',
      endDate: sourceFilters.endDate || '',
      customStart: sourceFilters.customStart || '',
      customEnd: sourceFilters.customEnd || '',
      destination: sourceFilters.destination || '',
      consignor: sourceFilters.consignor || '',
      consignee: sourceFilters.consignee || [],
      godown: sourceFilters.godown || '',
      pending: sourceFilters.pending || 'true',
    };
  };

  // ---------------------------------------------------------------------------
  // Filter Handlers
  // ---------------------------------------------------------------------------
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
      customEnd: '',
    });
  };

  const handleCustomDateChange = (start: string, end: string) => {
    setFilters({
      filterType: 'custom',
      customStart: start,
      customEnd: end,
      startDate: start,
      endDate: end,
    });
  };

  const clearAllFilters = () => {
    setDestinationOption(null);
    setConsignorOption(null);
    setConsigneeOptions([]);
    // setGodownOption(null); // 🔴 Removed

    setFilters({
      search: '',
      filterType: 'all',
      startDate: '',
      endDate: '',
      destination: '',
      consignor: '',
      consignee: [],
      godown: '',
    });

    // Reset selection + exclusion + snapshot
    setSelectAllMode(false);
    setSelectAllSnapshot({
      active: false,
      total: 0,
      filters: createCompleteFilters({})
    });
    setSelectedGcIds([]);
    setExcludedGcIds([]);
    setExclusionFilter({ isActive: false, filterKey: '' });
  };

  // ---------------------------------------------------------------------------
  // Async Autocomplete Loaders
  // ---------------------------------------------------------------------------
  const loadDestinationOptions = useCallback(
    async (search: string, _prevOptions: any, { page }: any) => {
      const result = await searchToPlaces(search, page);
      return {
        options: result.data.map((p: any) => ({ value: p.placeName, label: p.placeName })),
        hasMore: result.hasMore,
        additional: { page: page + 1 },
      };
    },
    [searchToPlaces]
  );

  const loadConsignorOptions = useCallback(
    async (search: string, _prevOptions: any, { page }: any) => {
      const result = await searchConsignors(search, page);
      return {
        options: result.data.map((c: any) => ({ value: c.id, label: c.name })),
        hasMore: result.hasMore,
        additional: { page: page + 1 },
      };
    },
    [searchConsignors]
  );

  const loadConsigneeOptions = useCallback(
    async (search: string, _prevOptions: any, { page }: any) => {
      const result = await searchConsignees(search, page);
      return {
        options: result.data.map((c: any) => ({ value: c.id, label: c.name })),
        hasMore: result.hasMore,
        additional: { page: page + 1 },
      };
    },
    [searchConsignees]
  );

  // 🔴 Removed: loadGodownOptions - using free text input now

  // ---------------------------------------------------------------------------
  // Selection helpers
  // ---------------------------------------------------------------------------
  const isRowSelected = (gcNo: string): boolean => {
    if (selectAllMode && selectAllSnapshot.active) {
      return !excludedGcIds.includes(gcNo);
    }
    return selectedGcIds.includes(gcNo);
  };

  const isAllVisibleSelected =
    paginatedData.length > 0 && paginatedData.every((gc) => isRowSelected(gc.gcNo));

  const isIndeterminate = useMemo(() => {
    if (paginatedData.length === 0) return false;
    const selectedCount = paginatedData.filter((gc) => isRowSelected(gc.gcNo)).length;
    return selectedCount > 0 && selectedCount < paginatedData.length;
  }, [paginatedData, selectAllMode, excludedGcIds, selectedGcIds, selectAllSnapshot]);

  const finalCount =
    selectAllMode && selectAllSnapshot.active
      ? Math.max(0, (selectAllSnapshot.total || totalItems) - excludedGcIds.length)
      : selectedGcIds.length;

  const printButtonText = selectAllMode
    ? `Print All (${finalCount})`
    : `Print (${finalCount})`;

  const isAllSelected =
    selectAllMode && selectAllSnapshot.active
      ? excludedGcIds.length === 0
      : totalItems > 0 && selectedGcIds.length === totalItems;

  const multipleSelected = finalCount > 0;

  const bulkButtonText = isAllSelected ? 'Clear Selection' : 'Select All';
  const bulkButtonIcon = isAllSelected ? XCircle : PackageCheck;
  const bulkButtonVariant = isAllSelected ? 'destructive' : 'primary';
  const BulkIconComponent = bulkButtonIcon;

  // ---------------------------------------------------------------------------
  // Selection handlers
  // ---------------------------------------------------------------------------
  const handleDeselectAllVisible = (e: React.ChangeEvent<HTMLInputElement>) => {
    const visibleGcNos = paginatedData.map((gc) => gc.gcNo);
    const checked = e.target.checked;

    if (checked) {
      if (selectAllMode && selectAllSnapshot.active) {
        setExcludedGcIds((prev) => prev.filter((id) => !visibleGcNos.includes(id)));
      } else {
        setSelectedGcIds((prev) => Array.from(new Set([...prev, ...visibleGcNos])));
      }
    } else {
      if (selectAllMode && selectAllSnapshot.active) {
        setExcludedGcIds((prev) => Array.from(new Set([...prev, ...visibleGcNos])));
      } else {
        setSelectedGcIds((prev) => prev.filter((id) => !visibleGcNos.includes(id)));
      }
    }
  };

  const handleSelectRow = (gcNo: string, checked: boolean) => {
    if (selectAllMode && selectAllSnapshot.active) {
      if (checked) {
        setExcludedGcIds((prev) => prev.filter((id) => id !== gcNo));
      } else {
        setExcludedGcIds((prev) => Array.from(new Set([...prev, gcNo])));
      }
    } else {
      if (checked) {
        setSelectedGcIds((prev) => Array.from(new Set([...prev, gcNo])));
      } else {
        setSelectedGcIds((prev) => prev.filter((id) => id !== gcNo));
      }
    }
  };

  const handleCombinedBulkDeselect = () => {
    setSelectAllMode(false);
    setSelectAllSnapshot({
      active: false,
      total: 0,
      filters: createCompleteFilters({})
    });
    setExcludedGcIds([]);
    setSelectedGcIds([]);
    setExclusionFilter({ isActive: false, filterKey: '' });
  };

  // FIXED: Create complete filter snapshot
  const handleCombinedBulkSelect = () => {
    if (totalItems === 0) {
      toast.error('No items found to select based on current filters.');
      return;
    }

    const completeFilters = createCompleteFilters(filters);

    setSelectAllMode(true);
    setExcludedGcIds([]);
    setSelectedGcIds([]);
    setExclusionFilter({ isActive: false, filterKey: '' });
    setSelectAllSnapshot({
      active: true,
      total: totalItems,
      filters: completeFilters,
    });
  };

  // ---------------------------------------------------------------------------
  // Exclude logic - Exclude all filtered items (fetches from API)
  // ---------------------------------------------------------------------------
  const handleExcludeFilteredData = async () => {
    // CASE 1: Manual Selection Mode - exclude selected visible items
    if (!selectAllMode || !selectAllSnapshot.active) {
      const selectedVisible = paginatedData
        .map(gc => gc.gcNo)
        .filter(id => selectedGcIds.includes(id));

      if (selectedVisible.length === 0) {
        return;
      }

      setExcludedGcIds(prev =>
        Array.from(new Set([...prev, ...selectedVisible]))
      );
      setSelectedGcIds(prev => prev.filter(id => !selectedVisible.includes(id)));
      setExclusionFilter({ isActive: true, filterKey: 'Manual Selection' });

      return;
    }

    // CASE 2: Select-All Mode - exclude all items matching current filters
    try {
      // Build filter object with current filter values
      const currentFilters: LoadingSheetFilter = {
        search: filters.search || '',
        filterType: filters.filterType || 'all',
        startDate: filters.startDate || '',
        endDate: filters.endDate || '',
        customStart: filters.customStart || '',
        customEnd: filters.customEnd || '',
        destination: filters.destination || '',
        consignor: filters.consignor || '',
        consignee: filters.consignee || [],
        godown: filters.godown || '',
      };

      // Check if any filter is active
      const hasFiltersActive =
        !!filters.destination ||
        !!filters.consignor ||
        (filters.consignee && filters.consignee.length > 0) ||
        !!filters.godown ||
        filters.filterType !== 'all' ||
        !!filters.search;

      // If no filters active, just exclude visible items on current page
      if (!hasFiltersActive) {
        const visibleGcNos = paginatedData.map((gc) => gc.gcNo);
        
        if (visibleGcNos.length === 0) {
          toast.error('No visible items to exclude.');
          return;
        }

        setExcludedGcIds(prev =>
          Array.from(new Set([...prev, ...visibleGcNos]))
        );
        toast.success(`Excluded ${visibleGcNos.length} visible items from selection.`);
        return;
      }

      // Filters are active - fetch ALL matching items from API
      const allMatching = await fetchLoadingSheetPrintData([], true, currentFilters);

      if (!allMatching || allMatching.length === 0) {
        toast.error('No items found to exclude for current filters.');
        return;
      }

      const idsToExclude = allMatching.map((gc: any) => gc.gcNo);

      setExcludedGcIds(prev =>
        Array.from(new Set([...prev, ...idsToExclude]))
      );

      setExclusionFilter({ isActive: true, filterKey: 'Filter' });
      toast.success(`Excluded ${idsToExclude.length} items from bulk selection.`);
    } catch (err) {
      console.error('Exclude filtered failed:', err);
      toast.error('Failed to exclude filtered records.');
    }
  };

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------
  const handleDelete = (gcNo: string) => {
    setDeletingId(gcNo);
    setDeleteMessage(`Are you sure you want to delete GC #${gcNo}?`);
    setDeleteReason('');
    setFormErrors({});
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    const data = deleteReason.trim();
    const validationResult = deleteSchema.safeParse({ data });

    if (!validationResult.success) {
      const newErrors: Record<string, string> = {};
      validationResult.error.issues.forEach((err: any) => {
        if (err.path[0]) newErrors[err.path[0].toString()] = err.message;
      });
      setFormErrors(newErrors);
      return;
    }

    if (deletingId) {
      await deleteGcEntry(deletingId, deleteReason);
      refresh();
      setSelectedGcIds((prev) => prev.filter((id) => id !== deletingId));
      setExcludedGcIds((prev) => prev.filter((id) => id !== deletingId));

      setIsConfirmOpen(false);
      setDeletingId(null);
      setDeleteReason('');
      setFormErrors({});
    }
  };

  const handlePrintSingle = async (gcNo: string) => {
    try {
      const printData = await fetchLoadingSheetPrintData([gcNo]);

      if (printData && printData.length > 0) {
        const item = printData[0];
        const { consignor, consignee, ...gcData } = item;

        setLoadListPrintingJobs([
          {
            gc: gcData as GcEntry,
            consignor: { ...consignor, id: consignor.id || consignor._id || 'unknown' } as Consignor,
            consignee: { ...consignee, id: consignee.id || consignee._id || 'unknown' } as Consignee,
          },
        ]);
      } else {
        toast.error('Failed to fetch GC details.');
      }
    } catch (error) {
      console.error('Print error:', error);
      toast.error('An error occurred while fetching print data.');
    }
  };

  // FIXED: Bulk print - Keep selection after print
  const handlePrintSelected = async () => {
    if (finalCount === 0) {
      toast.error('No items selected for printing.');
      return;
    }

    try {
      let results: any[] = [];

      if (selectAllMode && selectAllSnapshot.active) {
        const filtersForPrint: LoadingSheetFilter = {
          ...selectAllSnapshot.filters,
          excludeIds: excludedGcIds.length > 0 ? excludedGcIds : undefined,
        } as any;

        results = await fetchLoadingSheetPrintData([], true, filtersForPrint);
      } else {
        results = await fetchLoadingSheetPrintData(selectedGcIds);
      }

      if (!results || results.length === 0) {
        toast.error('No data received for selected GCs.');
        return;
      }

      const jobs: LoadListJob[] = results.map((item: any) => {
        const { consignor, consignee, ...gcData } = item;

        return {
          gc: gcData as GcEntry,
          consignor: {
            ...consignor,
            id: consignor.id || consignor._id,
          } as Consignor,
          consignee: {
            ...consignee,
            id: consignee.id || consignee._id,
          } as Consignee,
        };
      });

      if (jobs.length > 0) {
        setLoadListPrintingJobs(jobs);
        toast.success(`Prepared ${jobs.length} print job(s).`);
        // FIXED: Selection is NOT reset after print - keeping it visible
      }
    } catch (error) {
      console.error('Bulk print failed', error);
      toast.error('Failed to prepare print jobs.');
    }
  };

  // Qty selection
  const handleOpenQtySelect = async (gc: GcEntry) => {
    const fullGc = await fetchGcById(gc.gcNo);

    if (fullGc) {
      const qtyStr = fullGc.quantity ? fullGc.quantity.toString() : '0';
      const maxQty = parseInt(qtyStr) || 1;
      const startNo = parseInt(fullGc.fromNo?.toString() || '1') || 1;

      const currentLoaded = fullGc.loadedPackages || [];
      const contentItems = fullGc.contentItems || [];

      setCurrentQtySelection({
        gcId: fullGc.gcNo,
        maxQty,
        startNo,
        loadedPackages: currentLoaded,
        contentItems,
      });
      setIsQtySelectOpen(true);
    } else {
      toast.error('Failed to load GC details.');
    }
  };

  const handleSaveSelectedQty = async (qtyArray: any) => {
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

  const hasActiveFilters =
    !!filters.destination ||
    !!filters.consignor ||
    (filters.consignee && filters.consignee.length > 0) ||
    !!filters.godown ||
    filters.filterType !== 'all' ||
    !!filters.search;


  return (
    <div className="space-y-4">
      {/* ===== CONTROL BAR ===== */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
        {/* Desktop - Single Row (xl and above) */}
        <div className="hidden xl:flex items-center gap-3">
          {/* Search Bar (Stays on Left) */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search loading sheet..."
              value={filters.search || ''}
              onChange={handleSearchChange}
              className="w-full h-10 pl-10 pr-4 bg-secondary/50 text-foreground rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60 text-sm"
            />
          </div>

          {/* Button Group (Moved to Right using ml-auto) */}
          <div className="flex items-center gap-3 ml-auto">
            <Button
              variant={hasActiveFilters ? "primary" : "outline"}
              onClick={() => setShowFilters(!showFilters)}
              className="h-10 px-4 shrink-0"
            >
              <Filter className="w-4 h-4" />
              Filters
              {hasActiveFilters && <span className="ml-1.5 w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
            </Button>

            <Button
              variant="secondary"
              onClick={handlePrintSelected}
              disabled={finalCount === 0}
              className="h-10"
            >
              <Printer className="w-4 h-4" />
              {printButtonText}
            </Button>

            <Button
              variant={bulkButtonVariant}
              onClick={isAllSelected ? handleCombinedBulkDeselect : handleCombinedBulkSelect}
              className="h-10"
            >
              <BulkIconComponent className="w-4 h-4" />
              {bulkButtonText}
            </Button>
          </div>
        </div>

        {/* Tablet & Mobile - Two Rows (below xl) */}
        <div className="flex xl:hidden flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Search loading sheet..." value={filters.search || ''} onChange={handleSearchChange} className="w-full h-10 pl-10 pr-4 bg-secondary/50 text-foreground rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60 text-sm" />
            </div>
            <Button variant={hasActiveFilters ? "primary" : "outline"} onClick={() => setShowFilters(!showFilters)} className="h-10 px-3 shrink-0">
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline ml-1">Filters</span>
              {hasActiveFilters && <span className="ml-1.5 w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={handlePrintSelected} disabled={finalCount === 0} className="flex-1 h-9 text-xs sm:text-sm">
              <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="ml-1">({finalCount})</span>
            </Button>

            <Button
              variant={bulkButtonVariant}
              onClick={isAllSelected ? handleCombinedBulkDeselect : handleCombinedBulkSelect}
              className="flex-1 h-9 text-xs sm:text-sm"
              title={
                isAllSelected
                  ? 'Click to Deselect All (clear bulk mode)'
                  : 'Select all items matching current filters, or all entries if no filters active.'
              }
            >

              <BulkIconComponent className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="ml-1">{bulkButtonText}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ===== FILTERS PANEL ===== */}
      {showFilters && (
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm animate-in slide-in-from-top-2 duration-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-foreground">Filters</h3>
            <div className="flex items-center gap-2">
              {multipleSelected && (
                <button onClick={handleExcludeFilteredData} disabled={paginatedData.length === 0} className="inline-flex items-center gap-1 text-xs text-destructive hover:text-destructive/80 font-medium">
                  <XCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Exclude</span>
                </button>
              )}
              <button onClick={clearAllFilters} className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium">
                <FilterX className="w-3.5 h-3.5" />
                Clear All
              </button>
              <button onClick={() => setShowFilters(false)} className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <AsyncAutocomplete label="Destination" loadOptions={loadDestinationOptions} value={destinationOption} onChange={(val: any) => { setDestinationOption(val); setFilters({ destination: val?.value || '' }); }} placeholder="Search destination..." defaultOptions />
            <AsyncAutocomplete label="Consignor" loadOptions={loadConsignorOptions} value={consignorOption} onChange={(val: any) => { setConsignorOption(val); setFilters({ consignor: val?.value || '' }); }} placeholder="Search consignor..." defaultOptions />
            <AsyncAutocomplete label="Consignee (Multi-select)" loadOptions={loadConsigneeOptions} value={consigneeOptions} onChange={(val: any) => { const arr = Array.isArray(val) ? val : (val ? [val] : []); setConsigneeOptions(arr); setFilters({ consignee: arr.map((v: any) => v.value) }); }} placeholder="Select consignees..." isMulti={true} defaultOptions closeMenuOnSelect={false} showAllSelected={true} />
            
            {/* 🟢 CHANGED: Replaced AsyncAutocomplete with simple Input for Godown Search */}
            <Input 
              label="Godown" 
              value={filters.godown || ''} 
              onChange={(e) => setFilters({ godown: e.target.value })} 
              placeholder="Search godown (e.g. A1)" 
            />
          </div>

          <DateFilterButtons filterType={filters.filterType || 'all'} setFilterType={handleFilterTypeChange} customStart={filters.customStart || ''} setCustomStart={(val) => handleCustomDateChange(val, filters.customEnd)} customEnd={filters.customEnd || ''} setCustomEnd={(val) => handleCustomDateChange(filters.customStart, val)} />
        </div>
      )}

      {/* ===== DATA TABLE ===== */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {/* Desktop Table - xl and above */}
        <div className="hidden xl:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left w-12"><input type="checkbox" className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer" checked={isAllVisibleSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isIndeterminate;
                  }}
                  onChange={handleDeselectAllVisible}
                /></th>
                <th className="px-4 py-3 text-left"><div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider"><Hash className="w-3.5 h-3.5" />GC No</div></th>
                <th className="px-4 py-3 text-left"><div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider"><User className="w-3.5 h-3.5" />Consignor</div></th>
                <th className="px-4 py-3 text-left"><div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider"><User className="w-3.5 h-3.5" />Consignee</div></th>
                <th className="px-4 py-3 text-left"><div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider"><Package className="w-3.5 h-3.5" />Total Qty</div></th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Pending</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center"><div className="flex flex-col items-center gap-3"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /><span className="text-sm text-muted-foreground">Loading...</span></div></td></tr>
              ) : paginatedData.length > 0 ? (
                paginatedData.map((gc) => {
                  const consignorName = (gc as any).consignorName || 'N/A';
                  const consigneeName = (gc as any).consigneeName || 'N/A';
                  const loadedCount = gc.loadedCount || 0;
                  const totalCount = parseInt((gc.totalQty ?? 0).toString()) || 0;
                  const pendingCount = totalCount - loadedCount;
                  const isPartiallyPending = pendingCount > 0 && pendingCount < totalCount;
                  const isFullyPending = pendingCount === totalCount && totalCount > 0;
                  const isSelected = isRowSelected(gc.gcNo);

                  return (
                    <tr key={gc.gcNo} className={`transition-colors hover:bg-muted/30 ${isSelected ? "bg-primary/5" : ""}`}>
                      <td className="px-4 py-3"><input type="checkbox" className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer" checked={isSelected}
                        onChange={(e) => handleSelectRow(gc.gcNo, e.target.checked)}
                        title={isSelected ? 'Click to Deselect' : 'Click to Select'}
                      /></td>
                      <td className="px-4 py-3"><span className="font-semibold text-primary">{gc.gcNo}</span></td>
                      <td className="px-4 py-3"><span className="text-sm text-foreground">{consignorName}</span></td>
                      <td className="px-4 py-3"><span className="text-sm text-foreground">{consigneeName}</span></td>
                      <td className="px-4 py-3"><span className="text-sm font-semibold text-foreground">{totalCount}</span></td>
                      <td className="px-4 py-3"><span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold ${isFullyPending ? 'bg-muted text-foreground' : isPartiallyPending ? 'bg-orange-500/10 text-orange-600' : 'bg-emerald-500/10 text-emerald-600'}`}>{pendingCount}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleOpenQtySelect(gc as GcEntry)} className="p-1.5 rounded-md text-blue-600 hover:bg-blue-500/10 transition-colors" title="Load"><PackageCheck className="w-4 h-4" /></button>
                          <button onClick={() => handlePrintSingle(gc.gcNo)} className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-500/10 transition-colors" title="Print"><Printer className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(gc.gcNo)} className="p-1.5 rounded-md text-destructive hover:bg-destructive/10 transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={7} className="px-4 py-12 text-center"><div className="flex flex-col items-center gap-2"><Package className="w-10 h-10 text-muted-foreground/30" /><p className="text-sm text-muted-foreground">No entries found</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Tablet Table - lg to xl */}
        <div className="hidden lg:block xl:hidden overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-3 py-3 text-left w-10"><input type="checkbox" className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer" checked={isAllVisibleSelected} onChange={handleDeselectAllVisible} /></th>
                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">GC No</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Consignor / Consignee</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Qty / Pending</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={5} className="px-3 py-12 text-center"><div className="flex flex-col items-center gap-3"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /><span className="text-sm text-muted-foreground">Loading...</span></div></td></tr>
              ) : paginatedData.length > 0 ? (
                paginatedData.map((gc) => {
                  const consignorName = (gc as any).consignorName || 'N/A';
                  const consigneeName = (gc as any).consigneeName || 'N/A';
                  const loadedCount = gc.loadedCount || 0;
                  const totalCount = parseInt((gc.totalQty ?? 0).toString()) || 0;
                  const pendingCount = totalCount - loadedCount;
                  const isPartiallyPending = pendingCount > 0 && pendingCount < totalCount;
                  const isFullyPending = pendingCount === totalCount && totalCount > 0;
                  const isSelected = isRowSelected(gc.gcNo);

                  return (
                    <tr key={gc.gcNo} className={`transition-colors hover:bg-muted/30 ${isSelected ? "bg-primary/5" : ""}`}>
                      <td className="px-3 py-3"><input type="checkbox" className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer" checked={isSelected}
                        onChange={(e) => handleSelectRow(gc.gcNo, e.target.checked)}
                        title={isSelected ? 'Click to Deselect' : 'Click to Select'}
                      /></td>
                      <td className="px-3 py-3"><span className="font-semibold text-primary">{gc.gcNo}</span></td>
                      <td className="px-3 py-3"><div className="text-sm"><span className="text-foreground block">{consignorName}</span><span className="text-muted-foreground text-xs">→ {consigneeName}</span></div></td>
                      <td className="px-3 py-3"><div className="text-sm"><span className="text-foreground block font-semibold">{totalCount}</span><span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${isFullyPending ? 'bg-muted text-foreground' : isPartiallyPending ? 'bg-orange-500/10 text-orange-600' : 'bg-emerald-500/10 text-emerald-600'}`}>{pendingCount} pending</span></div></td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleOpenQtySelect(gc as GcEntry)} className="p-1.5 rounded-md text-blue-600 hover:bg-blue-500/10 transition-colors" title="Load"><PackageCheck className="w-4 h-4" /></button>
                          <button onClick={() => handlePrintSingle(gc.gcNo)} className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-500/10 transition-colors" title="Print"><Printer className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(gc.gcNo)} className="p-1.5 rounded-md text-destructive hover:bg-destructive/10 transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={5} className="px-3 py-12 text-center"><div className="flex flex-col items-center gap-2"><Package className="w-10 h-10 text-muted-foreground/30" /><p className="text-sm text-muted-foreground">No entries found</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards - below lg */}
        <div className="block lg:hidden divide-y divide-border">
          {loading ? (
            <div className="p-6 text-center"><div className="flex flex-col items-center gap-2"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /><span className="text-sm text-muted-foreground">Loading...</span></div></div>
          ) : paginatedData.length > 0 ? (
            paginatedData.map((gc) => {
              const consignorName = (gc as any).consignorName || 'N/A';
              const consigneeName = (gc as any).consigneeName || 'N/A';
              const loadedCount = gc.loadedCount || 0;
              const totalCount = parseInt((gc.totalQty ?? 0).toString()) || 0;
              const pendingCount = totalCount - loadedCount;
              const isPartiallyPending = pendingCount > 0 && pendingCount < totalCount;
              const isFullyPending = pendingCount === totalCount && totalCount > 0;
              const isSelected = isRowSelected(gc.gcNo);

              return (
                <div key={gc.gcNo} className={`p-4 transition-colors ${isSelected ? "bg-primary/5" : ""}`}>
                  <div className="flex gap-3">
                    <div className="pt-0.5 flex-shrink-0"><input type="checkbox" className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer" checked={isSelected}
                      onChange={(e) => handleSelectRow(gc.gcNo, e.target.checked)}
                      title={isSelected ? 'Click to Deselect' : 'Click to Select'}
                    /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5"><span className="font-bold text-primary">GC #{gc.gcNo}</span></div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${isFullyPending ? 'bg-muted text-foreground' : isPartiallyPending ? 'bg-orange-500/10 text-orange-600' : 'bg-emerald-500/10 text-emerald-600'}`}>{pendingCount} Pending</span>
                      </div>
                      <div className="space-y-1.5 text-sm mb-3">
                        <div className="flex items-center gap-2 text-foreground"><User className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" /><span className="text-muted-foreground">From:</span><span className="truncate">{consignorName}</span></div>
                        <div className="flex items-center gap-2 text-foreground"><ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" /><span className="text-muted-foreground">To:</span><span className="truncate">{consigneeName}</span></div>
                        <div className="flex items-center gap-2 text-foreground"><Package className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" /><span className="text-muted-foreground">Total Qty:</span><span className="font-semibold">{totalCount}</span></div>
                      </div>
                      <div className="flex items-center gap-2 pt-3 border-t border-border">
                        <button onClick={() => handleOpenQtySelect(gc as GcEntry)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-blue-600 bg-blue-500/10 hover:bg-blue-500/20 transition-colors"><PackageCheck className="w-3.5 h-3.5" />Load</button>
                        <button onClick={() => handlePrintSingle(gc.gcNo)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors"><Printer className="w-3.5 h-3.5" />Print</button>
                        <button onClick={() => handleDelete(gc.gcNo)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 transition-colors"><Trash2 className="w-3.5 h-3.5" />Delete</button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center"><div className="flex flex-col items-center gap-2"><Package className="w-10 h-10 text-muted-foreground/30" /><p className="text-sm text-muted-foreground">No entries found</p></div></div>
          )}
        </div>

        {/* Pagination */}
        <div className="border-t border-border p-4">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} itemsPerPage={itemsPerPage} onItemsPerPageChange={setItemsPerPage} totalItems={totalItems} />
        </div>
      </div>

      {/* Modals */}
      <ConfirmationDialog
        open={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete GC Entry"
        description={deleteMessage}
      >
        <div className="space-y-2">
          <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Reason for Delete <span className="text-destructive">*</span>
          </label>
          <textarea
            value={deleteReason}
            onChange={(e) => {
              setDeleteReason(e.target.value);
              if (formErrors.data) {
                setFormErrors(prev => {
                  const next = { ...prev };
                  delete next.data;
                  return next;
                });
              }
            }}
            className={`w-full min-h-[80px] p-3 text-sm bg-secondary/30 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/50 resize-none ${formErrors.data ? "border-destructive ring-1 ring-destructive/20" : "border-border"
              }`}
            placeholder="Please enter the reason for deletion..."
            autoFocus
          />
          {formErrors.data && (
            <p className="text-[11px] font-medium text-destructive animate-in fade-in slide-in-from-top-1 duration-200">
              {formErrors.data}
            </p>
          )}
        </div>
      </ConfirmationDialog>
      {reportPrintingJobs && <StockReportPrint data={reportPrintingJobs} onClose={() => setReportPrintingJobs(null)} />}
      {gcPrintingJobs && <GcPrintManager jobs={gcPrintingJobs} onClose={() => setGcPrintingJobs(null)} />}
      {loadListPrintingJobs && <LoadListPrintManager jobs={loadListPrintingJobs} onClose={() => setLoadListPrintingJobs(null)} />}
      {currentQtySelection && <QtySelectionDialog open={isQtySelectOpen} onClose={handleCloseQtySelect} onSelect={handleSaveSelectedQty} gcId={currentQtySelection.gcId} maxQty={currentQtySelection.maxQty} startNo={currentQtySelection.startNo} currentSelected={currentQtySelection.loadedPackages} contentItems={currentQtySelection.contentItems} />}
    </div>
  );
};