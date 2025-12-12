// TripSheetList.tsx
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
  RotateCcw,
  PackageCheck,
} from "lucide-react";
import { DateFilterButtons, getTodayDate, getYesterdayDate } from "../../components/shared/DateFilterButtons";
import { ConfirmationDialog } from "../../components/shared/ConfirmationDialog";
import { useData } from "../../hooks/useData";
import { Button } from "../../components/shared/Button";
import { AsyncAutocomplete } from "../../components/shared/AsyncAutocomplete";
import type { TripSheetEntry, ToPlace, Consignor, Consignee } from "../../types";
import { useServerPagination } from "../../hooks/useServerPagination";
import { Pagination } from "../../components/shared/Pagination";
import { TripSheetPrintManager } from "./TripSheetPrintManager";
import { TripSheetReportPrint } from "./TripSheetReportView";
import { useToast } from "../../contexts/ToastContext";

type TripSheetFilter = {
  search?: string;
  filterType?: string;
  startDate?: string;
  endDate?: string;
  customStart?: string;
  customEnd?: string;
  toPlace?: string;
  consignor?: string;
  consignee?: string[];
  excludeIds?: string[];
};

type ExclusionFilterState = {
  isActive: boolean;
  filterKey?: string;
};

// Snapshot state for bulk selection
type SelectAllSnapshot = {
  active: boolean;
  total: number;
  filters: TripSheetFilter; // Use proper type instead of any
};

