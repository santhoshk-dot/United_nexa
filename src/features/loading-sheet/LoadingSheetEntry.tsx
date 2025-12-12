// LoadingSheetEntry.tsx
import { useState, useCallback, useMemo } from 'react';
import { Trash2, Search, Printer, PackageCheck, Filter, XCircle, FilterX } from 'lucide-react';
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

// Filter type definition
type LoadingSheetFilter = {
  search?: string;
  filterType?: string;
  startDate?: string;
  endDate?: string;
  customStart?: string;
  customEnd?: string;
  destination?: string;
  consignor?: string;
  consignee?: string[];
  godown?: string;
};

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
    searchGodowns
  } = useData();

  const toast = useToast();

  // Server-side pagination hook - FIXED: Complete initialFilters
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
      godown: ''
    } as LoadingSheetFilter,
    initialItemsPerPage: 10,
  });

  // UI State
  const [showFilters, setShowFilters] = useState(false);
  const [destinationOption, setDestinationOption] = useState<any>(null);
  const [consignorOption, setConsignorOption] = useState<any>(null);
  const [godownOption, setGodownOption] = useState<any>(null);
  const [consigneeOptions, setConsigneeOptions] = useState<any[]>([]);

  // Selection State - FIXED: Proper typed snapshot
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
  const [exclusionFilter, setExclusionFilter] = useState<ExclusionFilterState>({
    isActive: false,
    filterKey: '',
  });

  // Print/Modal State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteMessage, setDeleteMessage] = useState('');
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
  const createCompleteFilters = (sourceFilters: LoadingSheetFilter): LoadingSheetFilter => {
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
    setGodownOption(null);

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

  const loadGodownOptions = useCallback(
    async (search: string, _prevOptions: any, { page }: any) => {
      const result = await searchGodowns(search, page);
      return {
        options: result.data.map((g: any) => ({
          value: g.godownName || g.name,
          label: g.godownName || g.name,
        })),
        hasMore: result.hasMore,
        additional: { page: page + 1 },
      };
    },
    [searchGodowns]
  );

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

    toast.success(`Selected ${totalItems} items (snapshot).`);
  };

  // ---------------------------------------------------------------------------
  // Exclude logic
  // ---------------------------------------------------------------------------
  const handleExcludeFilteredData = async () => {
    if (selectAllMode && selectAllSnapshot.active) {
      try {
        const allMatching = await fetchLoadingSheetPrintData([], true, {
          ...createCompleteFilters(filters)
        });

        if (!allMatching || allMatching.length === 0) {
          toast.error('No items found to exclude for current filters.');
          return;
        }

        const idsToExclude = allMatching.map((gc: any) => gc.gcNo);

        setExcludedGcIds((prev) => Array.from(new Set([...prev, ...idsToExclude])));

        let filterKey: string | undefined;
        if (filters.consignor) filterKey = 'Consignor';
        else if (filters.destination) filterKey = 'Destination';
        else if (filters.godown) filterKey = 'Godown';
        else if (filters.consignee && filters.consignee.length > 0) filterKey = 'Consignee';

        setExclusionFilter({ isActive: true, filterKey });

        toast.success(`Excluded ${idsToExclude.length} items from bulk selection.`);
      } catch (err) {
        console.error('Exclude filtered failed:', err);
        toast.error('Failed to exclude filtered records.');
      }
      return;
    }

    // MANUAL MODE
    if (!selectAllMode) {
      if (selectedGcIds.length === 0) {
        toast.error('No selected items to exclude.');
        return;
      }

      const idsToExclude = [...selectedGcIds];

      setExcludedGcIds((prev) => Array.from(new Set([...prev, ...idsToExclude])));
      setSelectedGcIds([]);
      setExclusionFilter({ isActive: true });

      toast.success(`Excluded ${idsToExclude.length} selected items.`);
    }
  };

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------
  const handleDelete = (gcNo: string) => {
    setDeletingId(gcNo);
    setDeleteMessage(`Are you sure you want to delete GC #${gcNo}?`);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deletingId) {
      await deleteGcEntry(deletingId);
      refresh();
      setSelectedGcIds((prev) => prev.filter((id) => id !== deletingId));
      setExcludedGcIds((prev) => prev.filter((id) => id !== deletingId));
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

  const responsiveBtnClass =
    'w-full md:w-auto text-[10px] xs:text-xs sm:text-sm h-8 sm:h-10 px-1 sm:px-4 whitespace-nowrap';

  // ---------------------------------------------------------------------------
  // JSX
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Top Control Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-background p-4 rounded-lg shadow border border-muted">
        <div className="flex items-center gap-2 w-full md:w-1/2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search all data..."
              value={filters.search || ''}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 bg-background text-foreground border border-muted-foreground/30 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            />
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={18}
            />
          </div>

          <Button
            variant={hasActiveFilters ? 'primary' : 'outline'}
            onClick={() => setShowFilters(!showFilters)}
            className="h-10 px-3 shrink-0"
            title="Toggle Filters"
          >
            <Filter size={18} className={hasActiveFilters ? 'mr-2' : ''} />
            {hasActiveFilters && 'Active'}
          </Button>
        </div>

        <div className="w-full md:w-auto mt-2 md:mt-0 grid grid-cols-2 gap-2 md:flex md:flex-row md:gap-2 md:justify-stretch">
          <Button
            variant="secondary"
            onClick={handlePrintSelected}
            disabled={finalCount === 0}
            className={responsiveBtnClass}
          >
            <Printer size={14} className="mr-1 sm:mr-2" />
            {printButtonText}
          </Button>

          <Button
            variant={bulkButtonVariant}
            onClick={isAllSelected ? handleCombinedBulkDeselect : handleCombinedBulkSelect}
            className={responsiveBtnClass}
            title={
              isAllSelected
                ? 'Click to Deselect All (clear bulk mode)'
                : 'Select all items matching current filters, or all entries if no filters active.'
            }
          >
            <BulkIconComponent size={14} className="mr-1 sm:mr-2" />
            {bulkButtonText}
          </Button>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="p-4 bg-muted/20 rounded-lg border border-muted animate-in fade-in slide-in-from-top-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
              Advanced Filters
            </h3>
            <div className="flex gap-2">
              {multipleSelected && (
                <button
                  onClick={handleExcludeFilteredData}
                  className="text-xs flex items-center text-destructive hover:text-destructive/80 font-medium"
                  disabled={paginatedData.length === 0}
                  title="Exclude based on current selection / filters"
                >
                  <XCircle size={14} className="mr-1 sm:mr-2" /> Exclude
                </button>
              )}

              <button
                onClick={clearAllFilters}
                className="text-xs flex items-center text-primary hover:text-primary/80 font-medium"
              >
                <FilterX size={14} className="mr-1" /> Clear All
              </button>
            </div>
          </div>

          /* {excludedGcIds.length > 0 && (
            <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 border border-yellow-300 rounded text-sm">
              <strong>Exclusion Active:</strong> {excludedGcIds.length} GCs are currently
              excluded from the selection{' '}
              {exclusionFilter.filterKey && (
                <>
                  (e.g., those matching <strong>{exclusionFilter.filterKey}</strong>)
                </>
              )}
            </div>
          )} */

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
                  const arr = Array.isArray(val) ? val : val ? [val] : [];
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

      {/* Data table */}
      <div className="bg-background rounded-lg shadow border border-muted overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-muted">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-primary border-muted-foreground/30 rounded focus:ring-primary"
                    checked={isAllVisibleSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isIndeterminate;
                    }}
                    onChange={handleDeselectAllVisible}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  GC No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Consignor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Consignee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  QTY (Total)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  QTY (Pending)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    Loading data...
                  </td>
                </tr>
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
                          onChange={(e) => handleSelectRow(gc.gcNo, e.target.checked)}
                          title={isSelected ? 'Click to Deselect' : 'Click to Select'}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary">
                        {gc.gcNo}
                      </td>
                      <td className="px-6 py-4 text-sm">{consignorName}</td>
                      <td className="px-6 py-4 text-sm">{consigneeName}</td>

                      <td className="px-6 py-4 text-sm font-semibold">{totalCount}</td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                          isFullyPending
                            ? 'text-foreground'
                            : isPartiallyPending
                            ? 'text-orange-500'
                            : 'text-green-600'
                        }`}
                      >
                        {pendingCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3 flex items-center">
                        <button
                          onClick={() => handleOpenQtySelect(gc as GcEntry)}
                          className="hover:text-blue-800 h-auto flex items-center text-blue-600"
                          title={`Pending Qty (${pendingCount}/${totalCount})`}
                        >
                          <PackageCheck size={18} />
                        </button>
                        <button
                          onClick={() => handlePrintSingle(gc.gcNo)}
                          className="text-green-600 hover:text-green-800"
                          title="Print Load Slip"
                        >
                          <Printer size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(gc.gcNo)}
                          className="text-destructive hover:text-destructive/80"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-12 text-center text-muted-foreground"
                  >
                    No entries found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile list */}
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
                        onChange={(e) => handleSelectRow(gc.gcNo, e.target.checked)}
                        title={isSelected ? 'Click to Deselect' : 'Click to Select'}
                      />
                      <div>
                        <div className="text-lg font-semibold text-primary">
                          GC #{gc.gcNo}
                        </div>
                        <div className="text-md font-medium text-foreground">
                          From: {consignorName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          To: {consigneeName}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col space-y-3 pt-1">
                      <button
                        onClick={() => handleOpenQtySelect(gc as GcEntry)}
                        className={`hover:text-blue-800 h-auto ${
                          isFullyPending ? 'text-red-600' : 'text-blue-600'
                        }`}
                        title={`Pending Qty (${pendingCount}/${totalCount})`}
                      >
                        <PackageCheck size={18} />
                      </button>
                      <button
                        onClick={() => handlePrintSingle(gc.gcNo)}
                        className="text-green-600"
                        title="Print Load Slip"
                      >
                        <Printer size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(gc.gcNo)}
                        className="text-destructive"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between mt-2 pt-2 border-t border-muted">
                    <span className="text-sm font-medium">
                      Case Qty:{' '}
                      <span className="text-foreground">{totalCount}</span>
                    </span>
                    <span className="text-sm font-medium">
                      Pending Qty:{' '}
                      <span
                        className={`font-bold ${
                          isFullyPending
                            ? 'text-foreground'
                            : isPartiallyPending
                            ? 'text-orange-500'
                            : 'text-green-600'
                        }`}
                      >
                        {pendingCount}
                      </span>
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              No entries found.
            </div>
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
          contentItems={currentQtySelection.contentItems}
        />
      )}
    </div>
  );
};
