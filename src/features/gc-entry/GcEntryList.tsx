
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FilePenLine, Trash2, Search, Printer, Filter, XCircle, RotateCcw } from 'lucide-react';
import { DateFilterButtons, getTodayDate, getYesterdayDate, isDateInLast7Days } from '../../components/shared/DateFilterButtons';
import { ConfirmationDialog } from '../../components/shared/ConfirmationDialog';
import { useData } from '../../hooks/useData';
import { Button } from '../../components/shared/Button';
import { AutocompleteInput } from '../../components/shared/AutocompleteInput';
import { MultiSelect } from '../../components/shared/MultiSelect';
import { GcPrintManager, type GcPrintJob } from './GcPrintManager';
import { usePagination } from '../../utils/usePagination';
import { Pagination } from '../../components/shared/Pagination';

export const GcEntryList = () => {
  const navigate = useNavigate();
  const { gcEntries, deleteGcEntry, consignors, consignees, getUniqueDests, tripSheets } = useData();
  
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [destFilter, setDestFilter] = useState('');
  const [consignorFilter, setConsignorFilter] = useState('');
  const [consigneeFilter, setConsigneeFilter] = useState<string[]>([]);

  const [selectedGcIds, setSelectedGcIds] = useState<string[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteMessage, setDeleteMessage] = useState(""); 
  const [printingJobs, setPrintingJobs] = useState<GcPrintJob[] | null>(null);
  
  const getGcStatus = (gcId: string) => {
    const foundSheet = tripSheets.find(sheet => 
      // Matches based on the stored gcNo string
      sheet.items?.some(item => item.gcNo === gcId)
    );
    return foundSheet ? foundSheet.mfNo : '0';
  };

  const allConsignorOptions = useMemo(() => consignors.map(c => ({ value: c.id, label: c.name })), [consignors]);
  const allConsigneeOptions = useMemo(() => consignees.map(c => ({ value: c.id, label: c.name })), [consignees]);
  const allDestinationOptions = useMemo(getUniqueDests, [getUniqueDests]);

  const { filteredConsignorOptions, filteredConsigneeOptions, filteredDestinationOptions } = useMemo(() => {
    let relevantConsignors = new Set(consignors.map(c => c.id));
    let relevantConsignees = new Set(consignees.map(c => c.id));
    let relevantDests = new Set(allDestinationOptions.map(d => d.value));

    if (destFilter) {
      const gcNors = new Set(gcEntries.filter(gc => gc.destination === destFilter).map(gc => gc.consignorId));
      const gcNees = new Set(gcEntries.filter(gc => gc.destination === destFilter).map(gc => gc.consigneeId));
      const neeNors = new Set(consignees.filter(c => c.destination === destFilter).map(c => c.consignorId).filter(Boolean) as string[]);
      const neeNees = new Set(consignees.filter(c => c.destination === destFilter).map(c => c.id));
      relevantConsignors = new Set([...gcNors, ...neeNors]);
      relevantConsignees = new Set([...gcNees, ...neeNees]);
    }

    if (consignorFilter) {
      const gcNees = new Set(gcEntries.filter(gc => gc.consignorId === consignorFilter).map(gc => gc.consigneeId));
      const neeNees = new Set(consignees.filter(c => c.consignorId === consignorFilter).map(c => c.id));
      relevantConsignees = new Set([...relevantConsignees].filter(id => new Set([...gcNees, ...neeNees]).has(id)));
    }
    
    if (consigneeFilter.length > 0) {
      const gcNors = new Set(gcEntries.filter(gc => consigneeFilter.includes(gc.consigneeId)).map(gc => gc.consignorId));
      const neeNors = new Set(consignees.filter(c => consigneeFilter.includes(c.id)).map(c => c.consignorId).filter(Boolean) as string[]);
      relevantConsignors = new Set([...relevantConsignors].filter(id => new Set([...gcNors, ...neeNors]).has(id)));
    }

    return {
      filteredConsignorOptions: allConsignorOptions.filter(opt => relevantConsignors.has(opt.value)),
      filteredConsigneeOptions: allConsigneeOptions.filter(opt => relevantConsignees.has(opt.value)),
      filteredDestinationOptions: allDestinationOptions.filter(opt => relevantDests.has(opt.value)),
    };

  }, [destFilter, consignorFilter, consigneeFilter, gcEntries, consignors, consignees, allConsignorOptions, allConsigneeOptions, allDestinationOptions]);

  const clearAllFilters = () => {
    setSearch('');
    setFilterType('all');
    setCustomStart('');
    setCustomEnd('');
    setDestFilter('');
    setConsignorFilter('');
    setConsigneeFilter([]);
  };

  const filteredGcEntries = useMemo(() => {
    return gcEntries.filter(gc => {
      const consignor = consignors.find(c => c.id === gc.consignorId);
      const consignee = consignees.find(c => c.id === gc.consigneeId);
      
      const searchStr = search.toLowerCase();
      const rowData = [
        gc.gcNo, // Search by GC No string
        consignor?.name,
        consignee?.name,
        gc.destination,
        gc.billValue,
        gc.quantity,
        gc.packing,
        gc.contents,
        getGcStatus(gc.gcNo)
      ].join(' ').toLowerCase();

      const searchMatch = !search || rowData.includes(searchStr);
      
      const date = gc.gcDate;
      const dateMatch = (() => {
        switch (filterType) {
          case 'today': return date === getTodayDate();
          case 'yesterday': return date === getYesterdayDate();
          case 'week': return isDateInLast7Days(date);
          case 'custom': return (!customStart || date >= customStart) && (!customEnd || date <= customEnd);
          default: return true;
        }
      })();
      
      const destMatch = !destFilter || gc.destination === destFilter;
      const consignorMatch = !consignorFilter || gc.consignorId === consignorFilter;
      const consigneeMatch = consigneeFilter.length === 0 || consigneeFilter.includes(gc.consigneeId);

      return searchMatch && dateMatch && destMatch && consignorMatch && consigneeMatch;
    });
  }, [gcEntries, consignors, consignees, search, filterType, customStart, customEnd, destFilter, consignorFilter, consigneeFilter]);
  
  const { paginatedData, currentPage, setCurrentPage, totalPages, itemsPerPage, setItemsPerPage, totalItems } = usePagination({ data: filteredGcEntries, initialItemsPerPage: 10 });

  const handleEdit = (gcNo: string) => navigate(`/gc-entry/edit/${gcNo}`);
  
  const handleDelete = (gcNo: string) => { 
    setDeletingId(gcNo); 
    setDeleteMessage(`Are you sure you want to delete GC Entry #${gcNo}?`);
    setIsConfirmOpen(true); 
  };
  
  const handleConfirmDelete = () => { 
    if (deletingId) deleteGcEntry(deletingId); 
    setIsConfirmOpen(false); 
    setDeletingId(null); 
  };
  
  const handlePrintSingle = (gcNo: string) => {
    const gc = gcEntries.find(g => g.gcNo === gcNo);
    if (!gc) return;
    const consignor = consignors.find(c => c.id === gc.consignorId);
    const consignee = consignees.find(c => c.id === gc.consigneeId);
    if (consignor && consignee) setPrintingJobs([{ gc, consignor, consignee }]);
  };
  
  const handlePrintSelected = () => {
    if (selectedGcIds.length === 0) return;
    const jobs = selectedGcIds.map(id => {
      const gc = gcEntries.find(g => g.gcNo === id);
      if (!gc) return null;
      const consignor = consignors.find(c => c.id === gc.consignorId);
      const consignee = consignees.find(c => c.id === gc.consigneeId);
      return (consignor && consignee) ? { gc, consignor, consignee } : null;
    }).filter(Boolean) as GcPrintJob[];
    if (jobs.length > 0) { setPrintingJobs(jobs); setSelectedGcIds([]); }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Select by gcNo
    setSelectedGcIds(e.target.checked ? filteredGcEntries.map(gc => gc.gcNo) : []);
  };
  const handleSelectRow = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    setSelectedGcIds(prev => e.target.checked ? [...prev, id] : prev.filter(x => x !== id));
  };
  const isAllSelected = filteredGcEntries.length > 0 && selectedGcIds.length === filteredGcEntries.length;

  const hasActiveFilters = destFilter || consignorFilter || consigneeFilter.length > 0 || filterType !== 'all' || search !== '';

  const responsiveBtnClass = "flex-1 md:flex-none text-[10px] xs:text-xs sm:text-sm h-8 sm:h-10 px-1 sm:px-4 whitespace-nowrap";

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-background p-4 rounded-lg shadow border border-muted">
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
              <button onClick={() => setShowFilters(false)} className="text-muted-foreground hover:text-foreground ml-2">
                <XCircle size={18} />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <AutocompleteInput label="Filter by Destination" options={filteredDestinationOptions} value={destFilter} onSelect={setDestFilter} placeholder="Search destination..." />
            <AutocompleteInput label="Filter by Consignor" options={filteredConsignorOptions} value={consignorFilter} onSelect={setConsignorFilter} placeholder="Search consignor..." />
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Filter by Consignee</label>
              <MultiSelect options={filteredConsigneeOptions} selected={consigneeFilter} onChange={setConsigneeFilter} placeholder="Select consignees..." searchPlaceholder="Search..." emptyPlaceholder="None found." />
            </div>
          </div>
          <DateFilterButtons filterType={filterType} setFilterType={setFilterType} customStart={customStart} setCustomStart={setCustomStart} customEnd={customEnd} setCustomEnd={setCustomEnd} />
        </div>
      )}

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
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Qty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted">
              {paginatedData.map((gc) => {
                const consignor = consignors.find(c => c.id === gc.consignorId);
                const consignee = consignees.find(c => c.id === gc.consigneeId);
                const status = getGcStatus(gc.gcNo);
                return (
                  <tr key={gc.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-4"><input type="checkbox" className="h-4 w-4 accent-primary" checked={selectedGcIds.includes(gc.gcNo)} onChange={(e) => handleSelectRow(e, gc.gcNo)} /></td>
                    <td className="px-6 py-4 text-sm font-semibold text-primary">{gc.gcNo}</td>
                    <td className="px-6 py-4 text-sm">{consignor?.name}</td>
                    <td className="px-6 py-4 text-sm">{consignee?.name}</td>
                    <td className="px-6 py-4 text-sm">{gc.destination}</td>
                    <td className="px-6 py-4 text-sm">₹{(parseFloat(gc.billValue) || 0).toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 text-sm">{gc.quantity}</td>
                    <td className="px-6 py-4 text-sm"><span className={`px-2 py-1 rounded-full text-xs font-medium ${status !== '0' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>{status !== '0' ? `TS# ${status}` : 'Pending'}</span></td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      <button onClick={() => handleEdit(gc.gcNo)} className="text-blue-600 hover:text-blue-800"><FilePenLine size={18} /></button>
                      <button onClick={() => handlePrintSingle(gc.gcNo)} className="text-green-600 hover:text-green-800"><Printer size={18} /></button>
                      <button onClick={() => handleDelete(gc.gcNo)} className="text-destructive hover:text-destructive/80"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <div className="block md:hidden divide-y divide-muted">
           {paginatedData.map((gc) => {
             const consignor = consignors.find(c => c.id === gc.consignorId);
             const consignee = consignees.find(c => c.id === gc.consigneeId);
             const status = getGcStatus(gc.gcNo);
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

                <div className="flex justify-between items-center mt-3 pt-3 border-t border-dashed border-muted">
                   <div className="text-sm font-medium">
                      Bill Value: ₹{(parseFloat(gc.billValue) || 0).toLocaleString('en-IN')}
                   </div>
                   <div className={`text-sm font-bold ${status !== '0' ? 'text-green-600' : 'text-muted-foreground'}`}>
                      Status: {status !== '0' ? status : '0'}
                   </div>
                </div>
             </div>
          )})}
        </div>

        {filteredGcEntries.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No GC Entries match the selected filters.
            </div>
        )}

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
