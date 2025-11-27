
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FilePenLine, Trash2, Search, Printer, Filter, XCircle, RotateCcw } from 'lucide-react';
import { DateFilterButtons, getTodayDate, getYesterdayDate } from '../../components/shared/DateFilterButtons';
import { ConfirmationDialog } from '../../components/shared/ConfirmationDialog';
import { useData } from '../../hooks/useData';
import { useServerPagination } from '../../hooks/useServerPagination';
import { Button } from '../../components/shared/Button';
import { AutocompleteInput } from '../../components/shared/AutocompleteInput';
import { MultiSelect } from '../../components/shared/MultiSelect';
import { GcPrintManager, type GcPrintJob } from './GcPrintManager';
import { Pagination } from '../../components/shared/Pagination';
import type { GcEntry } from '../../types';

export const GcEntryList = () => {
  const navigate = useNavigate();
  const { deleteGcEntry, consignors, consignees, getUniqueDests } = useData();
  
  // Use Server Pagination Hook
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
    endpoint: '/operations/gc',
    initialFilters: { search: '', filterType: 'all' }
  });

  const [showFilters, setShowFilters] = useState(false);
  
  // Local state for UI controls
  const [selectedGcIds, setSelectedGcIds] = useState<string[]>([]);
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
    setFilters({ 
        search: '', 
        filterType: 'all', 
        startDate: '', 
        endDate: '', 
        destination: '', 
        consignor: '', 
        consignee: [] // Reset to empty array
    });
  };

  // Options for dropdowns
  const allConsignorOptions = useMemo(() => consignors.map(c => ({ value: c.id, label: c.name })), [consignors]);
  const allConsigneeOptions = useMemo(() => consignees.map(c => ({ value: c.id, label: c.name })), [consignees]);
  const allDestinationOptions = useMemo(getUniqueDests, [getUniqueDests]);

  // Actions
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
  
  const handlePrintSingle = (gcNo: string) => {
    const gc = paginatedData.find(g => g.gcNo === gcNo);
    if (!gc) return;
    const consignor = consignors.find(c => c.id === gc.consignorId);
    const consignee = consignees.find(c => c.id === gc.consigneeId);
    if (consignor && consignee) setPrintingJobs([{ gc, consignor, consignee }]);
  };
  
  const handlePrintSelected = () => {
    if (selectedGcIds.length === 0) return;
    const jobs = selectedGcIds.map(id => {
      const gc = paginatedData.find(g => g.gcNo === id);
      if (!gc) return null;
      const consignor = consignors.find(c => c.id === gc.consignorId);
      const consignee = consignees.find(c => c.id === gc.consigneeId);
      return (consignor && consignee) ? { gc, consignor, consignee } : null;
    }).filter(Boolean) as GcPrintJob[];
    if (jobs.length > 0) { setPrintingJobs(jobs); setSelectedGcIds([]); }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedGcIds(e.target.checked ? paginatedData.map(gc => gc.gcNo) : []);
  };
  const handleSelectRow = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    setSelectedGcIds(prev => e.target.checked ? [...prev, id] : prev.filter(x => x !== id));
  };
  const isAllSelected = paginatedData.length > 0 && selectedGcIds.length === paginatedData.length;

  // Check filters specifically to show active state
  const hasActiveFilters = !!filters.destination || !!filters.consignor || (filters.consignee && filters.consignee.length > 0) || filters.filterType !== 'all' || !!filters.search;
  const responsiveBtnClass = "flex-1 md:flex-none text-[10px] xs:text-xs sm:text-sm h-8 sm:h-10 px-1 sm:px-4 whitespace-nowrap";

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
            disabled={selectedGcIds.length === 0}
            className={responsiveBtnClass}
          >
            <Printer size={14} className="mr-1 sm:mr-2" />
            Print ({selectedGcIds.length})
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
            <AutocompleteInput 
                label="Filter by Destination" 
                options={allDestinationOptions} 
                value={filters.destination || ''} 
                onSelect={(val) => setFilters({ destination: val })} 
                placeholder="Search destination..." 
            />
            
            <AutocompleteInput 
                label="Filter by Consignor" 
                options={allConsignorOptions} 
                value={filters.consignor || ''} 
                onSelect={(val) => setFilters({ consignor: val })} 
                placeholder="Search consignor..." 
            />

            {/* MultiSelect for Consignee - Ensures array is passed */}
            <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Filter by Consignee</label>
                <MultiSelect 
                    options={allConsigneeOptions} 
                    selected={filters.consignee || []} 
                    onChange={(val) => setFilters({ consignee: val })} 
                    placeholder="Select consignees..."
                    searchPlaceholder="Search..."
                    emptyPlaceholder="None found."
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
                    const consignor = consignors.find(c => c.id === gc.consignorId);
                    const consignee = consignees.find(c => c.id === gc.consigneeId);
                    
                    // CHANGED: Use direct property from GC entry
                    const tripSheetId = gc.tripSheetId;
                    const isAssigned = tripSheetId && tripSheetId !== "";

                    return (
                      <tr key={gc.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-4"><input type="checkbox" className="h-4 w-4 accent-primary" checked={selectedGcIds.includes(gc.gcNo)} onChange={(e) => handleSelectRow(e, gc.gcNo)} /></td>
                        <td className="px-6 py-4 text-sm font-semibold text-primary">{gc.gcNo}</td>
                        <td className="px-6 py-4 text-sm">{consignor?.name || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm">{consignee?.name || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm">{gc.destination}</td>

                        <td className="px-6 py-4 text-sm">{gc.quantity}</td>
                        
                        {/* CHANGED: Display Logic */}
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
        
        {/* Mobile View (Cards) */}
        <div className="block md:hidden divide-y divide-muted">
           {paginatedData.map((gc) => {
             const consignor = consignors.find(c => c.id === gc.consignorId);
             const consignee = consignees.find(c => c.id === gc.consigneeId);
             
             // CHANGED: Use direct property from GC entry
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
                      <div className="font-semibold text-foreground">{consignor?.name}</div>
                      <div className="text-sm text-muted-foreground">To: {consignee?.name}</div>
                      <div className="text-sm text-muted-foreground">From: {gc.from}</div>
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
                   {/* <div className="text-sm font-medium">
                      Bill Value: ₹{(parseFloat(gc.billValue) || 0).toLocaleString('en-IN')}
                   </div> */}
                   {/* CHANGED: Display Logic */}
                   <div className={`text-sm font-bold ${isAssigned ? 'text-green-600' : 'text-muted-foreground'}`}>
                      Status: {isAssigned ? `TS# ${tripSheetId}` : 'Pending'}
                   </div>
                </div>
             </div>
          )})}
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
