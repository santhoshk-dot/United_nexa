import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FilePenLine, Trash2, Search, Printer, Filter, XCircle, RotateCcw } from 'lucide-react';
import { DateFilterButtons, getTodayDate, getYesterdayDate } from '../../components/shared/DateFilterButtons';
import { ConfirmationDialog } from '../../components/shared/ConfirmationDialog';
import { useData } from '../../hooks/useData';
import { useServerPagination } from '../../hooks/useServerPagination';
import { Button } from '../../components/shared/Button';
import { AsyncAutocomplete } from '../../components/shared/AsyncAutocomplete';
import { GcPrintManager, type GcPrintJob } from './GcPrintManager';
import { Pagination } from '../../components/shared/Pagination';
import type { GcEntry, Consignor, Consignee } from '../../types';
import { useToast } from '../../contexts/ToastContext';

export const GcEntryList = () => {
  const navigate = useNavigate();
  const {
    deleteGcEntry,
    fetchGcPrintData,
    searchConsignors,
    searchConsignees,
    searchToPlaces
  } = useData();

  const toast = useToast();

  // Server-side pagination with API fetching
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
    refresh
  } = useServerPagination<GcEntry>({
    endpoint: '/operations/gc',
    initialItemsPerPage: 10,
    initialFilters: { search: '', filterType: 'all' }
  });

  const [showFilters, setShowFilters] = useState(false);

  const [destinationOption, setDestinationOption] = useState<any>(null);
  const [consignorOption, setConsignorOption] = useState<any>(null);
  const [consigneeOptions, setConsigneeOptions] = useState<any[]>([]);

  const [selectedGcIds, setSelectedGcIds] = useState<string[]>([]);
  const [selectAllMode, setSelectAllMode] = useState(false);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteMessage, setDeleteMessage] = useState("");
  const [printingJobs, setPrintingJobs] = useState<GcPrintJob[] | null>(null);

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
    // Reset local dropdown states
    setDestinationOption(null);
    setConsignorOption(null);
    setConsigneeOptions([]);

    // Reset API filters
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

  // 🟢 NEW: Async Options Loaders
  // These connect the AsyncAutocomplete component to the DataContext search functions

  const loadDestinationOptions = async (search: string, _prevOptions: any, { page }: any) => {
    const result = await searchToPlaces(search, page);
    return {
      options: result.data.map((p: any) => ({ value: p.placeName, label: p.placeName })),
      hasMore: result.hasMore,
      additional: { page: page + 1 },
    };
  };

  const loadConsignorOptions = async (search: string, _prevOptions: any, { page }: any) => {
    const result = await searchConsignors(search, page);
    return {
      options: result.data.map((c: any) => ({ value: c.id, label: c.name })),
      hasMore: result.hasMore,
      additional: { page: page + 1 },
    };
  };

  const loadConsigneeOptions = async (search: string, _prevOptions: any, { page }: any) => {
    const result = await searchConsignees(search, page);
    return {
      options: result.data.map((c: any) => ({ value: c.id, label: c.name })),
      hasMore: result.hasMore,
      additional: { page: page + 1 },
    };
  };

  const handleEdit = (gcNo: string) => navigate(`/gc-entry/edit/${gcNo}`);

  const handleDelete = (gcNo: string) => {
    setDeletingId(gcNo);
    setDeleteMessage(`Are you sure you want to delete GC Entry #${gcNo}?`);
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

  // --- PRINT HANDLERS ---

  const handlePrintSingle = async (gcNo: string) => {
    try {
      const printData = await fetchGcPrintData([gcNo]);

      if (printData && printData.length > 0) {
        const item = printData[0];
        const { consignor, consignee, ...gcData } = item;

        setPrintingJobs([{
          gc: gcData as GcEntry,
          consignor: consignor as Consignor,
          consignee: consignee as Consignee
        }]);
      } else {
        toast.error("Failed to fetch GC details for printing.");
      }
    } catch (error) {
      console.error("Print error:", error);
      toast.error("An error occurred while fetching print data.");
    }
  };

  const handlePrintSelected = async () => {
    if (selectedGcIds.length === 0 && !selectAllMode) return;

    try {
      let printData = [];

      if (selectAllMode) {
        printData = await fetchGcPrintData([], true, filters);
      } else {
        printData = await fetchGcPrintData(selectedGcIds);
      }

      if (!printData || printData.length === 0) {
        toast.error("Could not fetch data for selected GCs.");
        return;
      }

      const jobs = printData.map((item: any): GcPrintJob | null => {
        const { consignor, consignee, ...gcData } = item;

        if (!consignor || !consignee) {
          console.warn(`Incomplete data for GC ${gcData.gcNo}`);
          return null;
        }

        return {
          gc: gcData as GcEntry,
          consignor: consignor as Consignor,
          consignee: consignee as Consignee
        };
      }).filter((job): job is GcPrintJob => job !== null);

      if (jobs.length > 0) {
        setPrintingJobs(jobs);
        if (!selectAllMode) setSelectedGcIds([]);
        setSelectAllMode(false);
      } else {
        toast.error("Could not prepare print jobs. Check data integrity.");
      }
    } catch (error) {
      console.error("Bulk print error:", error);
      toast.error("An error occurred while preparing print jobs.");
    }
  };

  // --- SELECTION HANDLERS ---

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectAllMode(true);
      setSelectedGcIds(paginatedData.map(gc => gc.gcNo));
    } else {
      setSelectAllMode(false);
      setSelectedGcIds([]);
    }
  };

  useEffect(() => {
    if (selectAllMode) {
      setSelectedGcIds(paginatedData.map(gc => gc.gcNo));
    }
  }, [paginatedData, selectAllMode]);

  const handleSelectRow = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    if (selectAllMode) {
      setSelectAllMode(false);
      if (!e.target.checked) {
        setSelectedGcIds(prev => prev.filter(x => x !== id));
      }
    } else {
      setSelectedGcIds(prev => e.target.checked ? [...prev, id] : prev.filter(x => x !== id));
    }
  };

  const isAllSelected = selectAllMode || (paginatedData.length > 0 && selectedGcIds.length === paginatedData.length);
  const hasActiveFilters = !!filters.destination || !!filters.consignor || (filters.consignee && filters.consignee.length > 0) || filters.filterType !== 'all' || !!filters.search;
  const responsiveBtnClass = "flex-1 md:flex-none text-[10px] xs:text-xs sm:text-sm h-8 sm:h-10 px-1 sm:px-4 whitespace-nowrap";

  const printButtonText = selectAllMode
    ? `Print All (${totalItems})`
    : `Print (${selectedGcIds.length})`;

  return (
    <div className="space-y-6">

      {/* Top Bar */}
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
          <Button
            variant="primary"
            onClick={() => navigate('/gc-entry/new')}
            className={responsiveBtnClass}
          >
            + Add New GC
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="p-4 bg-muted/20 rounded-lg border border-muted animate-in fade-in slide-in-from-top-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Advanced Filters</h3>
            <div className="flex gap-2">
              <button onClick={clearAllFilters} className="text-xs flex items-center text-primary hover:text-primary/80 font-medium">
                <RotateCcw size={14} className="mr-1" /> Clear All
              </button>
              <button onClick={() => setShowFilters(false)} className="text-muted-foreground hover:text-foreground ml-2"><XCircle size={18} /></button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">

            {/* 🟢 Destination Filter (Async) */}
            <AsyncAutocomplete
              label="Filter by Destination"
              placeholder="Search destination..."
              value={destinationOption}
              onChange={(val) => {
                // Cast 'val' to 'any' safely access .value if it exists
                setDestinationOption(val);
                setFilters({ destination: (val as any)?.value || '' });
              }}
              loadOptions={loadDestinationOptions}
              defaultOptions
            />

            {/* 🟢 Consignor Filter (Async) */}
            <AsyncAutocomplete
              label="Filter by Consignor"
              placeholder="Search consignor..."
              value={consignorOption}
              onChange={(val) => {
                setConsignorOption(val);
                setFilters({ consignor: (val as any)?.value || '' });
              }}
              loadOptions={loadConsignorOptions}
              defaultOptions
            />

            {/* 🟢 Consignee Filter (Async Multi-Select) */}
            <div>
              <AsyncAutocomplete
                label="Filter by Consignee"
                placeholder="Select consignees..."
                value={consigneeOptions}
                onChange={(val) => {
                  // 'val' is MultiValue<OptionType> (Array) or SingleValue.
                  // Ensure we treat it as an array.
                  const selectedItems = Array.isArray(val) ? val : (val ? [val] : []);
                  setConsigneeOptions(selectedItems);
                  const ids = selectedItems.map((v: any) => v.value);
                  setFilters({ consignee: ids });
                }}
                loadOptions={loadConsigneeOptions}
                defaultOptions
                isMulti={true} // Enable multi-select
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

      {/* Data Table */}
      <div className="bg-background rounded-lg shadow border border-muted overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-muted">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left"><input type="checkbox" className="h-4 w-4 accent-primary" checked={isAllSelected} onChange={handleSelectAll} /></th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">GC No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Consignor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Consignee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Dest.</th>

                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Qty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted">
              {loading ? (
                <tr><td colSpan={9} className="px-6 py-12 text-center">Loading data...</td></tr>
              ) : paginatedData.length > 0 ? (
                paginatedData.map((gc) => {
                  // 🟢 FIX: Use the new fields returned by backend instead of lookups
                  // Type casting as 'any' because our frontend interface might strictly expect only base fields
                  const consignorName = (gc as any).consignorName || 'N/A';
                  const consigneeName = (gc as any).consigneeName || 'N/A';

                  const tripSheetId = gc.tripSheetId;
                  const isAssigned = tripSheetId && tripSheetId !== "";

                  return (
                    <tr key={gc.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-4"><input type="checkbox" className="h-4 w-4 accent-primary" checked={selectedGcIds.includes(gc.gcNo)} onChange={(e) => handleSelectRow(e, gc.gcNo)} /></td>
                      <td className="px-6 py-4 text-sm font-semibold text-primary">{gc.gcNo}</td>
                      <td className="px-6 py-4 text-sm">{consignorName}</td>
                      <td className="px-6 py-4 text-sm">{consigneeName}</td>
                      <td className="px-6 py-4 text-sm">{gc.destination}</td>

                      <td className="px-6 py-4 text-sm">{gc.totalQty}</td>

                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${isAssigned ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                          {isAssigned ? `TS# ${tripSheetId}` : 'Pending'}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-sm space-x-2">
                        <button onClick={() => handleEdit(gc.gcNo)} className="text-blue-600 hover:text-blue-800"><FilePenLine size={18} /></button>
                        <button onClick={() => handlePrintSingle(gc.gcNo)} className="text-green-600 hover:text-green-800"><Printer size={18} /></button>
                        <button onClick={() => handleDelete(gc.gcNo)} className="text-destructive hover:text-destructive/80"><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={9} className="px-6 py-12 text-center text-muted-foreground">No GC Entries found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="block md:hidden divide-y divide-muted">
          {paginatedData.map((gc) => {
            // 🟢 FIX: Mobile view usage of new fields
            const consignorName = (gc as any).consignorName || 'N/A';
            const consigneeName = (gc as any).consigneeName || 'N/A';
            const tripSheetId = gc.tripSheetId;
            const isAssigned = tripSheetId && tripSheetId !== "";

            return (
              <div key={gc.id} className="p-4 hover:bg-muted/30 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex gap-3 flex-1">
                    <div className="pt-1">
                      <input
                        type="checkbox"
                        className="h-5 w-5 accent-primary"
                        checked={selectedGcIds.includes(gc.gcNo)}
                        onChange={(e) => handleSelectRow(e, gc.gcNo)}
                      />
                    </div>
                    <div className="space-y-1 w-full">
                      <div className="font-bold text-blue-600 text-lg">GC #{gc.gcNo}</div>
                      <div className="font-semibold text-foreground">{consignorName}</div>
                      <div className="text-sm text-muted-foreground">To: {consigneeName}</div>
                      {/* <div className="text-sm text-muted-foreground">From: {gc.from}</div> */}
                      <div className="text-sm text-muted-foreground">At: {gc.destination}</div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 pl-2">
                    <button onClick={() => handleEdit(gc.gcNo)} className="text-blue-600 p-1 hover:bg-blue-50 rounded">
                      <FilePenLine size={20} />
                    </button>
                    <button onClick={() => handlePrintSingle(gc.gcNo)} className="text-green-600 p-1 hover:bg-green-50 rounded">
                      <Printer size={20} />
                    </button>
                    <button onClick={() => handleDelete(gc.gcNo)} className="text-destructive p-1 hover:bg-red-50 rounded">
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>

                <div className="flex justify-end items-end mt-3 pt-3 border-t border-dashed border-muted">
                  <div className={`text-sm font-bold ${isAssigned ? 'text-green-600' : 'text-muted-foreground'}`}>
                    Status: {isAssigned ? `TS# ${tripSheetId}` : 'Pending'}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="border-t border-muted p-4">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} itemsPerPage={itemsPerPage} onItemsPerPageChange={setItemsPerPage} totalItems={totalItems} />
        </div>
      </div>

      <ConfirmationDialog
        open={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete GC"
        description={deleteMessage}
      />
      {printingJobs && <GcPrintManager jobs={printingJobs} onClose={() => setPrintingJobs(null)} />}
    </div>
  );
};