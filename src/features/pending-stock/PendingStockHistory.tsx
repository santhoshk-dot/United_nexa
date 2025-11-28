import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FilePenLine, Trash2, Search, Printer, FileText, Filter, XCircle, RotateCcw } from 'lucide-react';
import { DateFilterButtons, getTodayDate, getYesterdayDate } from '../../components/shared/DateFilterButtons';
import { ConfirmationDialog } from '../../components/shared/ConfirmationDialog';
import { useData } from '../../hooks/useData';
import { Button } from '../../components/shared/Button';
import { AutocompleteInput } from '../../components/shared/AutocompleteInput';
import { MultiSelect } from '../../components/shared/MultiSelect';
import { StockReportPrint } from './StockReportView';
import { GcPrintManager, type GcPrintJob } from '../gc-entry/GcPrintManager';
import type { GcEntry, Consignor, Consignee } from '../../types';
import { useServerPagination } from '../../hooks/useServerPagination'; 
import { Pagination } from '../../components/shared/Pagination';

type ReportJob = {
  gc: GcEntry;
  consignor?: Consignor;
  consignee?: Consignee;
};

export const PendingStockHistory = () => {
  const navigate = useNavigate();
  // CHANGED: Removed fetchGcById, Added fetchGcPrintData
  const { deleteGcEntry, consignors, consignees, getUniqueDests, fetchGcPrintData } = useData();
  
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
  } = useServerPagination<GcEntry>({ 
    endpoint: '/operations/pending-stock', 
    initialFilters: { search: '', filterType: 'all' },
    
  });

  const [showFilters, setShowFilters] = useState(false);
  
  // --- UI STATE ---
  const [selectedGcIds, setSelectedGcIds] = useState<string[]>([]);
  // NEW: State to track if "Select All" is active
  const [selectAllMode, setSelectAllMode] = useState(false);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteMessage, setDeleteMessage] = useState(""); 
  const [reportPrintingJobs, setReportPrintingJobs] = useState<ReportJob[] | null>(null);
  const [gcPrintingJobs, setGcPrintingJobs] = useState<GcPrintJob[] | null>(null);
  
  // --- OPTIONS ---
  const allConsignorOptions = useMemo(() => consignors.map(c => ({ value: c.id, label: c.name })), [consignors]);
  const allConsigneeOptions = useMemo(() => consignees.map(c => ({ value: c.id, label: c.name })), [consignees]);
  const allDestinationOptions = useMemo(getUniqueDests, [getUniqueDests]);

  // --- FILTER HANDLERS ---
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

  // --- ACTIONS ---
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
    }
    setIsConfirmOpen(false); 
    setDeletingId(null); 
  };
  
  // --- OPTIMIZED PRINT HANDLERS ---

  const handlePrintSingle = async (gcNo: string) => {
    try {
        const printData = await fetchGcPrintData([gcNo]);
        
        if (printData && printData.length > 0) {
            const item = printData[0];
            const { consignor, consignee, ...gcData } = item;
            
            setGcPrintingJobs([{ 
                gc: gcData as GcEntry, 
                consignor: consignor as Consignor, 
                consignee: consignee as Consignee 
            }]);
        } else {
            alert("Failed to fetch GC details.");
        }
    } catch (error) {
        console.error("Print error:", error);
        alert("An error occurred while fetching print data.");
    }
  };
  
  const handlePrintSelected = async () => {
    if (selectedGcIds.length === 0 && !selectAllMode) return;
    
    try {
        let printData = [];
        
        if (selectAllMode) {
            // 1. Call Optimized Backend Endpoint with Select All Mode
            // Pass a special flag so backend knows to enforce "Pending Stock" logic (tripSheetId match)
            const printFilters = { ...filters, pendingStockView: true };
            printData = await fetchGcPrintData([], true, printFilters);
        } else {
            // 2. Call for specific IDs
            printData = await fetchGcPrintData(selectedGcIds);
        }
        
        if (!printData || printData.length === 0) {
            alert("Could not fetch data for selected GCs.");
            return;
        }

        // 3. Map response to GcPrintJob structure
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
          setGcPrintingJobs(jobs); 
          // Reset selection unless user explicitly wants to keep it
          if (!selectAllMode) setSelectedGcIds([]); 
          setSelectAllMode(false); 
        } else {
          alert("Could not prepare print jobs. Check data integrity.");
        }
    } catch (error) {
        console.error("Bulk print error:", error);
        alert("An error occurred while preparing print jobs.");
    }
  };

  // Report generation uses the list data directly (which contains packing/contents/date)
  // This is acceptable for "Report"
  const handleShowReport = () => {
    if (paginatedData.length === 0) return;
    const jobs: ReportJob[] = paginatedData.map(gc => ({
       gc, 
       consignor: consignors.find(c => c.id === gc.consignorId), 
       consignee: consignees.find(c => c.id === gc.consigneeId)
    }));
    setReportPrintingJobs(jobs);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
        setSelectAllMode(true);
        // Visually select current page
        setSelectedGcIds(paginatedData.map(gc => gc.gcNo));
    } else {
        setSelectAllMode(false);
        setSelectedGcIds([]);
    }
  };

  // Ensure visual state persists when data updates (e.g., page change)
  useEffect(() => {
    if (selectAllMode) {
        setSelectedGcIds(paginatedData.map(gc => gc.gcNo));
    }
  }, [paginatedData, selectAllMode]);
  
  const handleSelectRow = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    if (selectAllMode) {
        setSelectAllMode(false); // Disable global select if user deselects one
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
  
  // Calculate display count for button
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
            >
               <Filter size={18} className={hasActiveFilters ? "mr-2" : ""} />
               {hasActiveFilters && "Active"}
            </Button>
          </div>
          
        <div className="flex gap-2 w-full md:w-auto justify-between md:justify-end">
          <Button 
            variant="secondary" 
            onClick={handleShowReport} 
            disabled={paginatedData.length === 0}
            className={responsiveBtnClass}
          >
            <FileText size={14} className="mr-1 sm:mr-2" /> Report
          </Button>
          
          <Button 
            variant="secondary" 
            onClick={handlePrintSelected} 
            disabled={selectedGcIds.length === 0 && !selectAllMode}
            className={responsiveBtnClass}
          >
            <Printer size={14} className="mr-1 sm:mr-2" /> {printButtonText}
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

      {/* Advanced Filters Panel */}
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
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
             <AutocompleteInput 
               label="Destination" 
               options={allDestinationOptions} 
               value={filters.destination || ''} 
               onSelect={(val) => setFilters({ destination: val })} 
               placeholder="Search..." 
             />
             <AutocompleteInput 
               label="Consignor" 
               options={allConsignorOptions} 
               value={filters.consignor || ''} 
               onSelect={(val) => setFilters({ consignor: val })} 
               placeholder="Search..." 
             />
             <div>
               <label className="block text-sm font-medium text-muted-foreground mb-1">Consignee</label>
               <MultiSelect 
                 options={allConsigneeOptions} 
                 selected={filters.consignee || []} 
                 onChange={(val) => setFilters({ consignee: val })} 
                 placeholder="Select..." 
                 searchPlaceholder="" 
                 emptyPlaceholder="" 
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

      <div className="bg-background rounded-lg shadow border border-muted overflow-hidden">
         <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-muted">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input type="checkbox" className="h-4 w-4 accent-primary" checked={isAllSelected} onChange={handleSelectAll} />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">GC No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Consignor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Consignee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">From</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Qty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted">
              {loading ? (
                 <tr><td colSpan={8} className="px-6 py-12 text-center">Loading data...</td></tr>
              ) : paginatedData.length > 0 ? (
                paginatedData.map((gc) => (
                  <tr key={gc.id}>
                     <td className="px-4 py-4"><input type="checkbox" className="h-4 w-4 accent-primary" checked={selectedGcIds.includes(gc.gcNo)} onChange={(e) => handleSelectRow(e, gc.gcNo)} /></td>
                     <td className="px-6 py-4 text-primary font-semibold">{gc.gcNo}</td>
                     <td className="px-6 py-4 text-sm">{consignors.find(c=>c.id===gc.consignorId)?.name || 'N/A'}</td>
                     <td className="px-6 py-4 text-sm">{consignees.find(c=>c.id===gc.consigneeId)?.name || 'N/A'}</td>
                     <td className="px-6 py-4 text-sm">{gc.from}</td>
                     <td className="px-6 py-4 text-sm">{gc.destination}</td>
                     <td className="px-6 py-4 text-sm">{gc.quantity}</td>
                     <td className="px-6 py-4 space-x-3">
                        <button onClick={() => handleEdit(gc.gcNo)} className="text-blue-600"><FilePenLine size={18} /></button>
                        <button onClick={() => handlePrintSingle(gc.gcNo)} className="text-green-600"><Printer size={18} /></button>
                        <button onClick={() => handleDelete(gc.gcNo)} className="text-destructive"><Trash2 size={18} /></button>
                     </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">No Pending Stock entries found.</td></tr>
              )}
            </tbody>
          </table>
         </div>

         {/* Mobile View */}
         <div className="block md:hidden divide-y divide-muted">
           {paginatedData.length > 0 ? (
             paginatedData.map((gc) => {
               const consignor = consignors.find(c => c.id === gc.consignorId);
               const consignee = consignees.find(c => c.id === gc.consigneeId);
               return (
               <div key={gc.id} className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex justify-between items-start">
                     <div className="flex gap-3 flex-1">
                        <div className="pt-1">
                           <input type="checkbox" className="h-5 w-5 accent-primary" checked={selectedGcIds.includes(gc.gcNo)} onChange={(e) => handleSelectRow(e, gc.gcNo)} />
                        </div>
                        <div className="space-y-1 w-full">
                           <div className="font-bold text-blue-600 text-lg">GC #{gc.gcNo}</div>
                           <div className="font-semibold text-foreground">{consignor?.name || 'N/A'}</div>
                           <div className="text-sm text-muted-foreground">To: {consignee?.name || 'N/A'}</div>
                           <div className="text-sm text-muted-foreground">From: {gc.from}</div>
                           <div className="text-sm text-muted-foreground">At: {gc.destination}</div>
                        </div>
                     </div>

                     <div className="flex flex-col gap-3 pl-2">
                        <button onClick={() => handleEdit(gc.gcNo)} className="text-blue-600 p-1 hover:bg-blue-50 rounded"><FilePenLine size={20}/></button>
                        <button onClick={() => handlePrintSingle(gc.gcNo)} className="text-green-600 p-1 hover:bg-green-50 rounded"><Printer size={20}/></button>
                        <button onClick={() => handleDelete(gc.gcNo)} className="text-destructive p-1 hover:bg-red-50 rounded"><Trash2 size={20}/></button>
                     </div>
                  </div>

                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-dashed border-muted">
                     <div className="text-sm font-medium">Qty: {gc.quantity}</div>
                     <div className="text-sm font-bold text-muted-foreground">Status: Pending</div>
                  </div>
               </div>
             )})
           ) : (
             <div className="p-8 text-center text-muted-foreground">No Pending Stock entries found.</div>
           )}
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
      {reportPrintingJobs && <StockReportPrint jobs={reportPrintingJobs} onClose={() => setReportPrintingJobs(null)} />}
      {gcPrintingJobs && <GcPrintManager jobs={gcPrintingJobs} onClose={() => setGcPrintingJobs(null)} />}
    </div>
  );
};