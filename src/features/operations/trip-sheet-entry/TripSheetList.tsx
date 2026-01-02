import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
  MapPin,
  Calendar,
  IndianRupee,
  ChevronRight,
  Truck,
  ChevronUp,
} from "lucide-react";
import { DateFilterButtons, getTodayDate, getYesterdayDate } from "../../../components/shared/DateFilterButtons";
import { ConfirmationDialog } from "../../../components/shared/ConfirmationDialog";
import { Button } from "../../../components/shared/Button";
import { AsyncAutocomplete } from "../../../components/shared/AsyncAutocomplete";
import { useData } from "../../../hooks/useData";
import { useServerPagination } from "../../../hooks/useServerPagination";
import type { TripSheetEntry, ToPlace, Consignor, Consignee, TripSheetFilter, ExclusionFilterState } from "../../../types";
import { Pagination } from "../../../components/shared/Pagination";
import { TripSheetPrintManager } from "./TripSheetPrintManager";
import { TripSheetReportPrint } from "./TripSheetReportView";
import { useToast } from "../../../contexts/ToastContext";

type SelectAllSnapshot = {
  active: boolean;
  total: number;
  filters: TripSheetFilter;
};

export const TripSheetList = () => {
  const navigate = useNavigate();
  const {
    deleteTripSheet,
    fetchTripSheetPrintData,
    fetchFilteredTripSheetIds, // 🟢 NEW: Add this for exclude functionality
    fetchTripSheetReport,
    searchConsignors,
    searchConsignees,
    searchToPlaces
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
    refresh
  } = useServerPagination<TripSheetEntry>({
    endpoint: "/operations/tripsheet",
    skipLoader: true,
    initialFilters: {
      search: "",
      filterType: "all",
      startDate: "",
      endDate: "",
      customStart: "",
      customEnd: "",
      toPlace: "",
      consignor: "",
      consignee: []
    } as TripSheetFilter,
  });

  const [showFilters, setShowFilters] = useState(false);
  const [destinationOption, setDestinationOption] = useState<any>(null);
  const [consignorOption, setConsignorOption] = useState<any>(null);
  const [consigneeOptions, setConsigneeOptions] = useState<any[]>([]);

  // Selection state
  const [selectedMfNos, setSelectedMfNos] = useState<string[]>([]);
  const [selectAllMode, setSelectAllMode] = useState(false);
  const [excludedMfNos, setExcludedMfNos] = useState<string[]>([]);

  // Snapshot state - initialized with proper empty filter object
  const [selectAllSnapshot, setSelectAllSnapshot] = useState<SelectAllSnapshot>({
    active: false,
    total: 0,
    filters: {
      search: "",
      filterType: "all",
      startDate: "",
      endDate: "",
      customStart: "",
      customEnd: "",
      toPlace: "",
      consignor: "",
      consignee: []
    },
  });

  // Exclusion filter banner
  const [, setExclusionFilter] = useState<ExclusionFilterState>({
    isActive: false,
    filterKey: ""
  });

  const [printingSheets, setPrintingSheets] = useState<TripSheetEntry[] | null>(null);
  const [reportPrintingJobs, setReportPrintingJobs] = useState<TripSheetEntry[] | null>(null);
  const [delId, setDelId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState("");
  const [deleteReason, setDeleteReason] = useState("");

  // Async loaders
  const loadDestinationOptions = useCallback(
    async (search: string, _prevOptions: any, { page }: any) => {
      const result = await searchToPlaces(search, page);
      return {
        options: result.data.map((p: ToPlace) => ({ value: p.placeName, label: p.placeName })),
        hasMore: result.hasMore,
        additional: { page: page + 1 }
      };
    },
    [searchToPlaces]
  );

  const loadConsignorOptions = useCallback(
    async (search: string, _prevOptions: any, { page }: any) => {
      const result = await searchConsignors(search, page);
      return {
        options: result.data.map((c: Consignor) => ({ value: c.id, label: c.name })),
        hasMore: result.hasMore,
        additional: { page: page + 1 }
      };
    },
    [searchConsignors]
  );

  const loadConsigneeOptions = useCallback(
    async (search: string, _prevOptions: any, { page }: any) => {
      const result = await searchConsignees(search, page);
      return {
        options: result.data.map((c: Consignee) => ({ value: c.id, label: c.name })),
        hasMore: result.hasMore,
        additional: { page: page + 1 }
      };
    },
    [searchConsignees]
  );

  // Helper function to create complete filter object
  const createCompleteFilters = (sourceFilters: Partial<TripSheetFilter>): TripSheetFilter => {
    return {
      search: sourceFilters.search || "",
      filterType: sourceFilters.filterType || "all",
      startDate: sourceFilters.startDate || "",
      endDate: sourceFilters.endDate || "",
      customStart: sourceFilters.customStart || "",
      customEnd: sourceFilters.customEnd || "",
      toPlace: sourceFilters.toPlace || "",
      consignor: sourceFilters.consignor || "",
      consignee: sourceFilters.consignee || [],
    };
  };

  // Filter handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ search: e.target.value });
  };

  const handleFilterTypeChange = (type: string) => {
    let start = "";
    let end = "";

    if (type === "today") {
      start = getTodayDate();
      end = getTodayDate();
    } else if (type === "yesterday") {
      start = getYesterdayDate();
      end = getYesterdayDate();
    } else if (type === "week") {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      start = d.toISOString().split("T")[0];
      end = getTodayDate();
    }

    setFilters({
      filterType: type,
      startDate: start,
      endDate: end,
      customStart: "",
      customEnd: ""
    });
  };

  const handleCustomDateChange = (start: string, end: string) => {
    setFilters({
      filterType: "custom",
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

    setFilters({
      search: "",
      filterType: "all",
      startDate: "",
      endDate: "",
      toPlace: "",
      consignor: "",
      consignee: []
    });

    // Clear selection + exclusion/snapshot state
    setSelectAllMode(false);
    setSelectedMfNos([]);
    setExcludedMfNos([]);
    setExclusionFilter({ isActive: false, filterKey: "" });
    setSelectAllSnapshot({
      active: false,
      total: 0,
      filters: createCompleteFilters({})
    });
  };

  // Selection Helpers
  const isRowSelected = (mfNo: string): boolean => {
    if (selectAllMode && selectAllSnapshot.active) {
      return !excludedMfNos.includes(mfNo);
    }
    return selectedMfNos.includes(mfNo);
  };

  const isAllVisibleSelected =
    paginatedData.length > 0 && paginatedData.every((ts) => isRowSelected(ts.mfNo));

  const isIndeterminate = useMemo(() => {
    if (paginatedData.length === 0) return false;
    const selectedCount = paginatedData.filter((ts) => isRowSelected(ts.mfNo)).length;
    return selectedCount > 0 && selectedCount < paginatedData.length;
  }, [paginatedData, selectAllMode, excludedMfNos, selectedMfNos, selectAllSnapshot]);

  // Counts using Snapshot Logic
  const finalCount = selectAllMode && selectAllSnapshot.active
    ? Math.max(0, (selectAllSnapshot.total || totalItems) - excludedMfNos.length)
    : selectedMfNos.length;

  const printButtonText = `Print (${finalCount})`;

  // Determine if everything is selected across the dataset
  const isAllSelected = selectAllMode && selectAllSnapshot.active
    ? excludedMfNos.length === 0
    : (totalItems > 0 && selectedMfNos.length === totalItems);

  // Header checkbox - select/deselect visible page only
  const handleSelectAllVisible = (e: React.ChangeEvent<HTMLInputElement>) => {
    const visibleMfNos = paginatedData.map((ts) => ts.mfNo);
    const checked = e.target.checked;

    if (checked) {
      if (selectAllMode && selectAllSnapshot.active) {
        setExcludedMfNos((prev) => prev.filter((mfNo) => !visibleMfNos.includes(mfNo)));
      } else {
        setSelectedMfNos((prev) => Array.from(new Set([...prev, ...visibleMfNos])));
      }
    } else {
      if (selectAllMode && selectAllSnapshot.active) {
        setExcludedMfNos((prev) => Array.from(new Set([...prev, ...visibleMfNos])));
      } else {
        setSelectedMfNos((prev) => prev.filter((id) => !visibleMfNos.includes(id)));
      }
    }
  };

  // Row checkbox
  const handleSelectRow = (id: string, checked: boolean) => {
    if (selectAllMode && selectAllSnapshot.active) {
      if (checked) {
        setExcludedMfNos((prev) => prev.filter((mfNo) => mfNo !== id));
      } else {
        setExcludedMfNos((prev) => Array.from(new Set([...prev, id])));
      }
    } else {
      if (checked) {
        setSelectedMfNos((prev) => Array.from(new Set([...prev, id])));
      } else {
        setSelectedMfNos((prev) => prev.filter((mfNo) => mfNo !== id));
      }
    }
  };

  // Clear Selection
  const handleCombinedBulkDeselect = () => {
    setSelectAllMode(false);
    setExcludedMfNos([]);
    setSelectedMfNos([]);
    setExclusionFilter({ isActive: false, filterKey: "" });
    setSelectAllSnapshot({
      active: false,
      total: 0,
      filters: createCompleteFilters({})
    });
  };

  // Select All - Creates snapshot with COMPLETE filter object
  const handleCombinedBulkSelect = () => {
    if (totalItems === 0) {
      toast.error("No items found to select based on current filters.");
      return;
    }

    // Create a complete snapshot of ALL filter fields
    const completeFilters = createCompleteFilters(filters);

    setSelectAllMode(true);
    setExcludedMfNos([]);
    setSelectedMfNos([]);
    setExclusionFilter({ isActive: false, filterKey: "" });
    setSelectAllSnapshot({
      active: true,
      total: totalItems,
      filters: completeFilters,
    });
  };

  // ---------------------------------------------------------------------------
  // 🟢 NEW: Exclude logic - Uses dedicated API endpoint
  // ---------------------------------------------------------------------------
  const handleExcludeFilteredData = async () => {
    const visibleMfNos = paginatedData.map((ts) => ts.mfNo);

    // CASE 1: Manual Selection Mode - exclude selected visible items
    if (!selectAllMode || !selectAllSnapshot.active) {
      const selectedVisible = visibleMfNos.filter((id) => selectedMfNos.includes(id));

      if (selectedVisible.length === 0) {
        toast.error("Select at least one item to exclude.");
        return;
      }

      setSelectedMfNos((prev) => prev.filter((id) => !selectedVisible.includes(id)));
      setExcludedMfNos((prev) => Array.from(new Set([...prev, ...selectedVisible])));
      setExclusionFilter({ isActive: true, filterKey: "Manual Selection" });
      toast.success(`Excluded ${selectedVisible.length} items.`);
      return;
    }

    // CASE 2: Select-All Mode - Check if filters are active
    const hasFiltersActive =
      !!filters.toPlace ||
      !!filters.consignor ||
      (filters.consignee && filters.consignee.length > 0) ||
      filters.filterType !== "all" ||
      !!filters.search;

    // If no filters active, exclude visible items on current page
    if (!hasFiltersActive) {
      if (visibleMfNos.length === 0) {
        toast.error("No visible items to exclude.");
        return;
      }

      setExcludedMfNos((prev) => Array.from(new Set([...prev, ...visibleMfNos])));
      toast.success(`Excluded ${visibleMfNos.length} visible items.`);
      return;
    }

    // Filters are active - fetch ALL matching IDs from dedicated API endpoint
    try {
      const currentFilters = createCompleteFilters(filters);
      const mfNos = await fetchFilteredTripSheetIds(currentFilters);

      if (!mfNos || mfNos.length === 0) {
        toast.error("No items found to exclude for current filters.");
        return;
      }

      setExcludedMfNos((prev) => Array.from(new Set([...prev, ...mfNos])));
      setExclusionFilter({ isActive: true, filterKey: "Filter" });
      toast.success(`Excluded ${mfNos.length} items from selection.`);
    } catch (e) {
      console.error("Exclude failed:", e);
      toast.error("Failed to exclude filtered records.");
    }
  };

  const onDelete = (mfNo: string) => {
    setDelId(mfNo);
    setDeleteMessage(`Are you sure you want to delete TS #${mfNo}?`);
    setDeleteReason("");
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!delId) return;
    setConfirmOpen(false);
    try {
      await deleteTripSheet(delId, deleteReason);
      refresh();
      setSelectedMfNos((prev) => prev.filter((id) => id !== delId));
      setExcludedMfNos((prev) => prev.filter((id) => id !== delId));
    } catch (error) {
      console.error("Deletion failed:", error);
      toast.error(`Failed to delete TS #${delId}.`);
    } finally {
      setDelId(null);
    }
  };

  // Bulk Print Handler
  const handlePrintSelected = async () => {
    if (finalCount === 0) {
      toast.error("No Trip Sheets selected for printing.");
      return;
    }

    try {
      let sheets: TripSheetEntry[] = [];

      if (selectAllMode && selectAllSnapshot.active) {
        // Bulk mode: use snapshot filters and excluded IDs
        const filtersForPrint: TripSheetFilter = {
          ...selectAllSnapshot.filters,
          excludeIds: excludedMfNos.length > 0 ? excludedMfNos : undefined,
        };

        sheets = await fetchTripSheetPrintData([], true, filtersForPrint);
      } else {
        // Manual mode: use explicitly selected IDs
        sheets = await fetchTripSheetPrintData(selectedMfNos);
      }

      if (sheets && sheets.length > 0) {
        setPrintingSheets(sheets);
        toast.success(`Prepared ${sheets.length} print job(s).`);
      } else {
        toast.error("Failed to load data for printing. No Trip Sheets matched criteria.");
      }
    } catch (e) {
      console.error("Error loading print data:", e);
      toast.error("Error loading print data.");
    }
  };

  const handlePrintSingle = async (id: string) => {
    try {
      const sheets = await fetchTripSheetPrintData([id]);
      if (sheets && sheets.length > 0) {
        setPrintingSheets(sheets);
      } else {
        toast.error("Failed to load data for printing.");
      }
    } catch (e) {
      console.error("Error loading print data:", e);
      toast.error("Error loading print data.");
    }
  };

  const handleShowReport = async () => {
    try {
      const reportData = await fetchTripSheetReport(filters);

      if (reportData && reportData.length > 0) {
        setReportPrintingJobs(reportData as TripSheetEntry[]);
        toast.success(`Found ${reportData.length} items for the report.`);
      } else {
        toast.error("No data found for report based on current filters.");
      }
    } catch (e) {
      console.error("Report generation error:", e);
      toast.error("Error generating report.");
    }
  };

  const hasActiveFilters =
    !!filters.toPlace ||
    !!filters.consignor ||
    (filters.consignee && filters.consignee.length > 0) ||
    filters.filterType !== "all" ||
    !!filters.search;

  // Bulk button logic
  const bulkButtonText = isAllSelected ? "Clear Selection" : "Select All";
  const bulkButtonIcon = isAllSelected ? XCircle : PackageCheck;
  const handleBulkAction = isAllSelected ? handleCombinedBulkDeselect : handleCombinedBulkSelect;
  const bulkButtonVariant = isAllSelected ? "destructive" : "primary";
  const BulkIconComponent = bulkButtonIcon;

  const multipleSelected = finalCount > 0;

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
              placeholder="Search TS No, Place, Driver..."
              value={filters.search || ""}
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
              disabled={!selectAllMode && selectedMfNos.length === 0 && totalItems === 0}
              className="h-10"
            >
              <BulkIconComponent className="w-4 h-4" />
              {bulkButtonText}
            </Button>

            <Button
              variant="primary"
              onClick={() => navigate("/tripsheet/new")}
              className="h-10"
            >
              <Plus className="w-4 h-4" />
              Add New TS
            </Button>
          </div>
        </div>
        {/* Tablet & Mobile - Two Rows (below xl) */}
        <div className="flex xl:hidden flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Search TS No, Place, Driver..." value={filters.search || ""} onChange={handleSearchChange} className="w-full h-10 pl-10 pr-4 bg-secondary/50 text-foreground rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60 text-sm" />
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

            <Button variant={bulkButtonVariant} onClick={handleBulkAction} disabled={!selectAllMode && selectedMfNos.length === 0 && totalItems === 0} className="flex-1 h-9 text-xs sm:text-sm">
              <BulkIconComponent className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline ml-1">{isAllSelected ? "Clear" : "Select All"}</span>
              <span className="sm:hidden ml-1">{isAllSelected ? "Clear" : "All"}</span>
            </Button>

            <Button variant="primary" onClick={() => navigate("/tripsheet/new")} className="flex-1 h-9 text-xs sm:text-sm">
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline ml-1">Add TS</span>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <AsyncAutocomplete label="Destination" loadOptions={loadDestinationOptions} value={destinationOption} onChange={(val: any) => { setDestinationOption(val); setFilters({ toPlace: val?.value || "" }); }} placeholder="Search destination..." defaultOptions />
            <AsyncAutocomplete label="Consignor" loadOptions={loadConsignorOptions} value={consignorOption} onChange={(val: any) => { setConsignorOption(val); setFilters({ consignor: val?.value || "" }); }} placeholder="Search consignor..." defaultOptions />
            <AsyncAutocomplete label="Consignee (Multi-select)" loadOptions={loadConsigneeOptions} value={consigneeOptions} onChange={(val: any) => { const arr = Array.isArray(val) ? val : val ? [val] : []; setConsigneeOptions(arr); setFilters({ consignee: arr.map((v: any) => v.value) }); }} placeholder="Select consignees..." isMulti={true} defaultOptions closeMenuOnSelect={false} showAllSelected={true} />
          </div>

          <DateFilterButtons filterType={filters.filterType || "all"} setFilterType={handleFilterTypeChange} customStart={filters.customStart || ""} setCustomStart={(val) => handleCustomDateChange(val, filters.customEnd)} customEnd={filters.customEnd || ""} setCustomEnd={(val) => handleCustomDateChange(filters.customStart, val)} />
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
                <th className="px-4 py-3 text-left"><div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider"><Hash className="w-3.5 h-3.5" />TS No</div></th>
                <th className="px-4 py-3 text-left"><div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider"><MapPin className="w-3.5 h-3.5" />From</div></th>
                <th className="px-4 py-3 text-left"><div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider"><MapPin className="w-3.5 h-3.5" />To</div></th>
                <th className="px-4 py-3 text-left"><div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider"><Calendar className="w-3.5 h-3.5" />Date</div></th>
                <th className="px-4 py-3 text-left"><div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider"><IndianRupee className="w-3.5 h-3.5" />Amount</div></th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center"><div className="flex flex-col items-center gap-3"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /><span className="text-sm text-muted-foreground">Loading...</span></div></td></tr>
              ) : paginatedData.length > 0 ? (
                paginatedData.map((ts) => {
                  const isSelected = isRowSelected(ts.mfNo);
                  return (
                    <tr key={ts.id} className={`transition-colors hover:bg-muted/30 ${isSelected ? "bg-primary/5" : ""}`}>
                      <td className="px-4 py-3"><input type="checkbox" className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer" checked={isSelected} onChange={(e) => handleSelectRow(ts.mfNo, e.target.checked)} /></td>
                      <td className="px-4 py-3"><span className="font-semibold text-primary">{ts.mfNo}</span></td>
                      <td className="px-4 py-3"><span className="text-sm text-foreground">{ts.fromPlace}</span></td>
                      <td className="px-4 py-3"><span className="text-sm text-foreground">{ts.toPlace}</span></td>
                      <td className="px-4 py-3"><span className="text-sm text-foreground">{ts.tsDate}</span></td>
                      <td className="px-4 py-3"><span className="text-sm font-semibold text-emerald-600">₹{ts.totalAmount.toLocaleString("en-IN")}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => navigate('/tripsheet/edit/' + ts.mfNo)} className="p-1.5 rounded-md text-blue-600 hover:bg-blue-500/10 transition-colors" title="Edit"><FilePenLine className="w-4 h-4" /></button>
                          <button onClick={() => handlePrintSingle(ts.mfNo)} className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-500/10 transition-colors" title="Print"><Printer className="w-4 h-4" /></button>
                          <button onClick={() => onDelete(ts.mfNo)} className="p-1.5 rounded-md text-destructive hover:bg-destructive/10 transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={7} className="px-4 py-12 text-center"><div className="flex flex-col items-center gap-2"><Truck className="w-10 h-10 text-muted-foreground/30" /><p className="text-sm text-muted-foreground">No Trip Sheets found</p></div></td></tr>
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
                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">TS No</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">From / To</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date / Amount</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={5} className="px-3 py-12 text-center"><div className="flex flex-col items-center gap-3"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /><span className="text-sm text-muted-foreground">Loading...</span></div></td></tr>
              ) : paginatedData.length > 0 ? (
                paginatedData.map((ts) => {
                  const isSelected = isRowSelected(ts.mfNo);
                  return (
                    <tr key={ts.id} className={`transition-colors hover:bg-muted/30 ${isSelected ? "bg-primary/5" : ""}`}>
                      <td className="px-3 py-3"><input type="checkbox" className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer" checked={isSelected} onChange={(e) => handleSelectRow(ts.mfNo, e.target.checked)} /></td>
                      <td className="px-3 py-3"><span className="font-semibold text-primary">{ts.mfNo}</span></td>
                      <td className="px-3 py-3"><div className="text-sm"><span className="text-foreground block">{ts.fromPlace}</span><span className="text-muted-foreground text-xs">→ {ts.toPlace}</span></div></td>
                      <td className="px-3 py-3"><div className="text-sm"><span className="text-foreground block">{ts.tsDate}</span><span className="text-emerald-600 font-semibold text-xs">₹{ts.totalAmount.toLocaleString("en-IN")}</span></div></td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => navigate('/tripsheet/edit/' + ts.mfNo)} className="p-1.5 rounded-md text-blue-600 hover:bg-blue-500/10 transition-colors" title="Edit"><FilePenLine className="w-4 h-4" /></button>
                          <button onClick={() => handlePrintSingle(ts.mfNo)} className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-500/10 transition-colors" title="Print"><Printer className="w-4 h-4" /></button>
                          <button onClick={() => onDelete(ts.mfNo)} className="p-1.5 rounded-md text-destructive hover:bg-destructive/10 transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={5} className="px-3 py-12 text-center"><div className="flex flex-col items-center gap-2"><Truck className="w-10 h-10 text-muted-foreground/30" /><p className="text-sm text-muted-foreground">No Trip Sheets found</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards - below lg */}
        <div className="block lg:hidden divide-y divide-border">
          {loading ? (
            <div className="p-6 text-center"><div className="flex flex-col items-center gap-2"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /><span className="text-sm text-muted-foreground">Loading...</span></div></div>
          ) : paginatedData.length > 0 ? (
            paginatedData.map((ts) => {
              const isSelected = isRowSelected(ts.mfNo);
              return (
                <div key={ts.id} className={`p-4 transition-colors ${isSelected ? "bg-primary/5" : ""}`}>
                  <div className="flex gap-3">
                    <div className="pt-0.5 flex-shrink-0"><input type="checkbox" className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer" checked={isSelected} onChange={(e) => handleSelectRow(ts.mfNo, e.target.checked)} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5"><span className="font-bold text-primary">TS #{ts.mfNo}</span></div>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-600"><IndianRupee className="w-3 h-3" />{ts.totalAmount.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="space-y-1.5 text-sm mb-3">
                        <div className="flex items-center gap-2 text-foreground"><MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" /><span className="text-muted-foreground">From:</span><span className="truncate">{ts.fromPlace}</span></div>
                        <div className="flex items-center gap-2 text-foreground"><ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" /><span className="text-muted-foreground">To:</span><span className="truncate">{ts.toPlace}</span></div>
                        <div className="flex items-center gap-2 text-foreground"><Calendar className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" /><span className="text-muted-foreground">Date:</span><span>{ts.tsDate}</span></div>
                      </div>
                      <div className="flex items-center gap-2 pt-3 border-t border-border">
                        <button onClick={() => navigate('/tripsheet/edit/' + ts.mfNo)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-blue-600 bg-blue-500/10 hover:bg-blue-500/20 transition-colors"><FilePenLine className="w-3.5 h-3.5" />Edit</button>
                        <button onClick={() => handlePrintSingle(ts.mfNo)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors"><Printer className="w-3.5 h-3.5" />Print</button>
                        <button onClick={() => onDelete(ts.mfNo)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 transition-colors"><Trash2 className="w-3.5 h-3.5" />Delete</button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center"><div className="flex flex-col items-center gap-2"><Truck className="w-10 h-10 text-muted-foreground/30" /><p className="text-sm text-muted-foreground">No Trip Sheets found</p></div></div>
          )}
        </div>

        {/* Pagination */}
        <div className="border-t border-border p-4">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} itemsPerPage={itemsPerPage} onItemsPerPageChange={setItemsPerPage} totalItems={totalItems} />
        </div>
      </div>

      {/* Modals */}
      <ConfirmationDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Trip Sheet"
        description={deleteMessage}
      >
        <div className="mt-4">
          <label htmlFor="deleteReason" className="block text-sm font-medium text-muted-foreground mb-1">
            Reason for Delete
          </label>
          <textarea
            id="deleteReason"
            value={deleteReason}
            onChange={(e) => setDeleteReason(e.target.value)}
            className="w-full h-20 p-2 bg-secondary/50 text-foreground rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm resize-none"
            placeholder="Please enter reason for deletion..."
          />
        </div>
      </ConfirmationDialog>
      {printingSheets && <TripSheetPrintManager sheets={printingSheets} onClose={() => setPrintingSheets(null)} />}
      {reportPrintingJobs && <TripSheetReportPrint sheets={reportPrintingJobs} onClose={() => setReportPrintingJobs(null)} />}
    </div>
  );
};
