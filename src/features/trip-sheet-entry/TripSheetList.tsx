import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FilePenLine, Trash2, Search, Printer, FileText, Filter, XCircle, RotateCcw } from "lucide-react";
import { DateFilterButtons, getTodayDate, getYesterdayDate, isDateInLast7Days } from "../../components/shared/DateFilterButtons";
import { ConfirmationDialog } from "../../components/shared/ConfirmationDialog";
import { Button } from "../../components/shared/Button";
import { AutocompleteInput } from "../../components/shared/AutocompleteInput";
import { MultiSelect } from "../../components/shared/MultiSelect";
import { useData } from "../../hooks/useData";
import type { TripSheetEntry } from "../../types"; 
import { usePagination } from "../../utils/usePagination";
import { Pagination } from "../../components/shared/Pagination";
import { TripSheetPrintManager } from "./TripSheetPrintManager";
import { TripSheetReportPrint } from "./TripSheetReportView";

export const TripSheetList = () => {
  const navigate = useNavigate();
  const { tripSheets, deleteTripSheet, consignees, consignors } = useData();

  const [showFilters, setShowFilters] = useState(false);
  const [printIds, setPrintIds] = useState<string[] | null>(null);
  const [reportPrintingJobs, setReportPrintingJobs] = useState<TripSheetEntry[] | null>(null);

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [tsFilter, setTsFilter] = useState("");
  const [toPlaceFilter, setToPlaceFilter] = useState("");
  const [consigneeFilter, setConsigneeFilter] = useState<string[]>([]);
  const [consignorFilter, setConsignorFilter] = useState("");

  const [selected, setSelected] = useState<string[]>([]);
  const [delId, setDelId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState(""); // Added dynamic message state

  // Options
  const consigneeOptions = useMemo(() => consignees.map((c) => ({ value: c.id, label: c.name })), [consignees]);
  const consignorOptions = useMemo(() => consignors.map((c) => ({ value: c.id, label: c.name })), [consignors]);
  const tsOptions = useMemo(() => tripSheets.map((t) => ({ value: t.mfNo, label: t.mfNo })), [tripSheets]);
  const placeOptions = useMemo(() => [...new Set(tripSheets.map((t) => t.toPlace))].map((p) => ({ value: p, label: p })), [tripSheets]);

  // Clear Filters
  const clearAllFilters = () => {
    setSearch('');
    setFilterType('all');
    setCustomStart('');
    setCustomEnd('');
    setTsFilter('');
    setToPlaceFilter('');
    setConsignorFilter('');
    setConsigneeFilter([]);
  };

  // Filtering Logic
  const filtered = useMemo(() => {
    return tripSheets.filter((ts: TripSheetEntry) => {
      
      // Universal Search
      const searchStr = search.toLowerCase();
      const rowData = [
          ts.mfNo, 
          ts.tsDate, 
          ts.fromPlace, 
          ts.toPlace, 
          ts.driverName, 
          ts.lorryNo, 
          ts.totalAmount.toString()
      ].join(' ').toLowerCase();

      const searchMatch = !search || rowData.includes(searchStr);
      
      const date = ts.tsDate;
      const dateMatch = (() => {
        switch (filterType) {
          case "today": return date === getTodayDate();
          case "yesterday": return date === getYesterdayDate();
          case "week": return isDateInLast7Days(date);
          case "custom": return (!customStart || date >= customStart) && (!customEnd || date <= customEnd);
          default: return true;
        }
      })();

      const tsMatch = !tsFilter || ts.mfNo.includes(tsFilter);
      const toMatch = !toPlaceFilter || ts.toPlace.toLowerCase().includes(toPlaceFilter.toLowerCase());
      const consigneeMatch = consigneeFilter.length === 0 || (ts.consigneeid && consigneeFilter.includes(String(ts.consigneeid)));
      const consignorMatch = !consignorFilter || (ts.consignorid && String(ts.consignorid) === consignorFilter);

      return searchMatch && dateMatch && tsMatch && toMatch && consigneeMatch && consignorMatch;
    });
  }, [tripSheets, search, filterType, customStart, customEnd, tsFilter, toPlaceFilter, consigneeFilter, consignorFilter]);

  const { paginatedData, currentPage, setCurrentPage, totalPages, itemsPerPage, setItemsPerPage, totalItems } = usePagination({ data: filtered, initialItemsPerPage: 10 });

  // Handlers
  const toggleSelect = (mfNo: string) => setSelected(prev => prev.includes(mfNo) ? prev.filter(x => x !== mfNo) : [...prev, mfNo]);
  const toggleSelectAll = () => setSelected(selected.length === filtered.length ? [] : filtered.map(t => t.mfNo));
  
  const onDelete = (mfNo: string) => { 
    setDelId(mfNo); 
    setDeleteMessage(`Are you sure you want to delete Trip Sheet #${mfNo}?`);
    setConfirmOpen(true); 
  };
  
  const confirmDelete = () => { 
    if (delId) deleteTripSheet(delId); 
    setConfirmOpen(false); 
    setDelId(null); 
  };
  
  const handlePrintSingle = (id: string) => setPrintIds([id]);
  const handlePrintSelected = () => { if (selected.length > 0) setPrintIds(selected); };
  const handleShowReport = () => { if (filtered.length > 0) setReportPrintingJobs(filtered); else alert("No data."); };

  const hasActiveFilters = tsFilter || toPlaceFilter || consignorFilter || consigneeFilter.length > 0 || filterType !== 'all' || search !== '';

  return (
    <div className="space-y-6">
      
      {/* 1. Top Control Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-background p-4 rounded-lg shadow border border-muted">
        
        {/* LEFT: Search + Filter */}
        <div className="flex items-center gap-2 w-full md:w-1/2">
           <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search all data..."
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
          <Button variant="secondary" onClick={handleShowReport}>
            <FileText size={16} className="mr-2" /> Report
          </Button>
          
          <Button variant="secondary" onClick={handlePrintSelected} disabled={selected.length === 0}>
            <Printer size={16} className="mr-2" /> Print Selected ({selected.length})
          </Button>
          
          <Button variant="primary" onClick={() => navigate("/tripsheet/new")}>
            + Add New
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
              <button onClick={() => setShowFilters(false)} className="text-muted-foreground hover:text-foreground ml-2"><XCircle size={18} /></button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-4">
             <AutocompleteInput label="TS No" options={tsOptions} value={tsFilter} onSelect={setTsFilter} placeholder="Filter TS No..." />
             <AutocompleteInput label="To Place" options={placeOptions} value={toPlaceFilter} onSelect={setToPlaceFilter} placeholder="Filter place..." />
             <AutocompleteInput label="Filter by Consignor" value={consignorFilter} options={consignorOptions} onSelect={setConsignorFilter} placeholder="Search consignor..." />
             <div>
               <label className="text-sm text-muted-foreground mb-0.5">Filter by Consignee</label>
               <MultiSelect options={consigneeOptions} selected={consigneeFilter} onChange={setConsigneeFilter} placeholder="Select consignees..." searchPlaceholder="" emptyPlaceholder="" />
             </div>
          </div>
          <DateFilterButtons filterType={filterType} setFilterType={setFilterType} customStart={customStart} setCustomStart={setCustomStart} customEnd={customEnd} setCustomEnd={setCustomEnd} />
        </div>
      )}

      {/* 3. Data Table */}
      <div className="bg-background rounded-lg shadow border border-muted overflow-hidden">
        
        {/* A) Desktop View: Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-muted">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left"><input type="checkbox" className="h-4 w-4 accent-primary" checked={selected.length === filtered.length && filtered.length > 0} onChange={toggleSelectAll} /></th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">TS No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">From</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted">
              {paginatedData.map((ts) => (
                <tr key={ts.mfNo} className="hover:bg-muted/30">
                  <td className="px-6 py-4"><input type="checkbox" className="h-4 w-4 accent-primary" checked={selected.includes(ts.mfNo)} onChange={() => toggleSelect(ts.mfNo)} /></td>
                  <td className="px-6 py-4 font-semibold text-primary">{ts.mfNo}</td>
                        <td className="px-6 py-4 text-sm">{ts.fromPlace}</td>
                  <td className="px-6 py-4 text-sm">{ts.toPlace}</td>
                  <td className="px-6 py-4 text-sm">{ts.tsDate}</td>
            
                  <td className="px-6 py-4 text-sm">₹{ts.totalAmount.toLocaleString("en-IN")}</td>
                  <td className="px-6 py-4 space-x-3">
                    <button onClick={() => navigate(`/tripsheet/edit/${ts.mfNo}`)} className="text-blue-600 hover:text-blue-800"><FilePenLine size={18} /></button>
                    <button onClick={() => handlePrintSingle(ts.mfNo)} className="text-green-600 hover:text-green-800"><Printer size={18} /></button>
                    <button onClick={() => onDelete(ts.mfNo)} className="text-destructive hover:text-destructive/80"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* B) Mobile View: Detailed Cards */}
        <div className="block md:hidden divide-y divide-muted">
          {paginatedData.map((ts) => (
            <div key={ts.mfNo} className="p-4 bg-background hover:bg-muted/10 transition-colors">
               <div className="flex justify-between items-start">
                  {/* Left: Checkbox + Details */}
                  <div className="flex gap-3 w-full">
                     {/* Checkbox */}
                     <div className="pt-1">
                        <input 
                          type="checkbox" 
                          className="h-5 w-5 accent-primary" 
                          checked={selected.includes(ts.mfNo)} 
                          onChange={() => toggleSelect(ts.mfNo)} 
                        />
                     </div>

                     {/* Details Content */}
                     <div className="flex-1 space-y-1">
                        {/* Title */}
                        <div className="font-bold text-blue-600 text-lg leading-tight mb-2">
                           TS #{ts.mfNo}
                        </div>
                        
                        {/* Data Rows */}
                        <div className="text-sm text-muted-foreground space-y-0.5">
                           <div><span className="font-medium text-foreground">Date:</span> {ts.tsDate}</div>
                           <div><span className="font-medium text-foreground">From:</span> {ts.fromPlace}</div>
                           <div><span className="font-medium text-foreground">To:</span> {ts.toPlace}</div>
                        </div>
                     </div>
                  </div>

                  {/* Right: Actions Stack */}
                  <div className="flex flex-col gap-3 pl-2">
                     <button onClick={() => navigate(`/tripsheet/edit/${ts.mfNo}`)} className="text-blue-600 p-1 hover:bg-blue-50 rounded">
                        <FilePenLine size={20} />
                     </button>
                     <button onClick={() => handlePrintSingle(ts.mfNo)} className="text-green-600 p-1 hover:bg-green-50 rounded">
                        <Printer size={20} />
                     </button>
                     <button onClick={() => onDelete(ts.mfNo)} className="text-destructive p-1 hover:bg-red-50 rounded">
                        <Trash2 size={20} />
                     </button>
                  </div>
               </div>

               {/* Footer: Amount */}
               <div className="mt-3 pt-2 text-sm font-medium text-foreground border-t border-dashed border-muted">
                  Amount: ₹{ts.totalAmount.toLocaleString("en-IN")}
               </div>
            </div>
          ))}
        </div>
        
        {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No Trip Sheets match the selected filters.
            </div>
        )}

        <div className="border-t border-muted p-4">
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} itemsPerPage={itemsPerPage} onItemsPerPageChange={setItemsPerPage} totalItems={totalItems} />
        </div>
      </div>

      <ConfirmationDialog 
        open={confirmOpen} 
        onClose={() => setConfirmOpen(false)} 
        onConfirm={confirmDelete} 
        title="Delete Trip Sheet" 
        description={deleteMessage} 
      />
      {printIds && <TripSheetPrintManager mfNos={printIds} onClose={() => setPrintIds(null)} />}
      {reportPrintingJobs && <TripSheetReportPrint sheets={reportPrintingJobs} onClose={() => setReportPrintingJobs(null)} />}
    </div>
  );
};