export const TripSheetList = () => {
  const navigate = useNavigate();
  const {
    deleteTripSheet,
    fetchTripSheetPrintData,
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
  const [exclusionFilter, setExclusionFilter] = useState<ExclusionFilterState>({
    isActive: false,
    filterKey: ""
  });

  const [printingSheets, setPrintingSheets] = useState<TripSheetEntry[] | null>(null);
  const [reportPrintingJobs, setReportPrintingJobs] = useState<TripSheetEntry[] | null>(null);
  const [delId, setDelId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState("");

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
  const createCompleteFilters = (sourceFilters: TripSheetFilter): TripSheetFilter => {
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

    console.log("=== SELECT ALL DEBUG ===");
    console.log("Total items to select:", totalItems);
    console.log("Current filters:", filters);
    console.log("Complete filters for snapshot:", completeFilters);

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

  // Exclude Filtered Data
  const handleExcludeFilteredData = async () => {
    const visibleMfNos = paginatedData.map((ts) => ts.mfNo);

    if (visibleMfNos.length === 0 && finalCount === 0) {
      return;
    }

    // CASE 1: Manual Selection Mode
    if (!selectAllMode || !selectAllSnapshot.active) {
      const selectedVisible = visibleMfNos.filter((id) => selectedMfNos.includes(id));

      if (selectedVisible.length === 0) {
        return;
      }

      setSelectedMfNos((prev) => prev.filter((id) => !selectedVisible.includes(id)));
      setExcludedMfNos((prev) => Array.from(new Set([...prev, ...selectedVisible])));
      setExclusionFilter({ isActive: true, filterKey: "Manual Selection" });
      toast.success(`Excluded ${selectedVisible.length} items from bulk selection.`);
      return;
    }

    // CASE 2: Select-All Mode - Exclude ALL matching current filters
    try {
      const allMatching = await fetchTripSheetPrintData([], true, {
        ...createCompleteFilters(filters),
        page: 1,
        perPage: 0,
      });

      if (!allMatching || allMatching.length === 0) {
        return;
      }

      const idsToExclude = allMatching.map((ts: any) => ts.mfNo);

      setExcludedMfNos(prev =>
        Array.from(new Set([...prev, ...idsToExclude]))
      );

      let filterKey: string | undefined;
      if (filters.consignor) filterKey = "Consignor";
      else if (filters.toPlace) filterKey = "Destination";
      else if (filters.consignee && filters.consignee.length > 0) filterKey = "Consignee";

      setExclusionFilter({
        isActive: true,
        filterKey
      });
      toast.success(`Excluded ${idsToExclude.length} items from bulk selection.`);

    } catch (e) {
      console.error("Exclude failed during bulk fetch:", e);
    }
  };

  const onDelete = (mfNo: string) => {
    setDelId(mfNo);
    setDeleteMessage(`Are you sure you want to delete Trip Sheet #${mfNo}?`);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!delId) return;
    setConfirmOpen(false);
    try {
      await deleteTripSheet(delId);
      toast.success(`Trip Sheet #${delId} deleted successfully.`);
      refresh();
      setSelectedMfNos((prev) => prev.filter((id) => id !== delId));
      setExcludedMfNos((prev) => prev.filter((id) => id !== delId));
    } catch (error) {
      console.error("Deletion failed:", error);
      toast.error(`Failed to delete Trip Sheet #${delId}.`);
    } finally {
      setDelId(null);
    }
  };

  // Bulk Print Handler with comprehensive debug logging
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

        // DEBUG: Log what we're sending
        console.log("=== PRINT DEBUG ===");
        console.log("Mode: Select All (Bulk)");
        console.log("Snapshot active:", selectAllSnapshot.active);
        console.log("Snapshot total:", selectAllSnapshot.total);
        console.log("Snapshot filters:", JSON.stringify(selectAllSnapshot.filters, null, 2));
        console.log("Excluded MF Nos:", excludedMfNos);
        console.log("Excluded count:", excludedMfNos.length);
        console.log("Final filters being sent:", JSON.stringify(filtersForPrint, null, 2));
        console.log("Expected count:", finalCount);

        sheets = await fetchTripSheetPrintData([], true, filtersForPrint);

        console.log("API Response - Sheets returned:", sheets?.length);
        console.log("Sheets data:", sheets);
      } else {
        // Manual mode: use explicitly selected IDs
        console.log("=== PRINT DEBUG ===");
        console.log("Mode: Manual Selection");
        console.log("Selected MF Nos:", selectedMfNos);
        console.log("Selected count:", selectedMfNos.length);

        sheets = await fetchTripSheetPrintData(selectedMfNos);

        console.log("API Response - Sheets returned:", sheets?.length);
        console.log("Sheets data:", sheets);
      }

      if (sheets && sheets.length > 0) {
        setPrintingSheets(sheets);

        

        toast.success(`Prepared ${sheets.length} print job(s).`);
      } else {
        console.error("No sheets returned from API");
        console.error("This could mean:");
        console.error("1. Backend returned empty array");
        console.error("2. Filters don't match any records");
        console.error("3. All records are excluded");
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

  const responsiveBtnClass = "w-full md:w-auto text-[10px] xs:text-xs sm:text-sm h-8 sm:h-10 mb-1 px-1 sm:px-4 whitespace-nowrap";

  return (
    <div className="space-y-6">
      {/* Top Control Bar */}
      <div className="flex flex-col md:flex-row gap-2 sm:gap-4 items-center justify-between bg-background p-4 rounded-lg shadow border border-muted">
        {/* LEFT */}
        <div className="flex items-center gap-2 w-full md:w-1/2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search TS No, Place, Driver..."
              value={filters.search || ""}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 bg-background text-foreground border border-muted-foreground/30 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          </div>

          <Button variant={hasActiveFilters ? "primary" : "outline"} onClick={() => setShowFilters(!showFilters)} className="h-10 px-3 shrink-0" title="Toggle Filters">
            <Filter size={18} className={hasActiveFilters ? "mr-2" : ""} />
            {hasActiveFilters && "Active"}
          </Button>
        </div>

        {/* RIGHT: Actions */}
        <div className="w-full md:w-auto mt-2 md:mt-0 grid grid-cols-2 gap-2 md:flex md:flex-row md:gap-2 md:justify-stretch">
          <Button variant="secondary" onClick={handleShowReport} className={responsiveBtnClass}>
            <FileText size={14} className="mr-1 sm:mr-2" /> Report
          </Button>

          <Button variant="secondary" onClick={handlePrintSelected} disabled={finalCount === 0} className={responsiveBtnClass}>
            <Printer size={14} className="mr-1 sm:mr-2" /> {printButtonText}
          </Button>

          <Button variant={bulkButtonVariant} onClick={handleBulkAction} className={responsiveBtnClass} disabled={!selectAllMode && selectedMfNos.length === 0 && totalItems === 0} title={bulkButtonText === "Clear Selection" ? "Click to remove all items from selection" : "Select all filtered items"}>
            <BulkIconComponent size={14} className="mr-1 sm:mr-2" />
            {bulkButtonText}
          </Button>

          <Button variant="primary" onClick={() => navigate("/tripsheet/new")} className={responsiveBtnClass}>
            + Add New
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="p-4 bg-muted/20 rounded-lg border border-muted animate-in fade-in slide-in-from-top-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Advanced Filters</h3>
            <div className="flex gap-4">
              {multipleSelected && (
                <button onClick={handleExcludeFilteredData} className="text-xs flex items-center text-destructive hover:text-destructive/80 font-medium" disabled={paginatedData.length === 0} title="Exclude all visible items from the current bulk selection">
                  <XCircle size={14} className="mr-1 sm:mr-2" /> Exclude
                </button>
              )}
              <button onClick={clearAllFilters} className="text-xs flex items-center text-primary hover:text-primary/80 font-medium"><RotateCcw size={14} className="mr-1" /> Clear All</button>
            </div>
          </div>

          {/* {excludedMfNos.length > 0 && (
            <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 border border-yellow-300 rounded text-sm">
              <strong>Exclusion Active:</strong> {excludedMfNos.length} Trip Sheets are currently excluded from the selection {selectAllSnapshot.active && exclusionFilter.filterKey && (<>(e.g., those matching <strong>{exclusionFilter.filterKey}: {consignorOption?.label || destinationOption?.label || (consigneeOptions[0]?.label as string) || "Filter Value"}</strong>).</>)}
            </div>
          )}  */}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <AsyncAutocomplete label="Filter by Destination" loadOptions={loadDestinationOptions} value={destinationOption} onChange={(val: any) => { setDestinationOption(val); setFilters({ toPlace: val?.value || "" }); }} placeholder="Select destination..." defaultOptions />
            <AsyncAutocomplete label="Filter by Consignor" loadOptions={loadConsignorOptions} value={consignorOption} onChange={(val: any) => { setConsignorOption(val); setFilters({ consignor: val?.value || "" }); }} placeholder="Select consignor..." defaultOptions />
            <div>
              <AsyncAutocomplete label="Filter by Consignee (Multi-select)" loadOptions={loadConsigneeOptions} value={consigneeOptions} onChange={(val: any) => { const arr = Array.isArray(val) ? val : val ? [val] : []; setConsigneeOptions(arr); const ids = arr.map((v: any) => v.value); setFilters({ consignee: ids }); }} placeholder="Select consignees..." isMulti={true} defaultOptions />
            </div>
          </div>

          <DateFilterButtons filterType={filters.filterType || "all"} setFilterType={handleFilterTypeChange} customStart={filters.customStart || ""} setCustomStart={(val) => handleCustomDateChange(val, filters.customEnd)} customEnd={filters.customEnd || ""} setCustomEnd={(val) => handleCustomDateChange(filters.customStart, val)} />
        </div>
      )}

      {/* Data Table */}
      <div className="bg-background rounded-lg shadow border border-muted overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-muted">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left w-12" title="Select/Deselect all visible items">
                  <input type="checkbox" className="h-4 w-4 accent-primary border-muted-foreground/30 rounded focus:ring-primary" checked={isAllVisibleSelected} ref={(el) => { if (el) el.indeterminate = isIndeterminate; }} onChange={handleSelectAllVisible} />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">TS No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">From</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted">
              {loading ? (<tr><td colSpan={7} className="px-6 py-12 text-center">Loading data...</td></tr>) : paginatedData.length > 0 ? (paginatedData.map((ts) => {
                const isSelected = isRowSelected(ts.mfNo);
                return (
                  <tr key={ts.id}>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <input type="checkbox" className="h-4 w-4 accent-primary" checked={isSelected} onChange={(e) => handleSelectRow(ts.mfNo, e.target.checked)} />
                    </td>
                    <td className="px-6 py-4 font-semibold text-primary">{ts.mfNo}</td>
                    <td className="px-6 py-4 text-sm">{ts.fromPlace}</td>
                    <td className="px-6 py-4 text-sm">{ts.toPlace}</td>
                    <td className="px-6 py-4 text-sm">{ts.tsDate}</td>
                    <td className="px-6 py-4 text-sm">₹{ts.totalAmount.toLocaleString("en-IN")}</td>
                    <td className="px-6 py-4 space-x-3">
                      <button onClick={() => navigate(`/tripsheet/edit/${ts.mfNo}`)} className="text-blue-600 hover:text-blue-800" title="Edit Trip Sheet"><FilePenLine size={18} /></button>
                      <button onClick={() => handlePrintSingle(ts.mfNo)} className="text-green-600 hover:text-green-800" title="Print Trip Sheet"><Printer size={18} /></button>
                      <button onClick={() => onDelete(ts.mfNo)} className="text-destructive hover:text-destructive/80" title="Delete Trip Sheet"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                );
              })) : (<tr><td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">No Trip Sheets found.</td></tr>)}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="block md:hidden divide-y divide-muted">
          {paginatedData.map((ts) => {
            const isSelected = isRowSelected(ts.mfNo);
            return (
              <div key={ts.id} className={`p-4 hover:bg-muted/10 transition-colors border-b border-muted last:border-0 ${isSelected ? "" : ""}`}>
                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <div className="pt-1">
                      <input type="checkbox" className="h-5 w-5 accent-primary" checked={isSelected} onChange={(e) => handleSelectRow(ts.mfNo, e.target.checked)} />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="font-bold text-blue-600 text-lg leading-tight mb-2">TS #{ts.mfNo}</div>
                      <div className="text-sm text-muted-foreground space-y-0.5">
                        <div><span className="font-medium text-foreground">Date:</span> {ts.tsDate}</div>
                        <div><span className="font-medium text-foreground">From:</span> {ts.fromPlace}</div>
                        <div><span className="font-medium text-foreground">To:</span> {ts.toPlace}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 pl-2">
                    <button onClick={() => navigate(`/tripsheet/edit/${ts.mfNo}`)} className="text-blue-600 p-1 hover:bg-blue-50 rounded" title="Edit"><FilePenLine size={20} /></button>
                    <button onClick={() => handlePrintSingle(ts.mfNo)} className="text-green-600 p-1 hover:bg-green-50 rounded" title="Print"><Printer size={20} /></button>
                    <button onClick={() => onDelete(ts.mfNo)} className="text-destructive p-1 hover:bg-red-50 rounded" title="Delete"><Trash2 size={20} /></button>
                  </div>
                </div>
                <div className="mt-3 pt-2 text-sm font-medium text-foreground border-t border-dashed border-muted">Amount: <span className="font-bold">₹{ts.totalAmount.toLocaleString("en-IN")}</span></div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-muted p-4">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} itemsPerPage={itemsPerPage} onItemsPerPageChange={setItemsPerPage} totalItems={totalItems} />
        </div>
      </div>

      <ConfirmationDialog open={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={confirmDelete} title="Delete Trip Sheet" description={deleteMessage} />

      {printingSheets && <TripSheetPrintManager sheets={printingSheets} onClose={() => setPrintingSheets(null)} />}
      {reportPrintingJobs && <TripSheetReportPrint sheets={reportPrintingJobs} onClose={() => setReportPrintingJobs(null)} />}
    </div>
  );
};
