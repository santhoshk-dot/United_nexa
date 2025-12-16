import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FilePenLine,
  Trash2,
  Search,
  Printer,
  FileText,
  Filter,
  XCircle,
  FilterX,
  PackageCheck,
  Plus,
  Hash,
  User,
  MapPin,
  Package,
  ChevronRight,
  Clock,
  ChevronUp,
} from 'lucide-react';
import { DateFilterButtons, getTodayDate, getYesterdayDate } from '../../../components/shared/DateFilterButtons';
import { ConfirmationDialog } from '../../../components/shared/ConfirmationDialog';
import { useData } from '../../../hooks/useData';
import { Button } from '../../../components/shared/Button';
import { AsyncAutocomplete } from '../../../components/shared/AsyncAutocomplete';
import { StockReportPrint } from './StockReportView';
import { GcPrintManager, type GcPrintJob } from '../gc-entry/GcPrintManager';
import type { GcEntry, Consignor, Consignee, PendingStockFilter, ExclusionFilterState } from '../../../types';
import { useServerPagination } from '../../../hooks/useServerPagination';
import { Pagination } from '../../../components/shared/Pagination';
import { useToast } from '../../../contexts/ToastContext';


type SelectAllSnapshot = {
  active: boolean;
  total: number;
  filters: PendingStockFilter;
};

