import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FilePenLine, Trash2, Search, Printer } from 'lucide-react';
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
  // 1. Added tripSheets to the destructuring
  const { gcEntries, deleteGcEntry, consignors, consignees, getUniqueDests, tripSheets } = useData();
  
  // --- Filter State ---
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [destFilter, setDestFilter] = useState('');
  const [consignorFilter, setConsignorFilter] = useState('');
  const [consigneeFilter, setConsigneeFilter] = useState<string[]>([]);

  // --- Selection and Delete State ---
  const [selectedGcIds, setSelectedGcIds] = useState<string[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // --- Printing State ---
  const [printingJobs, setPrintingJobs] = useState<GcPrintJob[] | null>(null);
  
  // --- Helper: Get Status (TS No or 0) ---
  const getGcStatus = (gcId: string) => {
    const foundSheet = tripSheets.find(sheet => 
      sheet.items?.some(item => item.gcNo === gcId)
    );
    return foundSheet ? foundSheet.mfNo : '0';
  };
  
  // --- ALL OPTIONS (Memoized) ---
  const allConsignorOptions = useMemo(() => 
    consignors.map(c => ({ value: c.id, label: c.name })), [consignors]);
    
  const allConsigneeOptions = useMemo(() => 
    consignees.map(c => ({ value: c.id, label: c.name })), [consignees]);
    
  const allDestinationOptions = useMemo(getUniqueDests, [getUniqueDests]);

  // --- CASCADING FILTER LOGIC ---
  const {
    filteredConsignorOptions,
    filteredConsigneeOptions,
    filteredDestinationOptions,
  } = useMemo(() => {
    let relevantConsignors = new Set(consignors.map(c => c.id));
    let relevantConsignees = new Set(consignees.map(c => c.id));
    let relevantDests = new Set(allDestinationOptions.map(d => d.value));

    // --- Step 1: Filter by Destination ---
    if (destFilter) {
      const gcNors = new Set(gcEntries.filter(gc => gc.destination === destFilter).map(gc => gc.consignorId));
      const gcNees = new Set(gcEntries.filter(gc => gc.destination === destFilter).map(gc => gc.consigneeId));
      const neeNors = new Set(consignees.filter(c => c.destination === destFilter).map(c => c.consignorId).filter(Boolean) as string[]);
      const neeNees = new Set(consignees.filter(c => c.destination === destFilter).map(c => c.id));
      
      relevantConsignors = new Set([...gcNors, ...neeNors]);
      relevantConsignees = new Set([...gcNees, ...neeNees]);
    }

    // --- Step 2: Filter by Consignor (intersect with previous results) ---
    if (consignorFilter) {
      const gcNees = new Set(gcEntries.filter(gc => gc.consignorId === consignorFilter).map(gc => gc.consigneeId));
      const gcDests = new Set(gcEntries.filter(gc => gc.consignorId === consignorFilter).map(gc => gc.destination));
      const neeNees = new Set(consignees.filter(c => c.consignorId === consignorFilter).map(c => c.id));
      const neeDests = new Set(consignees.filter(c => c.consignorId === consignorFilter).map(c => c.destination));

      const validNees = new Set([...gcNees, ...neeNees]);
      const validDests = new Set([...gcDests, ...neeDests]);

      relevantConsignees = new Set([...relevantConsignees].filter(id => validNees.has(id)));
      relevantDests = new Set([...relevantDests].filter(dest => validDests.has(dest)));
    }
    
    // --- Step 3: Filter by Consignee (intersect with previous results) ---
    if (consigneeFilter.length > 0) {
      const gcNors = new Set(gcEntries.filter(gc => consigneeFilter.includes(gc.consigneeId)).map(gc => gc.consignorId));
      const gcDests = new Set(gcEntries.filter(gc => consigneeFilter.includes(gc.consigneeId)).map(gc => gc.destination));
      const neeNors = new Set(consignees.filter(c => consigneeFilter.includes(c.id)).map(c => c.consignorId).filter(Boolean) as string[]);
      const neeDests = new Set(consignees.filter(c => consigneeFilter.includes(c.id)).map(c => c.destination));

      const validNors = new Set([...gcNors, ...neeNors]);
      const validDests = new Set([...gcDests, ...neeDests]);
      
      relevantConsignors = new Set([...relevantConsignors].filter(id => validNors.has(id)));
      relevantDests = new Set([...relevantDests].filter(dest => validDests.has(dest)));
    }

    // --- Final Output ---
    return {
      filteredConsignorOptions: allConsignorOptions.filter(opt => relevantConsignors.has(opt.value)),
      filteredConsigneeOptions: allConsigneeOptions.filter(opt => relevantConsignees.has(opt.value)),
      filteredDestinationOptions: allDestinationOptions.filter(opt => relevantDests.has(opt.value)),
    };

  }, [destFilter, consignorFilter, consigneeFilter, gcEntries, consignors, consignees, allConsignorOptions, allConsigneeOptions, allDestinationOptions]);

  // --- Effects to clear dependent filters if they become invalid ---
  useEffect(() => {
    if (consignorFilter && !filteredConsignorOptions.find(opt => opt.value === consignorFilter)) {
      setConsignorFilter('');
    }
  }, [consignorFilter, filteredConsignorOptions]);

  useEffect(() => {
    if (consigneeFilter.length > 0) {
      const validSelected = consigneeFilter.filter(id => 
        filteredConsigneeOptions.find(opt => opt.value === id)
      );
      if (validSelected.length !== consigneeFilter.length) {
        setConsigneeFilter(validSelected);
      }
    }
  }, [consigneeFilter, filteredConsigneeOptions]);

  useEffect(() => {
    if (destFilter && !filteredDestinationOptions.find(opt => opt.value === destFilter)) {
      setDestFilter('');
    }
  }, [destFilter, filteredDestinationOptions]);


  // --- Filtering (Memoized) ---
  const filteredGcEntries = useMemo(() => {
    return gcEntries.filter(gc => {
      const consignor = consignors.find(c => c.id === gc.consignorId);
      
      const searchMatch = 
        gc.id.toLowerCase().includes(search.toLowerCase()) ||
        (consignor && consignor.name.toLowerCase().includes(search.toLowerCase()));
      
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
  }, [gcEntries, consignors, search, filterType, customStart, customEnd, destFilter, consignorFilter, consigneeFilter]);
  
  // --- Pagination ---
  const {
    paginatedData,
    currentPage,
    setCurrentPage,
    totalPages,
    itemsPerPage,
    setItemsPerPage,
    totalItems,
  } = usePagination({ data: filteredGcEntries, initialItemsPerPage: 10 });

  // --- Action Handlers ---
  const handleEdit = (gcNo: string) => {
    navigate(`/gc-entry/edit/${gcNo}`);
  };
  const handleDelete = (gcNo: string) => {
    setDeletingId(gcNo);
    setIsConfirmOpen(true);
  };
  const handleConfirmDelete = () => {
    if (deletingId) deleteGcEntry(deletingId);
    setIsConfirmOpen(false);
    setDeletingId(null);
  };
  
  // --- Print Handlers ---
  const handlePrintSingle = (gcNo: string) => {
    const gc = gcEntries.find(g => g.id === gcNo);
    if (!gc) return;
    const consignor = consignors.find(c => c.id === gc.consignorId);
    const consignee = consignees.find(c => c.id === gc.consigneeId);
    
    if (consignor && consignee) setPrintingJobs([{ gc, consignor, consignee }]);
    else alert("Error: Consignor or Consignee data missing for this GC.");
  };
  
  const handlePrintSelected = () => {
    if (selectedGcIds.length === 0) return;
    
    const jobs: GcPrintJob[] = selectedGcIds.map(id => {
      const gc = gcEntries.find(g => g.id === id);
      if (!gc) return null;
      const consignor = consignors.find(c => c.id === gc.consignorId);
      const consignee = consignees.find(c => c.id === gc.consigneeId);
      if (!consignor || !consignee) return null;
      return { gc, consignor, consignee };
    }).filter(Boolean) as GcPrintJob[];

    if (jobs.length > 0) {
      setPrintingJobs(jobs);
      setSelectedGcIds([]);
    }
  };

  // --- Selection Handlers ---
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedGcIds(filteredGcEntries.map(gc => gc.id));
    } else {
      setSelectedGcIds([]);
    }
  };
  const handleSelectRow = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    if (e.target.checked) setSelectedGcIds(prev => [...prev, id]);
    else setSelectedGcIds(prev => prev.filter(gcId => gcId !== id));
  };
  
  const isAllSelected = filteredGcEntries.length > 0 && selectedGcIds.length === filteredGcEntries.length;

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <h1 className="text-3xl font-bold text-foreground">GC Entry Listing</h1>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <Button 
            variant="secondary"
            onClick={handlePrintSelected}
            disabled={selectedGcIds.length === 0}
            className="w-full sm:w-auto"
          >
            <Printer size={16} className="mr-2" />
            Print Selected ({selectedGcIds.length})
          </Button>
          <Button 
            variant="primary"
            onClick={() => navigate('/gc-entry/new')}
            className="w-full sm:w-auto"
          >
            + Add New GC Entry
          </Button>
        </div>
      </div>

      {/* 2. Search and Filter */}
      <div className="space-y-4 p-4 bg-background rounded-lg shadow border border-muted">
        <div className="relative">
          <input
  type="text"
  placeholder="Search by GC No or Consignor Name..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  // ADDED: bg-background text-foreground
  className="w-full pl-10 pr-4 py-2 bg-background text-foreground border border-muted-foreground/30 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
