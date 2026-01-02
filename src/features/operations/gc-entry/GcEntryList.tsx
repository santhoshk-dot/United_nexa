import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FilePenLine,
  Trash2,
  Search,
  Printer,
  Filter,
  FilterX,
  XCircle,
  PackageCheck,
  Plus,
  ChevronRight,
  Package,
  MapPin,
  User,
  Hash,
  Truck,
  ChevronUp,
} from "lucide-react";
import {
  DateFilterButtons,
  getTodayDate,
  getYesterdayDate,
} from "../../../components/shared/DateFilterButtons";
import { ConfirmationDialog } from "../../../components/shared/ConfirmationDialog";
import { useData } from "../../../hooks/useData";
import { useServerPagination } from "../../../hooks/useServerPagination";
import { Button } from "../../../components/shared/Button";
import { AsyncAutocomplete } from "../../../components/shared/AsyncAutocomplete";
import { GcPrintManager, type GcPrintJob } from "./GcPrintManager";
import { Pagination } from "../../../components/shared/Pagination";
import type { GcEntry, Consignor, Consignee, GcFilter, ExclusionFilterState, SelectAllSnapshot } from "../../../types";
import { useToast } from "../../../contexts/ToastContext";
import { deleteSchema } from "../../../schemas";


export const GcEntryList = () => {
  const navigate = useNavigate();
  const {
    deleteGcEntry,
    fetchGcPrintData,
    fetchFilteredGcIds, // 🟢 NEW: Add this
    searchConsignors,
    searchConsignees,
    searchToPlaces,
  } = useData();

  const toast = useToast();

  // ---------------------------------------------------------------------------
  // Server pagination
  // ---------------------------------------------------------------------------
  const {
    data: paginatedData,
    loading,
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    setItemsPerPage,
    setCurrentPage,
    setFilters,
    filters,
    refresh,
  } = useServerPagination<GcEntry>({
    endpoint: "/operations/gc",
    skipLoader: true,
    initialItemsPerPage: 10,
    initialFilters: {
      search: "",
      filterType: "all",
      startDate: "",
      endDate: "",
      customStart: "",
      customEnd: "",
      destination: "",
      consignor: "",
      consignee: []
    } as GcFilter,
  });

  // ---------------------------------------------------------------------------
  // UI state
  // ---------------------------------------------------------------------------
  const [showFilters, setShowFilters] = useState(false);
  const [destinationOption, setDestinationOption] = useState<any>(null);
  const [consignorOption, setConsignorOption] = useState<any>(null);
  const [consigneeOptions, setConsigneeOptions] = useState<any[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});


  // ---------------------------------------------------------------------------
  // Selection state
  // ---------------------------------------------------------------------------
  const [selectedGcNos, setSelectedGcNos] = useState<string[]>([]);
  const [selectAllMode, setSelectAllMode] = useState(false);
  const [excludedGcNos, setExcludedGcNos] = useState<string[]>([]);
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
      destination: "",
      consignor: "",
      consignee: []
    },
  });

  const [, setExclusionFilter] = useState<ExclusionFilterState>({
    isActive: false,
    filterKey: "",
  });

  // ---------------------------------------------------------------------------
  // Modal / print state
  // ---------------------------------------------------------------------------
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteMessage, setDeleteMessage] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [printingJobs, setPrintingJobs] = useState<GcPrintJob[] | null>(null);

  // ---------------------------------------------------------------------------
  // Helper: Create complete filter object
  // ---------------------------------------------------------------------------
  const createCompleteFilters = (sourceFilters: Partial<GcFilter>): GcFilter => {
    return {
      search: sourceFilters.search || "",
      filterType: sourceFilters.filterType || "all",
      startDate: sourceFilters.startDate || "",
      endDate: sourceFilters.endDate || "",
      customStart: sourceFilters.customStart || "",
      customEnd: sourceFilters.customEnd || "",
      destination: sourceFilters.destination || "",
      consignor: sourceFilters.consignor || "",
      consignee: sourceFilters.consignee || [],
    };
  };

  // ---------------------------------------------------------------------------
  // Async loaders
  // ---------------------------------------------------------------------------
  const loadDestinationOptions = useCallback(
    async (search: string, _prevOptions: any, { page }: any) => {
      const result = await searchToPlaces(search, page);
      return {
        options: result.data.map((p: any) => ({
          value: p.placeName,
          label: p.placeName,
        })),
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
        options: result.data.map((c: any) => ({
          value: c.id,
          label: c.name,
        })),
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
        options: result.data.map((c: any) => ({
          value: c.id,
          label: c.name,
        })),
        hasMore: result.hasMore,
        additional: { page: page + 1 },
      };
    },
    [searchConsignees]
  );

  // ---------------------------------------------------------------------------
  // Filters
  // ---------------------------------------------------------------------------
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
      customEnd: "",
    });
  };

  const handleCustomDateChange = (start: string, end: string) => {
    setFilters({
      filterType: "custom",
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
      search: "",
      filterType: "all",
      startDate: "",
      endDate: "",
      destination: "",
      consignor: "",
      consignee: [],
    });

    // clear selection + exclusion/snapshot state
    setSelectAllMode(false);
    setSelectedGcNos([]);
    setExcludedGcNos([]);
    setExclusionFilter({ isActive: false, filterKey: "" });
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
    filters.filterType !== "all" ||
    !!filters.search;

  // ---------------------------------------------------------------------------
  // Selection helpers
  // ---------------------------------------------------------------------------
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

  const printButtonText = `Print (${finalCount})`;

  const isAllSelected = selectAllMode && selectAllSnapshot.active
    ? excludedGcNos.length === 0
    : (totalItems > 0 && selectedGcNos.length === totalItems);

  const multipleSelected = finalCount > 0;

  const bulkButtonText = isAllSelected ? "Clear Selection" : "Select All";
  const bulkButtonIcon = isAllSelected ? XCircle : PackageCheck;
  const bulkButtonVariant = isAllSelected ? "destructive" : "primary";
  const BulkIconComponent = bulkButtonIcon;

  // ---------------------------------------------------------------------------
  // Selection handlers
  // ---------------------------------------------------------------------------
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

  const handleSelectRow = (gcNo: string, checked: boolean) => {
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

  const handleCombinedBulkDeselect = () => {
    setSelectAllMode(false);
    setExcludedGcNos([]);
    setSelectedGcNos([]);
    setExclusionFilter({ isActive: false, filterKey: "" });
    setSelectAllSnapshot({
      active: false,
      total: 0,
      filters: createCompleteFilters({})
    });
  };

  const handleCombinedBulkSelect = () => {
    if (totalItems === 0) {
      toast.error("No items found to select based on current filters.");
      return;
    }

    const completeFilters = createCompleteFilters(filters);

    setSelectAllMode(true);
    setExcludedGcNos([]);
    setSelectedGcNos([]);
    setExclusionFilter({ isActive: false, filterKey: "" });
    setSelectAllSnapshot({
      active: true,
      total: totalItems,
      filters: completeFilters,
    });
  };

  // ---------------------------------------------------------------------------
// 🟢 UPDATED: Exclude logic - Always exclude ALL filtered items when filters active
// ---------------------------------------------------------------------------
const handleExcludeFilteredData = async () => {
  // Check if any filters are active
  const hasFiltersActive =
    !!filters.destination ||
    !!filters.consignor ||
    (filters.consignee && filters.consignee.length > 0) ||
    filters.filterType !== "all" ||
    !!filters.search;

  // If filters are active - ALWAYS fetch ALL matching IDs from API and exclude them
  if (hasFiltersActive) {
    try {
      const currentFilters = createCompleteFilters(filters);
      const gcNos = await fetchFilteredGcIds(currentFilters);

      if (!gcNos || gcNos.length === 0) {
        toast.error("No items found to exclude for current filters.");
        return;
      }

      // Remove from manual selection if any were selected
      setSelectedGcNos(prev => prev.filter(id => !gcNos.includes(id)));
      setExcludedGcNos(prev => Array.from(new Set([...prev, ...gcNos])));
      setExclusionFilter({ isActive: true, filterKey: "Filter" });
      toast.success(`Excluded ${gcNos.length} filtered items.`);
    } catch (err) {
      console.error("Exclude filtered failed:", err);
      toast.error("Failed to exclude filtered records.");
    }
    return;
  }

  // No filters active - exclude based on selection mode
  if (selectAllMode && selectAllSnapshot.active) {
    // Select-All mode without filters - exclude visible page items
    const visibleGcNos = paginatedData.map((gc) => gc.gcNo);

    if (visibleGcNos.length === 0) {
      toast.error("No visible items to exclude.");
      return;
    }

    setExcludedGcNos(prev => Array.from(new Set([...prev, ...visibleGcNos])));
    toast.success(`Excluded ${visibleGcNos.length} visible items.`);
  } else {
    // Manual selection mode without filters - exclude selected items
    const selectedVisible = paginatedData
      .map(gc => gc.gcNo)
      .filter(id => selectedGcNos.includes(id));

    if (selectedVisible.length === 0) {
      toast.error("Select at least one GC to exclude.");
      return;
    }

    setExcludedGcNos(prev => Array.from(new Set([...prev, ...selectedVisible])));
    setSelectedGcNos(prev => prev.filter(id => !selectedVisible.includes(id)));
    setExclusionFilter({ isActive: true, filterKey: "Manual Selection" });
    toast.success(`Excluded ${selectedVisible.length} items.`);
  }
};

  // ---------------------------------------------------------------------------
  // Print handlers
  // ---------------------------------------------------------------------------
  const handlePrintSelected = async () => {
    if (finalCount === 0) {
      toast.error("No GC entries selected for printing.");
      return;
    }

    try {
      let printData: any[] = [];

      if (selectAllMode && selectAllSnapshot.active) {
        const filtersForPrint: GcFilter = {
          ...selectAllSnapshot.filters,
          excludeIds: excludedGcNos.length > 0 ? excludedGcNos : undefined,
        } as any;

        printData = await fetchGcPrintData([], true, filtersForPrint);
      } else {
        printData = await fetchGcPrintData(selectedGcNos);
      }

      const jobs: GcPrintJob[] = printData
        .map((item: any): GcPrintJob | null => {
          const { consignor, consignee, ...gcData } = item;
          if (!gcData || !consignor || !consignee) return null;
          return {
            gc: gcData as GcEntry,
            consignor: consignor as Consignor,
            consignee: consignee as Consignee,
          };
        })
        .filter((job): job is GcPrintJob => job !== null);

      if (jobs.length > 0) {
        setPrintingJobs(jobs);
        toast.success(`Prepared ${jobs.length} print job(s).`);
      } else {
        toast.error("Failed to prepare print jobs. No GCs matched criteria.");
      }
    } catch (error) {
      console.error("Bulk print error:", error);
      toast.error("An error occurred while preparing print jobs.");
    }
  };

  const handlePrintSingle = async (gcNo: string) => {
    try {
      const printData = await fetchGcPrintData([gcNo]);
      if (printData && printData.length > 0) {
        const item = printData[0];
        const { consignor, consignee, ...gcData } = item;
        setPrintingJobs([
          {
            gc: gcData as GcEntry,
            consignor: consignor as Consignor,
            consignee: consignee as Consignee,
          },
        ]);
      } else {
        toast.error("Failed to fetch GC details for printing.");
      }
    } catch (error) {
      console.error("Print error:", error);
      toast.error("An error occurred while fetching print data.");
    }
  };

  // ---------------------------------------------------------------------------
  // CRUD handlers
  // ---------------------------------------------------------------------------
  const handleEdit = (gcNo: string) => navigate(`/gc-entry/edit/${gcNo}`);

  const handleDelete = (gcNo: string) => {
    const gc = paginatedData.find((g) => g.gcNo === gcNo);
    const tripSheetId = gc?.tripSheetId;
    const message = tripSheetId && tripSheetId !== "" ? `Deleting this GC will also remove it from Trip Sheet. Are you sure you want to delete GC #${gcNo}?` : `Are you sure you want to delete GC #${gcNo}?`;
    setDeletingId(gcNo);
    setDeleteMessage(message);
    setDeleteReason("");
    setFormErrors({});
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    setFormErrors({});
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
      setSelectedGcNos((prev) => prev.filter((id) => id !== deletingId));
      setExcludedGcNos((prev) => prev.filter((id) => id !== deletingId));

      setIsConfirmOpen(false);
      setDeletingId(null);
      setDeleteReason("");
    }
  };


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
              placeholder="Search GC entries..."
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
              disabled={!selectAllMode && selectedGcNos.length === 0 && totalItems === 0}
              className="h-10"
            >
              <BulkIconComponent className="w-4 h-4" />
              {bulkButtonText}
            </Button>

            <Button
              variant="primary"
              onClick={() => navigate("/gc-entry/new")}
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
              <input
                type="text"
                placeholder="Search GC entries..."
                value={filters.search || ""}
                onChange={handleSearchChange}
                className="w-full h-10 pl-10 pr-4 bg-secondary/50 text-foreground rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60 text-sm"
              />
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

            <Button variant={bulkButtonVariant} onClick={isAllSelected ? handleCombinedBulkDeselect : handleCombinedBulkSelect} disabled={!selectAllMode && selectedGcNos.length === 0 && totalItems === 0} className="flex-1 h-9 text-xs sm:text-sm">
              <BulkIconComponent className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline ml-1">{isAllSelected ? "Clear" : "Select All"}</span>
              <span className="sm:hidden ml-1">{isAllSelected ? "Clear" : "All"}</span>
            </Button>

            <Button variant="primary" onClick={() => navigate("/gc-entry/new")} className="flex-1 h-9 text-xs sm:text-sm">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <AsyncAutocomplete label="Destination" placeholder="Search destination..." value={destinationOption} onChange={(val) => { setDestinationOption(val); setFilters({ destination: (val as any)?.value || "" }); }} loadOptions={loadDestinationOptions} defaultOptions />
            <AsyncAutocomplete label="Consignor" placeholder="Search consignor..." value={consignorOption} onChange={(val) => { setConsignorOption(val); setFilters({ consignor: (val as any)?.value || "" }); }} loadOptions={loadConsignorOptions} defaultOptions />
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
                <th className="px-4 py-3 text-left"><div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider"><Hash className="w-3.5 h-3.5" />GC No</div></th>
                <th className="px-4 py-3 text-left"><div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider"><User className="w-3.5 h-3.5" />Consignor</div></th>
                <th className="px-4 py-3 text-left"><div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider"><User className="w-3.5 h-3.5" />Consignee</div></th>
                <th className="px-4 py-3 text-left"><div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider"><MapPin className="w-3.5 h-3.5" />Destination</div></th>
                <th className="px-4 py-3 text-left"><div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider"><Package className="w-3.5 h-3.5" />Qty</div></th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center"><div className="flex flex-col items-center gap-3"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /><span className="text-sm text-muted-foreground">Loading...</span></div></td></tr>
              ) : paginatedData.length > 0 ? (
                paginatedData.map((gc) => {
                  const consignorName = (gc as any).consignorName || "N/A";
                  const consigneeName = (gc as any).consigneeName || "N/A";
                  const tripSheetId = gc.tripSheetId;
                  const isAssigned = tripSheetId && tripSheetId !== "";
                  const isSelected = isRowSelected(gc.gcNo);

                  return (
                    <tr key={gc.id} className={`transition-colors hover:bg-muted/30 ${isSelected ? "bg-primary/5" : ""}`}>
                      <td className="px-4 py-3"><input type="checkbox" className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer" checked={isSelected} onChange={(e) => handleSelectRow(gc.gcNo, e.target.checked)} /></td>
                      <td className="px-4 py-3"><span className="font-semibold text-primary">{gc.gcNo}</span></td>
                      <td className="px-4 py-3"><span className="text-sm text-foreground">{consignorName}</span></td>
                      <td className="px-4 py-3"><span className="text-sm text-foreground">{consigneeName}</span></td>
                      <td className="px-4 py-3"><span className="text-sm text-foreground">{gc.destination}</span></td>
                      <td className="px-4 py-3"><span className="text-sm text-foreground">{gc.totalQty}</span></td>
                      <td className="px-4 py-3">
                        {isAssigned ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-600"><Truck className="w-3 h-3" />TS #{tripSheetId}</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground">Pending</span>
                        )}
                      </td>
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
                <tr><td colSpan={8} className="px-4 py-12 text-center"><div className="flex flex-col items-center gap-2"><Package className="w-10 h-10 text-muted-foreground/30" /><p className="text-sm text-muted-foreground">No GC Entries found</p></div></td></tr>
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
                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Dest / Qty</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={6} className="px-3 py-12 text-center"><div className="flex flex-col items-center gap-3"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /><span className="text-sm text-muted-foreground">Loading...</span></div></td></tr>
              ) : paginatedData.length > 0 ? (
                paginatedData.map((gc) => {
                  const consignorName = (gc as any).consignorName || "N/A";
                  const consigneeName = (gc as any).consigneeName || "N/A";
                  const tripSheetId = gc.tripSheetId;
                  const isAssigned = tripSheetId && tripSheetId !== "";
                  const isSelected = isRowSelected(gc.gcNo);

                  return (
                    <tr key={gc.id} className={`transition-colors hover:bg-muted/30 ${isSelected ? "bg-primary/5" : ""}`}>
                      <td className="px-3 py-3"><input type="checkbox" className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer" checked={isSelected} onChange={(e) => handleSelectRow(gc.gcNo, e.target.checked)} /></td>
                      <td className="px-3 py-3"><span className="font-semibold text-primary">{gc.gcNo}</span></td>
                      <td className="px-3 py-3"><div className="text-sm"><span className="text-foreground block">{consignorName}</span><span className="text-muted-foreground text-xs">→ {consigneeName}</span></div></td>
                      <td className="px-3 py-3"><div className="text-sm"><span className="text-foreground block">{gc.destination}</span><span className="text-muted-foreground text-xs">Qty: {gc.totalQty}</span></div></td>
                      <td className="px-3 py-3">
                        {isAssigned ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-600"><Truck className="w-3 h-3" />{tripSheetId}</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground">Pending</span>
                        )}
                      </td>
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
                <tr><td colSpan={6} className="px-3 py-12 text-center"><div className="flex flex-col items-center gap-2"><Package className="w-10 h-10 text-muted-foreground/30" /><p className="text-sm text-muted-foreground">No GC Entries found</p></div></td></tr>
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
              const consignorName = (gc as any).consignorName || "N/A";
              const consigneeName = (gc as any).consigneeName || "N/A";
              const tripSheetId = gc.tripSheetId;
              const isAssigned = tripSheetId && tripSheetId !== "";
              const isSelected = isRowSelected(gc.gcNo);

              return (
                <div key={gc.id} className={`p-4 transition-colors ${isSelected ? "bg-primary/5" : ""}`}>
                  <div className="flex gap-3">
                    <div className="pt-0.5 flex-shrink-0"><input type="checkbox" className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer" checked={isSelected} onChange={(e) => handleSelectRow(gc.gcNo, e.target.checked)} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5"><span className="font-bold text-primary">GC #{gc.gcNo}</span></div>
                        {isAssigned ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-600"><Truck className="w-3 h-3" />TS #{tripSheetId}</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">Pending</span>
                        )}
                      </div>
                      <div className="space-y-1.5 text-sm mb-3">
                        <div className="flex items-center gap-2 text-foreground"><User className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" /><span className="text-muted-foreground">From:</span><span className="truncate">{consignorName}</span></div>
                        <div className="flex items-center gap-2 text-foreground"><ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" /><span className="text-muted-foreground">To:</span><span className="truncate">{consigneeName}</span></div>
                        {/* Modified Destination and Qty Row */}
                        <div className="flex items-center justify-between gap-2 mt-1">
                          <div className="flex items-center gap-2 text-foreground min-w-0">
                            <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                            <span className="truncate">{gc.destination}</span>
                          </div>
                          <div className="flex items-center gap-2 text-foreground flex-shrink-0 bg-secondary/50 px-2 py-1 rounded text-xs font-medium">
                            <Package className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                            <span>Qty: {gc.totalQty}</span>
                          </div>
                        </div>
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
            <div className="p-8 text-center"><div className="flex flex-col items-center gap-2"><Package className="w-10 h-10 text-muted-foreground/30" /><p className="text-sm text-muted-foreground">No GC Entries found</p></div></div>
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
        title="Delete GC"
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
      {printingJobs && <GcPrintManager jobs={printingJobs} onClose={() => setPrintingJobs(null)} />}
    </div>
  );
};