export const PendingStockHistory = () => {
  const navigate = useNavigate();
  const {
    deleteGcEntry,
    fetchGcPrintData,
    fetchPendingStockReport,
    searchConsignors,
    searchConsignees,
    searchToPlaces,
  } = useData();

  const toast = useToast();

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
    refresh,
  } = useServerPagination<GcEntry>({
    endpoint: '/operations/pending-stock',
    skipLoader: true, // <--- NEW: Skip loader on initial load
    initialFilters: {
      search: '',
      filterType: 'all',
      startDate: '',
      endDate: '',
      customStart: '',
      customEnd: '',
      destination: '',
      consignor: '',
      consignee: []
    } as PendingStockFilter,
  });

  const [showFilters, setShowFilters] = useState(false);
  const [destinationOption, setDestinationOption] = useState<any>(null);
  const [consignorOption, setConsignorOption] = useState<any>(null);
  const [consigneeOptions, setConsigneeOptions] = useState<any[]>([]);

  const [selectedGcNos, setSelectedGcNos] = useState<string[]>([]);
  const [selectAllMode, setSelectAllMode] = useState(false);
  const [excludedGcNos, setExcludedGcNos] = useState<string[]>([]);

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
      consignee: []
    },
  });

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteMessage, setDeleteMessage] = useState('');

  const [reportPrintingData, setReportPrintingData] = useState<any[] | null>(null);
  const [gcPrintingJobs, setGcPrintingJobs] = useState<GcPrintJob[] | null>(null);

  const [, setExclusionFilter] = useState<ExclusionFilterState>({
    isActive: false,
    filterKey: '',
  });

  const createCompleteFilters = (sourceFilters: PendingStockFilter): PendingStockFilter => {
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
    };
  };

  const loadDestinationOptions = useCallback(
    async (search: string, _prevOptions: any, { page }: any) => {
      const result = await searchToPlaces(search, page);
      return {
        options: result.data.map((p: any) => ({ value: p.placeName, label: p.placeName })),
        hasMore: result.hasMore,
        additional: { page: page + 1 },
      };
    },
    [searchToPlaces],
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
    [searchConsignors],
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
    [searchConsignees],
  );

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

    setFilters({
      search: '',
      filterType: 'all',
      startDate: '',
      endDate: '',
      destination: '',
      consignor: '',
      consignee: [],
    });

    setSelectAllMode(false);
    setExcludedGcNos([]);
    setSelectedGcNos([]);
    setExclusionFilter({ isActive: false, filterKey: '' });
    setSelectAllSnapshot({
      active: false,
      total: 0,
      filters: createCompleteFilters({})
    });
  };

  const hasActiveFilters =
    !!filters.destination ||
    !!filters.consignor ||
    (filters.consignee && filters.consignee.length > 0) ||
    filters.filterType !== 'all' ||
    !!filters.search;

  const isRowSelected = (gcNo: string): boolean => {
    if (selectAllMode && selectAllSnapshot.active) {
      return !excludedGcNos.includes(gcNo);
    }
    return selectedGcNos.includes(gcNo);
  };

  const isAllVisibleSelected =
    paginatedData.length > 0 && paginatedData.every((gc) => isRowSelected(gc.gcNo));

  const isIndeterminate = useMemo(() => {
    if (paginatedData.length === 0) return false;
    const selectedCount = paginatedData.filter((gc) => isRowSelected(gc.gcNo)).length;
    return selectedCount > 0 && selectedCount < paginatedData.length;
  }, [paginatedData, selectAllMode, excludedGcNos, selectedGcNos, selectAllSnapshot]);

  const finalCount = selectAllMode && selectAllSnapshot.active
    ? Math.max(0, (selectAllSnapshot.total || totalItems) - excludedGcNos.length)
    : selectedGcNos.length;

  const isAllSelected = selectAllMode && selectAllSnapshot.active
    ? excludedGcNos.length === 0
    : (totalItems > 0 && selectedGcNos.length === totalItems);

  const multipleSelected = finalCount > 0;

  const handleSelectAllVisible = (e: React.ChangeEvent<HTMLInputElement>) => {
    const visibleGcNos = paginatedData.map((gc) => gc.gcNo);
    const checked = e.target.checked;

    if (checked) {
      if (selectAllMode && selectAllSnapshot.active) {
        setExcludedGcNos((prev) => prev.filter((id) => !visibleGcNos.includes(id)));
      } else {
        setSelectedGcNos((prev) => Array.from(new Set([...prev, ...visibleGcNos])));
      }
    } else {
      if (selectAllMode && selectAllSnapshot.active) {
        setExcludedGcNos((prev) => Array.from(new Set([...prev, ...visibleGcNos])));
      } else {
        setSelectedGcNos((prev) => prev.filter((id) => !visibleGcNos.includes(id)));
      }
    }
  };

  const handleSelectRow = (e: React.ChangeEvent<HTMLInputElement>, gcNo: string) => {
    const checked = e.target.checked;

    if (selectAllMode && selectAllSnapshot.active) {
      if (checked) {
        setExcludedGcNos((prev) => prev.filter((id) => id !== gcNo));
      } else {
        setExcludedGcNos((prev) => Array.from(new Set([...prev, gcNo])));
      }
    } else {
      if (checked) {
        setSelectedGcNos((prev) => Array.from(new Set([...prev, gcNo])));
      } else {
        setSelectedGcNos((prev) => prev.filter((id) => id !== gcNo));
      }
    }
  };

  const handleCombinedBulkSelect = () => {
    if (totalItems === 0) {
      toast.error('No items found to select based on current filters.');
      return;
    }

    const completeFilters = createCompleteFilters(filters);

    setSelectAllMode(true);
    setExcludedGcNos([]);
    setSelectedGcNos([]);
    setExclusionFilter({ isActive: false, filterKey: '' });
    setSelectAllSnapshot({
      active: true,
      total: totalItems,
      filters: completeFilters,
    });
  };

  const handleCombinedBulkDeselect = () => {
    setSelectAllMode(false);
    setExcludedGcNos([]);
    setSelectedGcNos([]);
    setExclusionFilter({ isActive: false, filterKey: '' });
    setSelectAllSnapshot({
      active: false,
      total: 0,
      filters: createCompleteFilters({})
    });
  };

  const handleExcludeFilteredData = async () => {
    if (!selectAllMode || !selectAllSnapshot.active) {
      const selectedVisible = paginatedData
        .map(gc => gc.gcNo)
        .filter(id => selectedGcNos.includes(id));

      if (selectedVisible.length === 0) {
        return;
      }

      setExcludedGcNos(prev =>
        Array.from(new Set([...prev, ...selectedVisible]))
      );
      setSelectedGcNos(prev => prev.filter(id => !selectedVisible.includes(id)));
      setExclusionFilter({ isActive: true, filterKey: "Manual Selection" });

      return;
    }

    try {
      const allMatching = await fetchGcPrintData([], true, {
        ...createCompleteFilters(filters),
        page: 1,
        perPage: 0,
        pendingStockView: true,
      });

      if (!allMatching || allMatching.length === 0) {
        return;
      }

      const idsToExclude = allMatching.map((gc: any) => gc.gcNo);

      setExcludedGcNos(prev =>
        Array.from(new Set([...prev, ...idsToExclude]))
      );

      setExclusionFilter({ isActive: true, filterKey: "Filter" });
      toast.success(`Excluded ${idsToExclude.length} items from bulk selection.`);
    } catch (e) {
      console.error(e);
    }
  };

  const bulkButtonText = isAllSelected ? 'Clear Selection' : 'Select All';
  const bulkButtonIcon = isAllSelected ? XCircle : PackageCheck;
  const bulkButtonVariant = isAllSelected ? 'destructive' : 'primary';
  const handleBulkAction = isAllSelected ? handleCombinedBulkDeselect : handleCombinedBulkSelect;
  const BulkIconComponent = bulkButtonIcon;

  const handleEdit = (gcNo: string) => navigate(`/gc-entry/edit/${gcNo}`);

  const handleDelete = (gcNo: string) => {
    setDeletingId(gcNo);
    setDeleteMessage(`Are you sure you want to delete GC #${gcNo}?`);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deletingId) {
      await deleteGcEntry(deletingId);
      refresh();
      setSelectedGcNos((prev) => prev.filter((id) => id !== deletingId));
      setExcludedGcNos((prev) => prev.filter((id) => id !== deletingId));
    }
    setIsConfirmOpen(false);
    setDeletingId(null);
  };

  const handlePrintSingle = async (gcNo: string) => {
    try {
      const printData = await fetchGcPrintData([gcNo]);
      if (printData && printData.length > 0) {
        const item = printData[0];
        const { consignor, consignee, ...gcData } = item;
        setGcPrintingJobs([
          {
            gc: gcData as GcEntry,
            consignor: consignor as Consignor,
            consignee: consignee as Consignee,
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

  // FIXED: Keep selection after print
  const handlePrintSelected = async () => {
    if (finalCount === 0) {
      toast.error('No GCs selected for printing.');
      return;
    }

    try {
      let printData: any[] = [];

      if (selectAllMode && selectAllSnapshot.active) {
        const filtersForPrint: PendingStockFilter = {
          ...selectAllSnapshot.filters,
          excludeIds: excludedGcNos.length > 0 ? excludedGcNos : undefined,
          pendingStockView: true,
        } as any;

        printData = await fetchGcPrintData([], true, filtersForPrint);
      } else {
        printData = await fetchGcPrintData(selectedGcNos);
      }

      if (!printData || printData.length === 0) {
        toast.error('Could not fetch data for selected GCs.');
        return;
      }

      const jobs = printData
        .map((item: any): GcPrintJob | null => {
          const { consignor, consignee, ...gcData } = item;
          if (!consignor || !consignee) return null;
          return {
            gc: gcData as GcEntry,
            consignor: consignor as Consignor,
            consignee: consignee as Consignee,
          };
        })
        .filter((job): job is GcPrintJob => job !== null);

      if (jobs.length > 0) {
        setGcPrintingJobs(jobs);
        toast.success(`Prepared ${jobs.length} print jobs.`);
        // FIXED: Selection is NOT reset after print - keeping it visible
      } else {
        toast.error('Could not prepare print jobs.');
      }
    } catch (error) {
      console.error('Bulk print error:', error);
      toast.error('An error occurred while preparing print jobs.');
    }
  };

  const handleShowReport = async () => {
    try {
      const reportData = await fetchPendingStockReport(filters);

      if (!reportData || reportData.length === 0) {
        toast.error('No pending stock found for current filters.');
        return;
      }

      setReportPrintingData(reportData);
    } catch (error) {
      console.error('Error fetching report data', error);
      toast.error('Failed to generate report.');
    }
  };

  const printButtonText = `Print (${finalCount})`;

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
              placeholder="Search pending stock..."
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
              onClick={handleShowReport}
              className="h-10"
            >
              <FileText className="w-4 h-4" />
              Report
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
              onClick={handleBulkAction}
              disabled={!selectAllMode && selectedGcNos.length === 0 && totalItems === 0}
              title={
                bulkButtonText === 'Clear Selection'
                  ? 'Click to remove all items from selection'
                  : 'Select all filtered items'
              }

              className="h-10"
            >
              <BulkIconComponent className="w-4 h-4" />
              {bulkButtonText}
            </Button>

            <Button
              variant="primary"
              onClick={() => navigate('/gc-entry/new')}
              className="h-10"
            >
              <Plus className="w-4 h-4" />
              Add New GC
            </Button>
          </div>
        </div>

        {/* Tablet & Mobile - Two Rows (below xl) */}
        <div className="flex xl:hidden flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Search pending stock..." value={filters.search || ''} onChange={handleSearchChange} className="w-full h-10 pl-10 pr-4 bg-secondary/50 text-foreground rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60 text-sm" />
            </div>
            <Button variant={hasActiveFilters ? "primary" : "outline"} onClick={() => setShowFilters(!showFilters)} className="h-10 px-3 shrink-0">
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline ml-1">Filters</span>
              {hasActiveFilters && <span className="ml-1.5 w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={handleShowReport} className="flex-1 h-9 text-xs sm:text-sm">
              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline ml-1">Report</span>
            </Button>

            <Button variant="secondary" onClick={handlePrintSelected} disabled={finalCount === 0} className="flex-1 h-9 text-xs sm:text-sm">
              <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="ml-1">({finalCount})</span>
            </Button>

            <Button variant={bulkButtonVariant}
              onClick={handleBulkAction}
              disabled={!selectAllMode && selectedGcNos.length === 0 && totalItems === 0}
              title={
                bulkButtonText === 'Clear Selection'
                  ? 'Click to remove all items from selection'
                  : 'Select all filtered items'
              }
              className="flex-1 h-9 text-xs sm:text-sm">
              <BulkIconComponent className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline ml-1">{isAllSelected ? "Clear" : "Select All"}</span>
              <span className="sm:hidden ml-1">{isAllSelected ? "Clear" : "All"}</span>
            </Button>

            <Button variant="primary" onClick={() => navigate('/gc-entry/new')} className="flex-1 h-9 text-xs sm:text-sm">
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline ml-1">Add GC</span>
              <span className="sm:hidden ml-1">Add</span>
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

          {/* {exclusionFilter.isActive && selectAllMode && (
            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-3">
              <XCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                Exclusion Active: {excludedGcIds.length} GCs excluded
                {exclusionFilter.filterKey && <> (filtered by <strong>{exclusionFilter.filterKey}</strong>)</>}
              </p>
            </div>
          )} */}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <AsyncAutocomplete label="Destination" loadOptions={loadDestinationOptions} value={destinationOption} onChange={(val) => { setDestinationOption(val); setFilters({ destination: (val as any)?.value || '' }); }} placeholder="Search destination..." defaultOptions />
            <AsyncAutocomplete label="Consignor" loadOptions={loadConsignorOptions} value={consignorOption} onChange={(val) => { setConsignorOption(val); setFilters({ consignor: (val as any)?.value || '' }); }} placeholder="Search consignor..." defaultOptions />
            <AsyncAutocomplete label="Consignee (Multi-select)" loadOptions={loadConsigneeOptions} value={consigneeOptions} onChange={(val: any) => { const arr = Array.isArray(val) ? val : val ? [val] : []; setConsigneeOptions(arr); setFilters({ consignee: arr.map((v: any) => v.value) }); }} placeholder="Select consignees..." isMulti={true} defaultOptions closeMenuOnSelect={false} showAllSelected={true} />
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
                <th className="px-4 py-3 text-left w-12">
                  <input type="checkbox" className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer" checked={isAllVisibleSelected} ref={(el) => { if (el) el.indeterminate = isIndeterminate; }} onChange={handleSelectAllVisible} />
                </th>
                <th className="px-4 py-3 text-left"><div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider"><Hash className="w-3.5 h-3.5" />GC No</div></th>
                <th className="px-4 py-3 text-left"><div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider"><User className="w-3.5 h-3.5" />Consignor</div></th>
                <th className="px-4 py-3 text-left"><div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider"><User className="w-3.5 h-3.5" />Consignee</div></th>
                <th className="px-4 py-3 text-left"><div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider"><MapPin className="w-3.5 h-3.5" />From</div></th>
                <th className="px-4 py-3 text-left"><div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider"><MapPin className="w-3.5 h-3.5" />To</div></th>
                <th className="px-4 py-3 text-left"><div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider"><Package className="w-3.5 h-3.5" />Qty</div></th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center"><div className="flex flex-col items-center gap-3"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /><span className="text-sm text-muted-foreground">Loading...</span></div></td></tr>
              ) : paginatedData.length > 0 ? (
                paginatedData.map((gc) => {
                  const consignorName = (gc as any).consignorName || (gc as any).consignor?.name || 'N/A';
                  const consigneeName = (gc as any).consigneeName || (gc as any).consignee?.name || 'N/A';
                  const isSelected = isRowSelected(gc.gcNo);

                  return (
                    <tr key={gc.id} className={`transition-colors hover:bg-muted/30 ${isSelected ? "bg-primary/5" : ""}`}>
                      <td className="px-4 py-3"><input type="checkbox" className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer" checked={isSelected} onChange={(e) => handleSelectRow(e, gc.gcNo)} /></td>
                      <td className="px-4 py-3"><span className="font-semibold text-primary">{gc.gcNo}</span></td>
                      <td className="px-4 py-3"><span className="text-sm text-foreground">{consignorName}</span></td>
                      <td className="px-4 py-3"><span className="text-sm text-foreground">{consigneeName}</span></td>
                      <td className="px-4 py-3"><span className="text-sm text-foreground">{gc.from}</span></td>
                      <td className="px-4 py-3"><span className="text-sm text-foreground">{gc.destination}</span></td>
                      <td className="px-4 py-3"><span className="text-sm text-foreground">{gc.totalQty}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleEdit(gc.gcNo)} className="p-1.5 rounded-md text-blue-600 hover:bg-blue-500/10 transition-colors" title="Edit"><FilePenLine className="w-4 h-4" /></button>
                          <button onClick={() => handlePrintSingle(gc.gcNo)} className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-500/10 transition-colors" title="Print"><Printer className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(gc.gcNo)} className="p-1.5 rounded-md text-destructive hover:bg-destructive/10 transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={8} className="px-4 py-12 text-center"><div className="flex flex-col items-center gap-2"><Clock className="w-10 h-10 text-muted-foreground/30" /><p className="text-sm text-muted-foreground">No Pending Stock entries found</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Tablet Table - lg to xl */}
        <div className="hidden lg:block xl:hidden overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-3 py-3 text-left w-10"><input type="checkbox" className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer" checked={isAllVisibleSelected} ref={(el) => { if (el) el.indeterminate = isIndeterminate; }} onChange={handleSelectAllVisible} /></th>
                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">GC No</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Consignor / Consignee</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Route / Qty</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={5} className="px-3 py-12 text-center"><div className="flex flex-col items-center gap-3"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /><span className="text-sm text-muted-foreground">Loading...</span></div></td></tr>
              ) : paginatedData.length > 0 ? (
                paginatedData.map((gc) => {
                  const consignorName = (gc as any).consignorName || (gc as any).consignor?.name || 'N/A';
                  const consigneeName = (gc as any).consigneeName || (gc as any).consignee?.name || 'N/A';
                  const isSelected = isRowSelected(gc.gcNo);

                  return (
                    <tr key={gc.id} className={`transition-colors hover:bg-muted/30 ${isSelected ? "bg-primary/5" : ""}`}>
                      <td className="px-3 py-3"><input type="checkbox" className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer" checked={isSelected} onChange={(e) => handleSelectRow(e, gc.gcNo)} /></td>
                      <td className="px-3 py-3"><span className="font-semibold text-primary">{gc.gcNo}</span></td>
                      <td className="px-3 py-3"><div className="text-sm"><span className="text-foreground block">{consignorName}</span><span className="text-muted-foreground text-xs">→ {consigneeName}</span></div></td>
                      <td className="px-3 py-3"><div className="text-sm"><span className="text-foreground block">{gc.from} → {gc.destination}</span><span className="text-muted-foreground text-xs">Qty: {gc.totalQty}</span></div></td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleEdit(gc.gcNo)} className="p-1.5 rounded-md text-blue-600 hover:bg-blue-500/10 transition-colors" title="Edit"><FilePenLine className="w-4 h-4" /></button>
                          <button onClick={() => handlePrintSingle(gc.gcNo)} className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-500/10 transition-colors" title="Print"><Printer className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(gc.gcNo)} className="p-1.5 rounded-md text-destructive hover:bg-destructive/10 transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={5} className="px-3 py-12 text-center"><div className="flex flex-col items-center gap-2"><Clock className="w-10 h-10 text-muted-foreground/30" /><p className="text-sm text-muted-foreground">No Pending Stock entries found</p></div></td></tr>
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
              const consignorName = (gc as any).consignorName || (gc as any).consignor?.name || 'N/A';
              const consigneeName = (gc as any).consigneeName || (gc as any).consignee?.name || 'N/A';
              const isSelected = isRowSelected(gc.gcNo);

              return (
                <div key={gc.id} className={`p-4 transition-colors ${isSelected ? "bg-primary/5" : ""}`}>
                  <div className="flex gap-3">
                    <div className="pt-0.5 flex-shrink-0"><input type="checkbox" className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer" checked={isSelected} onChange={(e) => handleSelectRow(e, gc.gcNo)} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5"><Hash className="w-4 h-4 text-primary/60" /><span className="font-bold text-primary">GC #{gc.gcNo}</span></div>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-600"><Clock className="w-3 h-3" />Pending</span>
                      </div>
                      <div className="space-y-1.5 text-sm mb-3">
                        <div className="flex items-center gap-2 text-foreground"><User className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" /><span className="text-muted-foreground">From:</span><span className="truncate">{consignorName}</span></div>
                        <div className="flex items-center gap-2 text-foreground"><ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" /><span className="text-muted-foreground">To:</span><span className="truncate">{consigneeName}</span></div>
                        <div className="flex items-center gap-2 text-foreground"><MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" /><span className="text-muted-foreground">Route:</span><span className="truncate">{gc.from} → {gc.destination}</span></div>
                        <div className="flex items-center gap-2 text-foreground"><Package className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" /><span className="text-muted-foreground">Qty:</span><span className="font-semibold">{gc.totalQty}</span></div>
                      </div>
                      <div className="flex items-center gap-2 pt-3 border-t border-border">
                        <button onClick={() => handleEdit(gc.gcNo)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-blue-600 bg-blue-500/10 hover:bg-blue-500/20 transition-colors"><FilePenLine className="w-3.5 h-3.5" />Edit</button>
                        <button onClick={() => handlePrintSingle(gc.gcNo)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors"><Printer className="w-3.5 h-3.5" />Print</button>
                        <button onClick={() => handleDelete(gc.gcNo)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 transition-colors"><Trash2 className="w-3.5 h-3.5" />Delete</button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center"><div className="flex flex-col items-center gap-2"><Clock className="w-10 h-10 text-muted-foreground/30" /><p className="text-sm text-muted-foreground">No Pending Stock entries found</p></div></div>
          )}
        </div>

        {/* Pagination */}
        <div className="border-t border-border p-4">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} itemsPerPage={itemsPerPage} onItemsPerPageChange={setItemsPerPage} totalItems={totalItems} />
        </div>
      </div>

      {/* Modals */}
      <ConfirmationDialog open={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={handleConfirmDelete} title="Delete GC" description={deleteMessage} />
      {reportPrintingData && <StockReportPrint data={reportPrintingData} onClose={() => setReportPrintingData(null)} />}
      {gcPrintingJobs && <GcPrintManager jobs={gcPrintingJobs} onClose={() => setGcPrintingJobs(null)} />}
    </div>
  );
};