/>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AutocompleteInput
            label="Filter by Destination"
            options={filteredDestinationOptions}
            value={destFilter}
            onSelect={setDestFilter}
            placeholder="Type to search destination..."
          />
          <AutocompleteInput
            label="Filter by Consignor"
            options={filteredConsignorOptions} 
            value={consignorFilter}
            onSelect={setConsignorFilter}
            placeholder="Type to search consignor..."
          />
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-muted-foreground mb-1">Filter by Consignee (Multi-select)</label>
            <MultiSelect
              options={filteredConsigneeOptions} 
              selected={consigneeFilter}
              onChange={setConsigneeFilter}
              placeholder="Select consignees..."
              searchPlaceholder="Search consignee..."
              emptyPlaceholder="No consignee found."
            />
          </div>
        </div>
        
        <DateFilterButtons
          filterType={filterType}
          setFilterType={setFilterType}
          customStart={customStart}
          setCustomStart={setCustomStart}
          customEnd={customEnd}
          setCustomEnd={setCustomEnd}
        />
      </div>

      {/* 3. Responsive Data Display (WITH PAGINATION INSIDE) */}
      <div className="bg-background rounded-lg shadow border border-muted overflow-hidden">
        {/* --- DESKTOP TABLE --- */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-muted">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-primary border-muted-foreground/30 rounded focus:ring-primary"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">GC No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Consignor Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Consignee Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Destination</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Bill Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Case Qty</th>
                {/* Added Status Column */}
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted">
              {/* Map over paginatedData */}
              {paginatedData.map((gc) => {
                const consignor = consignors.find(c => c.id === gc.consignorId);
                const consignee = consignees.find(c => c.id === gc.consigneeId);
                const status = getGcStatus(gc.id);

                return (
                  <tr key={gc.id}>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-primary border-muted-foreground/30 rounded focus:ring-primary"
                        checked={selectedGcIds.includes(gc.id)}
                        onChange={(e) => handleSelectRow(e, gc.id)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-primary">{gc.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{consignor?.name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{consignee?.name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{gc.destination}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">₹{(parseFloat(gc.billValue) || 0).toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{gc.quantity}</td>
                    {/* Status Cell */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${status !== '0' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                      <button onClick={() => handleEdit(gc.id)} className="text-blue-600 hover:text-blue-800" title="Edit">
                        <FilePenLine size={18} />
                      </button>
                      <button onClick={() => handlePrintSingle(gc.id)} className="text-green-600 hover:text-green-800" title="Print">
                        <Printer size={18} />
                      </button>
                      <button onClick={() => handleDelete(gc.id)} className="text-destructive hover:text-destructive/80" title="Delete">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* --- MOBILE CARD LIST --- */}
        <div className="block md:hidden divide-y divide-muted">
          {/* Map over paginatedData */}
          {paginatedData.map((gc) => {
             const consignor = consignors.find(c => c.id === gc.consignorId);
             const consignee = consignees.find(c => c.id === gc.consigneeId);
             const status = getGcStatus(gc.id);
            return (
              <div key={gc.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-primary border-muted-foreground/30 rounded focus:ring-primary mt-1.5"
                      checked={selectedGcIds.includes(gc.id)}
                      onChange={(e) => handleSelectRow(e, gc.id)}
                    />
                    <div>
                      <div className="text-lg font-semibold text-primary">GC #{gc.id}</div>
                      <div className="text-md font-medium text-foreground">{consignor?.name || 'N/A'}</div>
                      <div className="text-sm text-muted-foreground">To: {consignee?.name || 'N/A'}</div>
                      <div className="text-sm text-muted-foreground">At: {gc.destination}</div>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-3 pt-1">
                    <button onClick={() => handleEdit(gc.id)} className="text-blue-600" title="Edit">
                      <FilePenLine size={18} />
                    </button>
                    <button onClick={() => handlePrintSingle(gc.id)} className="text-green-600" title="Print">
                      <Printer size={18} />
                    </button>
                    <button onClick={() => handleDelete(gc.id)} className="text-destructive" title="Delete">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between mt-2 pt-2 border-t border-muted">
                  <span className="text-sm font-medium">Bill Value: <span className="text-foreground">₹{(parseFloat(gc.billValue) || 0).toLocaleString('en-IN')}</span></span>
                  <span className="text-sm font-medium">Status: <span className={`font-bold ${status !== '0' ? 'text-green-600' : 'text-muted-foreground'}`}>{status}</span></span>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* --- PAGINATION MOVED INSIDE THE CONTAINER --- */}
        {totalPages > 0 && (
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
        )}
      </div>

      {/* No results message */}
      {filteredGcEntries.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No GC Entries found for the selected filters.
        </div>
      )}

      {/* Modals */}
      <ConfirmationDialog
        open={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete GC Entry"
        description={`Are you sure you want to delete GC No: ${deletingId}? This action cannot be undone.`}
      />
      {printingJobs && (
        <GcPrintManager
          jobs={printingJobs}
          onClose={() => setPrintingJobs(null)}
        />
      )}
    </div>
  );
};